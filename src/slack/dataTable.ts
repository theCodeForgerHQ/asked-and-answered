import type { DraftResult } from '../core/pipeline.js';

/**
 * Data Table review surface for Slack.
 *
 * Slack's `data_table` block displays dense tabular data in the Home tab and
 * modals. We emit it as the primary surface, with a section-based fallback for
 * clients that do not yet render data_table (or for messages, where data_table
 * is not supported).
 */

export interface DataTableOptions {
  runId: string;
  title?: string;
  useDataTable?: boolean;
}

/** Slack modal view for dense review — data_table renders here (not in DM messages). */
export function reviewModalView(
  results: DraftResult[],
  opts: { runId: string; title?: string; callbackId?: string; useDataTable?: boolean },
): Record<string, unknown> {
  const blocks = reviewDataTableBlocks(results, {
    runId: opts.runId,
    title: opts.title ?? 'Questionnaire review',
    useDataTable: opts.useDataTable !== false,
  });
  // Modals cap at 100 blocks; data_table + header + actions is well under.
  return {
    type: 'modal',
    callback_id: opts.callbackId ?? 'review_modal',
    title: { type: 'plain_text', text: 'Review table' },
    close: { type: 'plain_text', text: 'Close' },
    blocks,
  };
}

const STATE_EMOJI: Record<DraftResult['state'], string> = {
  verified: ':white_check_mark:',
  grounded: ':mag:',
  needs_sme: ':raised_hand:',
};

const STATE_LABEL: Record<DraftResult['state'], string> = {
  verified: 'Verified',
  grounded: 'Grounded',
  needs_sme: 'Needs SME',
};

function actionValue(runId: string, questionId: string): string {
  return `${runId}:${questionId}`;
}

/** One-row summary text used in fallback section mode. */
function rowSummary(r: DraftResult): string {
  if (r.state === 'needs_sme') {
    return `${STATE_EMOJI[r.state]} *${r.questionText}* — ${STATE_LABEL[r.state]}`;
  }
  const text = (r.answerText ?? '').slice(0, 80) + ((r.answerText?.length ?? 0) > 80 ? '…' : '');
  return `${STATE_EMOJI[r.state]} *${r.questionText}*\n${STATE_LABEL[r.state]} — ${text}`;
}

/**
 * Returns Block Kit blocks for a review table.
 * If `useDataTable` is true, returns a single `data_table` block (best in App
 * Home / modal). Otherwise returns paginated sections with action buttons.
 */
export function reviewDataTableBlocks(results: DraftResult[], opts: DataTableOptions): unknown[] {
  if (!opts.useDataTable) {
    return fallbackSectionBlocks(results, opts);
  }

  // Live data_table schema (validated against views.publish): caption is a
  // plain string, there is no `columns` property, and rows are arrays of
  // cell objects. The first row carries the column titles.
  const cell = (text: string) => ({ type: 'raw_text', text });
  const rows = [
    [cell('Question'), cell('Status'), cell('Answer preview'), cell('Citations')],
    ...results.map((r) => [
      cell(r.questionText),
      cell(STATE_LABEL[r.state]),
      cell(r.state === 'needs_sme' ? '' : (r.answerText ?? '').slice(0, 200)),
      cell(String((r.citations ?? []).length)),
    ]),
  ];

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: opts.title ?? 'Questionnaire review' },
    },
    {
      type: 'data_table',
      caption: opts.title ?? 'Questionnaire review',
      rows,
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${results.length} questions · click a row in the table to open its answer card (requires live data_table row action support).`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'export_xlsx',
          value: actionValue(opts.runId, 'export'),
          text: { type: 'plain_text', text: 'Export xlsx' },
        },
      ],
    },
  ];
}

function fallbackSectionBlocks(results: DraftResult[], opts: DataTableOptions): unknown[] {
  const blocks: unknown[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${opts.title ?? 'Questionnaire review'}* — ${results.length} questions`,
      },
    },
    { type: 'divider' },
  ];

  for (const r of results.slice(0, 50)) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: rowSummary(r) },
      accessory: {
        type: 'button',
        action_id: 'open_answer_card',
        value: actionValue(opts.runId, r.questionId),
        text: { type: 'plain_text', text: 'Review' },
      },
    });
  }

  if (results.length > 50) {
    blocks.push({
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `_…and ${results.length - 50} more (use Export xlsx for the full set)._` },
      ],
    });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        action_id: 'export_xlsx',
        value: actionValue(opts.runId, 'export'),
        text: { type: 'plain_text', text: 'Export xlsx' },
      },
    ],
  });

  return blocks;
}
