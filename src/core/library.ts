import Database from 'better-sqlite3';

/**
 * A pointer to evidence living in Slack. Zero-copy: we never store the
 * message/file content itself — only enough to re-locate and re-check it.
 */
export interface Citation {
  permalink: string;
  channelId: string;
  ts: string;
}

export interface ApprovedAnswer {
  id: number;
  questionText: string;
  answerText: string;
  citations: Citation[];
  approvedBy: string;
  approvedAt: string;
}

export interface SaveApprovedInput {
  questionText: string;
  answerText: string;
  citations: Citation[];
  approvedBy: string;
}

/**
 * Answers whether `userId` can currently see the Slack content behind a
 * citation. Production implementation checks channel membership /
 * conversations.info; tests inject a fake.
 */
export interface VisibilityChecker {
  canSee(userId: string, citation: Citation): Promise<boolean>;
}

export type LibraryLookup =
  | { status: 'verified'; answer: ApprovedAnswer }
  | { status: 'degraded'; questionText: string; blockedCitations: string[] }
  | { status: 'miss' };

const TOKEN_OVERLAP_THRESHOLD = 0.8;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

/**
 * The approved-answer library.
 *
 * THE INVARIANT (enforced here, property-tested): answer text is returned
 * to a requester only when that requester can currently see EVERY citation
 * backing the answer. Anything less degrades to a redacted result that
 * carries no answer content.
 */
export class AnswerLibrary {
  private constructor(private readonly db: Database.Database) {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS answers (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           question_text TEXT NOT NULL,
           question_norm TEXT NOT NULL,
           answer_text TEXT NOT NULL,
           citations_json TEXT NOT NULL,
           approved_by TEXT NOT NULL,
           approved_at TEXT NOT NULL
         )`,
      )
      .run();
  }

  static inMemory(): AnswerLibrary {
    return new AnswerLibrary(new Database(':memory:'));
  }

  static atPath(path: string): AnswerLibrary {
    return new AnswerLibrary(new Database(path));
  }

  saveApproved(input: SaveApprovedInput): ApprovedAnswer {
    const approvedAt = new Date().toISOString();
    const info = this.db
      .prepare(
        `INSERT INTO answers (question_text, question_norm, answer_text, citations_json, approved_by, approved_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.questionText,
        normalize(input.questionText),
        input.answerText,
        JSON.stringify(input.citations),
        input.approvedBy,
        approvedAt,
      );
    return {
      id: Number(info.lastInsertRowid),
      questionText: input.questionText,
      answerText: input.answerText,
      citations: input.citations,
      approvedBy: input.approvedBy,
      approvedAt,
    };
  }

  /**
   * Look up an approved answer for `questionText` on behalf of `requesterId`.
   * Every citation is re-checked against the requester at lookup time —
   * approval in the past never grants visibility in the present.
   */
  async findVerified(
    questionText: string,
    requesterId: string,
    checker: VisibilityChecker,
  ): Promise<LibraryLookup> {
    const match = this.bestMatch(questionText);
    if (!match) return { status: 'miss' };

    const blocked: string[] = [];
    for (const citation of match.citations) {
      const visible = await checker.canSee(requesterId, citation);
      if (!visible) blocked.push(citation.permalink);
    }

    if (blocked.length > 0) {
      // Deliberately reconstructed without any answer fields: the compiler
      // and the property suite both guard against answer text riding along.
      return { status: 'degraded', questionText: match.questionText, blockedCitations: blocked };
    }

    return { status: 'verified', answer: match };
  }

  private bestMatch(questionText: string): ApprovedAnswer | undefined {
    const norm = normalize(questionText);
    const rows = this.db.prepare('SELECT * FROM answers').all() as Array<{
      id: number;
      question_text: string;
      question_norm: string;
      answer_text: string;
      citations_json: string;
      approved_by: string;
      approved_at: string;
    }>;

    let best: { row: (typeof rows)[number]; score: number } | undefined;
    const queryTokens = tokens(questionText);
    for (const row of rows) {
      const score =
        row.question_norm === norm ? 1 : jaccard(queryTokens, tokens(row.question_text));
      if (score >= TOKEN_OVERLAP_THRESHOLD && (best === undefined || score > best.score)) {
        best = { row, score };
      }
    }
    if (!best) return undefined;

    return {
      id: best.row.id,
      questionText: best.row.question_text,
      answerText: best.row.answer_text,
      citations: JSON.parse(best.row.citations_json) as Citation[],
      approvedBy: best.row.approved_by,
      approvedAt: best.row.approved_at,
    };
  }
}
