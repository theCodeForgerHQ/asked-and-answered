import { describe, test, expect } from 'vitest';
import { runQuestionnaire, type RunDeps } from '../src/slack/flows.js';
import { AnswerLibrary } from '../src/core/library.js';
import { Ledger } from '../src/core/ledger.js';
import { LedgerV2 } from '../src/core/ledgerV2.js';
import { QueryPlanner, RateBudget, type RtsClient } from '../src/core/planner.js';
import type { DraftingLlm } from '../src/core/pipeline.js';
import { parseText } from '../src/core/parse.js';

const allVisible = { canSee: async () => true as const };

function depsV2(): RunDeps {
  const rts: RtsClient = {
    async searchContext({ query }) {
      if (query.includes('encrypt')) {
        return {
          hits: [
            { permalink: 'https://s.example/enc', channelId: 'C1', ts: '1.0', snippet: 'we use AES-256 KMS encryption at rest' },
          ],
        };
      }
      return { hits: [] };
    },
  };
  const llm: DraftingLlm = {
    async draft(_q, hits) {
      const snippet = hits[0]?.snippet ?? '';
      return { kind: 'answer', answerText: `Yes — ${snippet}.`, citedPermalinks: [hits[0]?.permalink ?? ''] };
    },
  };
  return {
    library: AnswerLibrary.inMemory(),
    ledger: Ledger.inMemory(),
    ledgerV2: LedgerV2.inMemory(),
    llm,
    visibility: allVisible,
    planner: new QueryPlanner(rts, {
      budget: new RateBudget({ maxPerWindow: 100, windowMs: 60_000 }),
      sleep: async () => {},
    }),
  };
}

describe('ReviewSession with LedgerV2', () => {
  test('runQuestionnaire emits lifecycle events to ledgerV2', async () => {
    const d = depsV2();
    const parsed = parseText('Do you encrypt data at rest?');
    const session = await runQuestionnaire(parsed, 'U_REQ', d, () => {});

    const events = d.ledgerV2!.entries();
    expect(events.some((e) => e.type === 'QuestionnaireIntaken')).toBe(true);
    expect(events.some((e) => e.type === 'EvidenceRetrieved')).toBe(true);
    expect(events.some((e) => e.type === 'DraftProduced')).toBe(true);

    session.approve('q1', 'U_SME');
    const afterApprove = d.ledgerV2!.entries();
    expect(afterApprove.some((e) => e.type === 'AnswerApproved')).toBe(true);
  });

  test('ledgerV2 verify passes after review actions', async () => {
    const d = depsV2();
    const parsed = parseText('Do you encrypt data at rest?');
    const session = await runQuestionnaire(parsed, 'U_REQ', d, () => {});
    session.approve('q1', 'U_SME');

    const verdict = d.ledgerV2!.verify();
    expect(verdict.ok).toBe(true);
  });
});
