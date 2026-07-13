import { describe, test, expect } from 'vitest';
import { sendForApprovalBlocks, approvalRequestBlocks } from '../src/slack/blocks.js';
import { InMemorySessionStore, SqliteSessionStore } from '../src/slack/sessionStore.js';
import { ReviewSession } from '../src/slack/flows.js';
import { AnswerLibrary } from '../src/core/library.js';
import { Ledger } from '../src/core/ledger.js';
import { EvidenceGraph } from '../src/core/evidenceGraph.js';
import { Watcher } from '../src/core/watcher.js';
import { InMemoryAlertLog } from '../src/core/alertLog.js';
import { InMemoryUserTokenStore, SqliteUserTokenStore } from '../src/slack/oauth.js';
import type { DraftResult, DraftingLlm } from '../src/core/pipeline.js';
import type { RunDeps } from '../src/slack/flows.js';
import type { QueryPlanner } from '../src/core/planner.js';

function draft(overrides: Partial<DraftResult> = {}): DraftResult {
  return {
    questionId: 'q1',
    questionText: 'Do you encrypt data at rest?',
    state: 'grounded',
    answerText: 'Yes — AES-256.',
    citations: [{ permalink: 'https://s.example/enc', channelId: 'C1', ts: '1.0' }],
    ...overrides,
  };
}

function deps(): RunDeps {
  return {
    library: AnswerLibrary.inMemory(),
    ledger: Ledger.inMemory(),
    llm: {} as DraftingLlm,
    visibility: { canSee: async () => true },
    planner: {} as QueryPlanner,
  };
}

describe('second-human approval surface', () => {
  test('sendForApprovalBlocks carries the run ref and an approver picker', () => {
    const blocks = sendForApprovalBlocks({ questionText: 'Q?', ref: 'run1:q1', confirmerId: 'U_CONFIRMER' });
    const json = JSON.stringify(blocks);
    expect(json).toContain('approver_selected');
    expect(json).toContain('ref:run1:q1');
    expect(json).toContain('U_CONFIRMER');
  });

  test('approvalRequestBlocks renders the confirmed card with an Approve button', () => {
    const blocks = approvalRequestBlocks({
      result: draft(),
      requesterId: 'U_REQ',
      confirmerId: 'U_CONFIRMER',
      runId: 'run1',
    });
    const json = JSON.stringify(blocks);
    expect(json).toContain('approve_answer');
    expect(json).toContain('reject_answer');
    expect(json).toContain('run1:q1');
    expect(json).toContain('U_REQ');
  });

  test('a different human approving after confirm saves to the library', () => {
    const d = deps();
    const session = new ReviewSession([draft()], { total: 1, deduped: 1, verified: 0, grounded: 1, needsSme: 0 }, d, 'U_REQ');
    session.confirm('q1', 'U_CONFIRMER', session.runId);
    const result = session.approve('q1', 'U_APPROVER', session.runId);
    expect(result.state).toBe('verified');
    expect(result.approvedBy).toBe('U_APPROVER');
    expect(d.library.allAnswers()).toHaveLength(1);
  });
});

describe('session origin persistence', () => {
  for (const [label, store] of [
    ['in-memory', new InMemorySessionStore()],
    ['sqlite', SqliteSessionStore.inMemory()],
  ] as const) {
    test(`${label} store round-trips origin channel/thread`, () => {
      const session = new ReviewSession([draft()], { total: 1, deduped: 1, verified: 0, grounded: 1, needsSme: 0 }, deps(), 'U_REQ');
      session.originChannel = 'D_ORIGIN';
      session.originThreadTs = '111.222';
      store.save({
        runId: session.runId,
        requesterId: session.requesterId,
        results: session.results,
        counts: session.counts,
        originChannel: session.originChannel,
        originThreadTs: session.originThreadTs,
        updatedAt: new Date().toISOString(),
      });
      const loaded = store.load(session.runId);
      expect(loaded?.originChannel).toBe('D_ORIGIN');
      expect(loaded?.originThreadTs).toBe('111.222');
      const restored = ReviewSession.fromState(loaded!, deps());
      expect(restored.originChannel).toBe('D_ORIGIN');
      expect(restored.originThreadTs).toBe('111.222');
    });
  }
});

