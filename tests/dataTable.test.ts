import { describe, test, expect } from 'vitest';
import { reviewDataTableBlocks } from '../src/slack/dataTable.js';
import type { DraftResult } from '../src/core/pipeline.js';

function result(overrides: Partial<DraftResult> & Pick<DraftResult, 'questionId' | 'state'>): DraftResult {
  return {
    questionText: `Question for ${overrides.questionId}`,
    ...overrides,
  } as DraftResult;
}

const MIXED: DraftResult[] = [
  result({
    questionId: 'q1',
    state: 'verified',
    answerText: 'Yes.',
    citations: [{ permalink: 'https://s.example/p1', channelId: 'C1', ts: '1.0' }],
    approvedBy: 'U_SME',
    approvedAt: '2026-07-11T10:00:00.000Z',
  }),
  result({
    questionId: 'q2',
    state: 'grounded',
    answerText: 'Quarterly restore drills.',
    citations: [{ permalink: 'https://s.example/p2', channelId: 'C2', ts: '2.0' }],
  }),
  result({ questionId: 'q3', state: 'needs_sme', reason: 'no_evidence' }),
];

describe('reviewDataTableBlocks with data_table', () => {
  test('emits a data_table block matching the live API schema (caption string + raw_text cell rows)', () => {
    // Live validation (views.publish): caption must be a string, `columns` is
    // an invalid property, and every row is an array of cell objects.
    const blocks = reviewDataTableBlocks(MIXED, { runId: 'run-abc', useDataTable: true });
    const table = blocks.find((b) => (b as { type?: string }).type === 'data_table') as {
      caption: unknown;
      columns?: unknown;
      rows: Array<Array<{ type: string; text: string }>>;
    };

    expect(table).toBeDefined();
    expect(typeof table.caption).toBe('string');
    expect(table.columns).toBeUndefined();
    // Header row + 3 result rows, each cell a raw_text object.
    expect(table.rows).toHaveLength(4);
    expect(table.rows[0]?.map((c) => c.text)).toEqual(['Question', 'Status', 'Answer preview', 'Citations']);
    expect(table.rows.flat().every((c) => c.type === 'raw_text')).toBe(true);
    expect(table.rows[1]?.[1]?.text).toBe('Verified');
    expect(table.rows[3]?.[1]?.text).toBe('Needs SME');
  });

  test('includes export xlsx action', () => {
    const blocks = reviewDataTableBlocks(MIXED, { runId: 'run-abc', useDataTable: true });
    const json = JSON.stringify(blocks);
    expect(json).toContain('export_xlsx');
  });
});

describe('reviewDataTableBlocks fallback sections', () => {
  test('renders section rows when data_table is disabled', () => {
    const blocks = reviewDataTableBlocks(MIXED, { runId: 'run-abc', useDataTable: false });
    const json = JSON.stringify(blocks);

    expect(json).not.toContain('"type":"data_table"');
    expect(json).toContain('Question for q1');
    expect(json).toContain('open_answer_card');
    expect(json).toContain('export_xlsx');
  });

  test('caps fallback at 50 rows and notes truncation', () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      result({ questionId: `q${i + 1}`, state: 'needs_sme', reason: 'no_evidence' }),
    );
    const blocks = reviewDataTableBlocks(many, { runId: 'run-abc', useDataTable: false });
    const rows = blocks.filter(
      (b) => (b as { accessory?: { action_id?: string } }).accessory?.action_id === 'open_answer_card',
    );
    expect(rows.length).toBe(50);
    expect(JSON.stringify(blocks)).toContain('10 more');
  });
});
