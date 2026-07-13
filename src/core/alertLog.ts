import Database from 'better-sqlite3';

/**
 * Durable record of which stale-answer alerts have already been sent.
 *
 * The Watcher's in-memory dedup only survives a single process lifetime, so
 * without this log every restart re-DMed approvers about the same stale
 * answers. The log is keyed by answer id.
 */
export interface AlertLog {
  has(answerId: number): boolean;
  markAlerted(answerId: number): void;
}

/** In-memory log for tests and single-process dev. */
export class InMemoryAlertLog implements AlertLog {
  private readonly ids = new Set<number>();

  has(answerId: number): boolean {
    return this.ids.has(answerId);
  }

  markAlerted(answerId: number): void {
    this.ids.add(answerId);
  }
}

/** SQLite-backed log that survives restarts. */
export class SqliteAlertLog implements AlertLog {
  private constructor(private readonly db: Database.Database) {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS stale_alerts (
           answer_id INTEGER PRIMARY KEY,
           alerted_at TEXT NOT NULL
         )`,
      )
      .run();
  }

  static inMemory(): SqliteAlertLog {
    return new SqliteAlertLog(new Database(':memory:'));
  }

  static atPath(path: string): SqliteAlertLog {
    return new SqliteAlertLog(new Database(path));
  }

  has(answerId: number): boolean {
    const row = this.db.prepare('SELECT 1 AS found FROM stale_alerts WHERE answer_id = ?').get(answerId) as
      | { found: number }
      | undefined;
    return row?.found === 1;
  }

  markAlerted(answerId: number): void {
    this.db
      .prepare('INSERT OR REPLACE INTO stale_alerts (answer_id, alerted_at) VALUES (?, ?)')
      .run(answerId, new Date().toISOString());
  }
}
