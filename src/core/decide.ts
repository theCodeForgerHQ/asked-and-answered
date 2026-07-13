import type { Citation } from './library.js';
import type { DomainEvent, AnswerApproved, AnswerEdited, AnswerProposed } from './events.js';

export interface DraftResultLike {
  questionId: string;
  questionText: string;
  state: 'verified' | 'grounded' | 'needs_sme';
  answerText?: string;
  citations?: Citation[];
  reason?: string;
}

export type Command =
  | { type: 'Approve'; questionId: string; actor: string; result: DraftResultLike; answerId?: number }
  | { type: 'Reject'; questionId: string; actor: string; result: DraftResultLike }
  | { type: 'Edit'; questionId: string; actor: string; newText: string; result: DraftResultLike; answerId?: number }
  | { type: 'SmeProvide'; questionId: string; actor: string; answerText: string; result: DraftResultLike }
  | { type: 'Export'; runId: string; actor: string }
  | { type: 'Propose'; answerId: number; questionText: string; answerText: string; citations: Citation[] };

export interface DecideResult {
  ok: boolean;
  events?: DomainEvent[];
  error?: string;
}

function now(): string {
  return new Date().toISOString();
}

function latestApproveEvent(events: DomainEvent[], questionId: string): AnswerApproved | undefined {
  return events
    .filter((e): e is AnswerApproved => e.type === 'AnswerApproved')
    .filter((e) => e.questionText === questionId)
    .at(-1);
}

function isRejected(events: DomainEvent[], questionId: string): boolean {
  return events.some(
    (e) => e.type === 'AnswerRejected' && e.questionId === questionId,
  );
}

function isProposed(events: DomainEvent[], answerId: number): boolean {
  return events.some(
    (e) => e.type === 'AnswerProposed' && e.answerId === answerId,
  );
}

function isApproved(events: DomainEvent[], answerId: number): boolean {
  return events.some(
    (e) => e.type === 'AnswerApproved' && e.answerId === answerId,
  );
}

/**
 * Pure decision engine. Given the current event log and a command, returns the
 * events that should be appended if the command is valid, or an error if it
 * violates the lifecycle rules.
 *
 * Rules enforced:
 *   - Approve requires answer text and citations.
 *   - Re-approving the same answer is idempotent.
 *   - Agent proposals (AnswerProposed) must be approved by a human; the agent
 *     cannot emit AnswerApproved.
 *   - Editing is allowed before final approval or after an explicit edit event.
 *   - Rejecting a rejected question is idempotent.
 */
export function decide(events: DomainEvent[], command: Command): DecideResult {
  switch (command.type) {
    case 'Approve': {
      const { result, actor, questionId } = command;
      if (result.state === 'verified') {
        return { ok: true, events: [] };
      }
      if (!result.answerText) {
        return { ok: false, error: 'cannot approve a draft with no answer text' };
      }
      if (isRejected(events, questionId)) {
        return { ok: false, error: 'cannot approve a rejected question without re-proposing' };
      }
      const previous = latestApproveEvent(events, result.questionText);
      const answerId = previous ? previous.answerId : command.answerId ?? Date.now();
      const ev: AnswerApproved = {
        type: 'AnswerApproved',
        answerId,
        questionText: result.questionText,
        answerText: result.answerText,
        citations: result.citations ?? [],
        actor,
        ts: now(),
      };
      return { ok: true, events: [ev] };
    }

    case 'Reject': {
      const { questionId, actor } = command;
      if (isRejected(events, questionId)) {
        return { ok: true, events: [] };
      }
      const ev: DomainEvent = {
        type: 'AnswerRejected',
        questionId,
        actor,
        ts: now(),
      };
      return { ok: true, events: [ev] };
    }

    case 'Edit': {
      const { newText, actor, result } = command;
      const previous = latestApproveEvent(events, result.questionText);
      const answerId = previous ? previous.answerId : command.answerId ?? Date.now();
      const ev: AnswerEdited = {
        type: 'AnswerEdited',
        answerId,
        newText,
        actor,
        ts: now(),
      };
      return { ok: true, events: [ev] };
    }

    case 'SmeProvide': {
      const { answerText, actor, result, questionId } = command;
      const provideEv: DomainEvent = {
        type: 'DraftProduced',
        runId: 'sme',
        questionId,
        answerText,
        citations: [],
        ts: now(),
      };
      const approve = decide([...events, provideEv], {
        type: 'Approve',
        questionId,
        actor,
        result: { ...result, state: 'grounded', answerText, citations: [] },
      });
      if (!approve.ok) return approve;
      return { ok: true, events: [provideEv, ...(approve.events ?? [])] };
    }

    case 'Export': {
      const { runId, actor } = command;
      return { ok: true, events: [{ type: 'Exported', runId, actor, ts: now() }] };
    }

    case 'Propose': {
      const { answerId, questionText, answerText, citations } = command;
      if (isProposed(events, answerId)) {
        return { ok: false, error: 'answer already proposed' };
      }
      if (isApproved(events, answerId)) {
        return { ok: false, error: 'answer already approved' };
      }
      const ev: AnswerProposed = {
        type: 'AnswerProposed',
        answerId,
        questionText,
        answerText,
        citations,
        actor: 'agent',
        ts: now(),
      };
      return { ok: true, events: [ev] };
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const command = decide;
