import { randomUUID } from 'node:crypto';
import type { AnswerLibrary, VisibilityChecker } from '../core/library.js';
import type { Ledger } from '../core/ledger.js';
import type { QueryPlanner } from '../core/planner.js';
import { DraftingPipeline, type DraftingLlm, type DraftResult } from '../core/pipeline.js';
import type { ParsedQuestionnaire } from '../core/types.js';
import type { PlanCounts } from './blocks.js';

export interface RunDeps {
  library: AnswerLibrary;
  ledger: Ledger;
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

  return new ReviewSession(results, counts, deps, requesterId);
}
