import { createHash } from 'node:crypto';
import Database from 'better-sqlite3';

export type LedgerAction = 'approve' | 'reject' | 'edit' | 'export' | 'degrade';

export interface AppendInput {
  action: LedgerAction;
  /** Slack user id of the human (or system) performing the action. */
  actor: string;
  questionId: string;
  /**
   * The answer text at the moment of action. Only its hash is stored —
   * the ledger must never hold answer content verbatim (zero-copy).
   */
  answerHashInput: string;
  /** Slack permalinks / file ids supporting the answer. */
  evidenceRefs: string[];
}

export interface LedgerEntry {
  seq: number;
  ts: string;
  action: LedgerAction;
  actor: string;
  questionId: string;
  answerHash: string;
  evidenceHash: string;
  prevHash: string;
  hash: string;
}

export interface VerifyResult {
  ok: boolean;
  entriesChecked: number;
  /** Sequence number of the first entry that fails verification. */
  firstBadSeq?: number;
}

const GENESIS = 'GENESIS';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function entryHash(e: Omit<LedgerEntry, 'hash'>): string {
  return sha256(
    [e.seq, e.ts, e.action, e.actor, e.questionId, e.answerHash, e.evidenceHash, e.prevHash].join('|'),
  );
}

/**
 * Append-only, hash-chained approval ledger.
 *
 * Every review action chains to the previous entry's hash; `verify()`
 * recomputes the whole chain so any post-hoc edit to any field of any row
 * is detectable. Answer text enters only as a SHA-256 hash.
 */
export class Ledger {
  private constructor(private readonly db: Database.Database) {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS ledger (
           seq INTEGER PRIMARY KEY,
           ts TEXT NOT NULL,
           action TEXT NOT NULL,
           actor TEXT NOT NULL,
           question_id TEXT NOT NULL,
           answer_hash TEXT NOT NULL,
           evidence_hash TEXT NOT NULL,
           prev_hash TEXT NOT NULL,
           hash TEXT NOT NULL
         )`,
      )
      .run();
  }

  static inMemory(): Ledger {
    return new Ledger(new Database(':memory:'));
  }

  static atPath(path: string): Ledger {
    return new Ledger(new Database(path));
  }

  append(input: AppendInput): LedgerEntry {
    const prev = this.lastEntry();
    const partial: Omit<LedgerEntry, 'hash'> = {
      seq: (prev?.seq ?? -1) + 1,
      ts: new Date().toISOString(),
      action: input.action,
      actor: input.actor,
      questionId: input.questionId,
      answerHash: sha256(input.answerHashInput),
      evidenceHash: sha256(input.evidenceRefs.slice().sort().join('\n')),
      prevHash: prev?.hash ?? GENESIS,
    };
    const entry: LedgerEntry = { ...partial, hash: entryHash(partial) };
    this.db
      .prepare(
        `INSERT INTO ledger (seq, ts, action, actor, question_id, answer_hash, evidence_hash, prev_hash, hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        entry.seq,
        entry.ts,
        entry.action,
        entry.actor,
        entry.questionId,
        entry.answerHash,
        entry.evidenceHash,
        entry.prevHash,
        entry.hash,
      );
    return entry;
  }

  entries(): LedgerEntry[] {
    const rows = this.db.prepare('SELECT * FROM ledger ORDER BY seq').all() as Array<{
      seq: number;
      ts: string;
      action: LedgerAction;
      actor: string;
      question_id: string;
      answer_hash: string;
      evidence_hash: string;
      prev_hash: string;
      hash: string;
    }>;
    return rows.map((r) => ({
      seq: r.seq,
      ts: r.ts,
      action: r.action,
      actor: r.actor,
      questionId: r.question_id,
      answerHash: r.answer_hash,
      evidenceHash: r.evidence_hash,
      prevHash: r.prev_hash,
      hash: r.hash,
    }));
  }

  verify(): VerifyResult {
    const all = this.entries();
    let prevHash = GENESIS;
    for (const e of all) {
      const { hash, ...rest } = e;
      if (e.prevHash !== prevHash || entryHash(rest) !== hash) {
        return { ok: false, entriesChecked: all.length, firstBadSeq: e.seq };
      }
      prevHash = hash;
    }
    return { ok: true, entriesChecked: all.length };
  }

  private lastEntry(): LedgerEntry | undefined {
    return this.entries().at(-1);
  }

  /**
   * Test-only backdoor to simulate an attacker editing the underlying store.
   * Never called from production code paths.
   */
  _tamperForTest(
    seq: number,
    changes: Partial<Pick<LedgerEntry, 'actor' | 'answerHash' | 'action'>>,
    opts: { rehashSelf?: boolean } = {},
  ): void {
    const target = this.entries().find((e) => e.seq === seq);
    if (!target) throw new Error(`no ledger entry with seq ${seq}`);
    const updated = { ...target, ...changes };
    const hash = opts.rehashSelf
      ? entryHash({ ...updated })
      : updated.hash;
    this.db
      .prepare('UPDATE ledger SET actor = ?, answer_hash = ?, action = ?, hash = ? WHERE seq = ?')
      .run(updated.actor, updated.answerHash, updated.action, hash, seq);
  }
}
