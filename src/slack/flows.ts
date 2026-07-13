import { randomUUID } from 'node:crypto';
import type { AnswerLibrary, VisibilityChecker } from '../core/library.js';
import type { Ledger } from '../core/ledger.js';
import type { LedgerV2 } from '../core/ledgerV2.js';
import type { QueryPlanner } from '../core/planner.js';
import { DraftingPipeline, type DraftingLlm, type DraftResult } from '../core/pipeline.js';
import type { ParsedQuestionnaire } from '../core/types.js';
import type { PlanCounts } from './blocks.js';
import { decide } from '../core/decide.js';

export interface RunDeps {
  library: AnswerLibrary;
  ledger: Ledger;
  /** Optional event-sourced ledger v2. When present, review actions also emit DomainEvents. */
  ledgerV2?: LedgerV2;
  llm: DraftingLlm;
  visibility: VisibilityChecker;
  planner: QueryPlanner;
}

/**
 * One questionnaire run and its live review state. Action handlers mutate
 * the session; every human decision lands in the ledger, and approvals feed
 * the library so the next run starts more Verified than this one.
 */
export class ReviewSession {
  /** Unique per run; embedded in button payloads so a stale button from an
   *  earlier run in the same thread cannot act on this run's answers. */
  public readonly runId: string = randomUUID();

  constructor(
    public readonly results: DraftResult[],
    public readonly counts: PlanCounts,
    private readonly deps: RunDeps,
    public readonly requesterId: string,
  ) {}

  private mustFind(questionId: string): DraftResult {
    const r = this.results.find((x) => x.questionId === questionId);
    if (!r) throw new Error(`no question ${questionId} in this session`);
    return r;
  }

  private assertRun(runId?: string): void {
    if (runId !== undefined && runId !== this.runId) {
      throw new Error(`stale action: button belongs to a different run (${runId} ≠ ${this.runId})`);
    }
  }

  private emitEvents(events: import('../core/events.js').DomainEvent[]): void {
    if (!this.deps.ledgerV2) return;
    for (const ev of events) this.deps.ledgerV2.append(ev);
  }

  approve(questionId: string, actor: string, runId?: string): DraftResult {
    this.assertRun(runId);
    const r = this.mustFind(questionId);
    if (r.state === 'verified') {
      // Idempotent: re-clicking Approve on an already-verified answer is a
      // no-op, not a duplicate library row + ledger entry.
      return r;
    }
    if (!r.answerText) {
      throw new Error(`question ${questionId} has no draft to approve — route it to an SME instead`);
    }
    this.deps.ledger.append({
      action: 'approve',
      actor,
      questionId,
      answerHashInput: r.answerText,
      evidenceRefs: (r.citations ?? []).map((c) => c.permalink),
    });
    const decision = decide(this.deps.ledgerV2?.entries() ?? [], {
      type: 'Approve',
      questionId,
      actor,
      result: r,
    });
    if (decision.ok) this.emitEvents(decision.events ?? []);

    const citations = r.citations ?? [];
    const saved = this.deps.library.saveApproved({
      questionText: r.questionText,
      answerText: r.answerText,
      citations,
      approvedBy: actor,
      // No workspace evidence means the approver is the provenance — label
      // it as testimony instead of passing it off as evidence-backed.
      kind: citations.length > 0 ? 'evidence' : 'sme_testimony',
    });
    r.state = 'verified';
    r.approvedBy = actor;
    r.approvedAt = saved.approvedAt;
    delete r.reason;
    return r;
  }

  reject(questionId: string, actor: string, runId?: string): DraftResult {
    this.assertRun(runId);
    const r = this.mustFind(questionId);
    this.deps.ledger.append({
      action: 'reject',
      actor,
      questionId,
      answerHashInput: r.answerText ?? '',
      evidenceRefs: (r.citations ?? []).map((c) => c.permalink),
    });
    const decision = decide(this.deps.ledgerV2?.entries() ?? [], {
      type: 'Reject',
      questionId,
      actor,
      result: r,
    });
    if (decision.ok) this.emitEvents(decision.events ?? []);

    r.state = 'needs_sme';
    r.reason = 'rejected';
    delete r.answerText;
    delete r.citations;
    delete r.approvedBy;
    delete r.approvedAt;
    return r;
  }