describe('watcher alert log dedup', () => {
  test('does not re-alert an answer already in the alert log (restart survival)', () => {
    const graph = new EvidenceGraph();
    const library = AnswerLibrary.inMemory(graph);
    library.saveApproved({
      questionText: 'Is MFA enforced?',
      answerText: 'MFA is not enforced for employees.',
      citations: [{ permalink: 'p/old', channelId: 'C1', ts: '1.0' }],
      approvedBy: 'U_SME',
    });
    // Newer contradicting evidence makes the answer stale.
    library.observeEvidence('p/new', 'C1', '2.0', 'MFA is enforced for every employee via Okta.');

    const log = new InMemoryAlertLog();
    let alerts = 0;
    const w1 = new Watcher(library, graph, { onStale: () => void alerts++, alertLog: log });
    w1.scan();
    expect(alerts).toBe(1);

    // Simulated restart: new Watcher instance, same durable log.
    const w2 = new Watcher(library, graph, { onStale: () => void alerts++, alertLog: log });
    w2.scan();
    expect(alerts).toBe(1);
  });
});

describe('evidence graph re-observation and supersession', () => {
  test('backfilled citation snippet triggers contradiction detection', () => {
    const graph = new EvidenceGraph();
    const library = AnswerLibrary.inMemory(graph);
    const saved = library.saveApproved({
      questionText: 'Is MFA enforced?',
      answerText: 'MFA is not enforced for employees.',
      citations: [{ permalink: 'p/cite', channelId: 'C1', ts: '1.0' }],
      approvedBy: 'U_SME',
    });
    // The citation was indexed with an empty snippet at approval time; the
    // real message text contradicts the claim and must now be detected.
    library.observeEvidence('p/cite', 'C1', '1.0', 'MFA is enforced for every employee.');
    expect(graph.isStale(saved.id)).toBe(true);
  });

  test('newer same-topic evidence in the same channel supersedes older evidence', () => {
    const graph = new EvidenceGraph();
    graph.addEvidence({
      id: 'evidence:p/old',
      kind: 'evidence',
      permalink: 'p/old',
      channelId: 'C1',
      ts: '1.0',
      snippet: 'Customer data retention period is 30 days for all backups.',
      observedAt: '2026-01-01',
    });
    graph.addEvidence({
      id: 'evidence:p/new',
      kind: 'evidence',
      permalink: 'p/new',
      channelId: 'C1',
      ts: '2.0',
      snippet: 'Customer data retention period is 90 days for all backups.',
      observedAt: '2026-02-01',
    });
    const edges = graph.edgesFrom('evidence:p/new');
    expect(edges.some((e) => e.kind === 'SUPERSEDES' && e.to === 'evidence:p/old')).toBe(true);
  });

  test('link is idempotent — duplicate edges are not appended', () => {
    const graph = new EvidenceGraph();
    graph.addNode({ id: 'a', kind: 'claim', text: 'x', sourceId: 's' });
    graph.addNode({ id: 'b', kind: 'claim', text: 'y', sourceId: 's' });
    graph.link('a', 'b', 'SUPPORTS');
    graph.link('a', 'b', 'SUPPORTS');
    expect(graph.edgesFrom('a')).toHaveLength(1);
  });
});

describe('library re-approval', () => {
  test('re-approving the same question makes the newest answer the one reused', async () => {
    const library = AnswerLibrary.inMemory();
    library.saveApproved({
      questionText: 'Is MFA enforced?',
      answerText: 'Old answer.',
      citations: [],
      approvedBy: 'U1',
      kind: 'sme_testimony',
    });
    library.saveApproved({
      questionText: 'Is MFA enforced?',
      answerText: 'New corrected answer.',
      citations: [],
      approvedBy: 'U2',
      kind: 'sme_testimony',
    });
    const lookup = await library.findVerified('Is MFA enforced?', 'U_REQ', { canSee: async () => true });
    expect(lookup.status).toBe('verified');
    if (lookup.status === 'verified') {
      expect(lookup.answer.answerText).toBe('New corrected answer.');
    }
  });
});

describe('user token scope matching', () => {
  test('sqlite store requires an exact scope, not a substring', () => {
    const store = SqliteUserTokenStore.inMemory();
    store.saveUserToken('U1', 'xoxp-test', ['search:read.public']);
    expect(store.hasUserTokenWithScope('search:read')).toBe(false);
    store.saveUserToken('U2', 'xoxp-test2', ['search:read']);
    expect(store.hasUserTokenWithScope('search:read')).toBe(true);
  });

  test('in-memory store behaves identically', () => {
    const store = new InMemoryUserTokenStore();
    store.saveUserToken('U1', 'xoxp-test', ['search:read.public']);
    expect(store.hasUserTokenWithScope('search:read')).toBe(false);
  });
});