  edit(questionId: string, actor: string, newText: string, runId?: string): DraftResult {
    this.assertRun(runId);
    const r = this.mustFind(questionId);
    this.deps.ledger.append({
      action: 'edit',
      actor,
      questionId,
      answerHashInput: newText,
      evidenceRefs: (r.citations ?? []).map((c) => c.permalink),
    });
    const decision = decide(this.deps.ledgerV2?.entries() ?? [], {
      type: 'Edit',
      questionId,
      actor,
      newText,
      result: r,
    });
    if (decision.ok) this.emitEvents(decision.events ?? []);

    r.answerText = newText;
    return r;
  }

  /** An SME answers a routed question directly; their answer is approved in one step. */
  smeProvide(questionId: string, smeId: string, answerText: string, runId?: string): DraftResult {
    this.assertRun(runId);
    const r = this.mustFind(questionId);
    r.answerText = answerText;
    r.state = 'grounded';
    delete r.reason;
    const decision = decide(this.deps.ledgerV2?.entries() ?? [], {
      type: 'SmeProvide',
      questionId,
      actor: smeId,
      answerText,
      result: r,
    });
    if (decision.ok) this.emitEvents(decision.events ?? []);
    return this.approve(questionId, smeId, this.runId);
  }

  recount(): PlanCounts {
    return {
      ...this.counts,
      verified: this.results.filter((r) => r.state === 'verified').length,
      grounded: this.results.filter((r) => r.state === 'grounded').length,
      needsSme: this.results.filter((r) => r.state === 'needs_sme').length,
    };
  }
}

export async function runQuestionnaire(
  parsed: ParsedQuestionnaire,
  requesterId: string,
  deps: RunDeps,
  onProgress: (message: string) => void,
): Promise<ReviewSession> {
  onProgress(
    `Parsed ${parsed.totalCandidates} questions → ${parsed.questions.length} after removing ${parsed.duplicatesRemoved} duplicates. Searching workspace evidence…`,
  );

  const evidence = await deps.planner.retrieve(parsed.questions, { strategy: 'per-question' });

  onProgress('Evidence retrieval complete. Drafting evidence-grounded answers…');

  const pipeline = new DraftingPipeline(deps.library, deps.llm, deps.visibility);
  const results = await pipeline.run(parsed.questions, evidence, requesterId);

  const counts: PlanCounts = {
    total: parsed.totalCandidates,
    deduped: parsed.questions.length,
    verified: results.filter((r) => r.state === 'verified').length,
    grounded: results.filter((r) => r.state === 'grounded').length,
    needsSme: results.filter((r) => r.state === 'needs_sme').length,
  };

  onProgress(
    `Done: ${counts.verified} verified, ${counts.grounded} grounded, ${counts.needsSme} routed to humans.`,
  );

  const session = new ReviewSession(results, counts, deps, requesterId);

  if (deps.ledgerV2) {
    deps.ledgerV2.append({
      type: 'QuestionnaireIntaken',
      runId: session.runId,
      questions: parsed.questions,
      requesterId,
      ts: new Date().toISOString(),
    });
    for (const [questionId, ev] of evidence.entries()) {
      deps.ledgerV2.append({
        type: 'EvidenceRetrieved',
        runId: session.runId,
        questionId,
        hits: ev.hits,
        ts: new Date().toISOString(),
      });
    }
    for (const r of results) {
      if (r.state === 'grounded' || r.state === 'verified') {
        deps.ledgerV2.append({
          type: 'DraftProduced',
          runId: session.runId,
          questionId: r.questionId,
          answerText: r.answerText ?? '',
          citations: r.citations ?? [],
          ts: new Date().toISOString(),
        });
      }
    }
  }

  return session;
}
