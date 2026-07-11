import type { DraftResult, NeedsSmeReason } from '../core/pipeline.js';
import type { VerifyResult } from '../core/ledger.js';

/**
 * Block Kit builders — the fallback review surface (sections + buttons,
 * paginated). The Data Table block variant is wired behind the same
 * call sites once verified against the live sandbox (spike S3); nothing
 * else in the app knows which surface rendered.
 */

type Block = Record<string, unknown>;

export const PAGE_SIZE = 20;

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

const REASON_LABEL: Record<NeedsSmeReason, string> = {
  no_evidence: 'no evidence found in this workspace',
  search_failed: 'workspace search failed',
  llm_refused: 'evidence was insufficient to answer',
  invalid_citations: 'draft failed citation validation',
  acl_degraded: 'approved answer exists, but you cannot see its evidence',
  llm_error: 'drafting error',
  rejected: 'draft rejected by a reviewer',
};

export interface PlanCounts {
  total: number;
  deduped: number;
  verified: number;
  grounded: number;
  needsSme: number;
}

export function planSummaryText(c: PlanCounts): string {
  return (
    `Parsed *${c.total}* questions → *${c.deduped}* after dedupe.\n` +
    `:white_check_mark: ${c.verified} verified from the approved library · ` +
    `:mag: ${c.grounded} grounded in workspace evidence · ` +
    `:raised_hand: ${c.needsSme} need a human`
  );
}

export function reviewTableBlocks(results: DraftResult[], opts: { page: number }): Block[] {
  const start = opts.page * PAGE_SIZE;
  const pageResults = results.slice(start, start + PAGE_SIZE);
  const hasNext = start + PAGE_SIZE < results.length;

  const blocks: Block[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Review — ${results.length} questions* (page ${opts.page + 1} of ${Math.ceil(results.length / PAGE_SIZE)})`,
      },
    },
    { type: 'divider' },
  ];

  for (const r of pageResults) {
    const detail =
      r.state === 'needs_sme'
        ? `_${REASON_LABEL[r.reason ?? 'no_evidence']}_`
        : (r.answerText ?? '').slice(0, 120) + ((r.answerText?.length ?? 0) > 120 ? '…' : '');
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${STATE_EMOJI[r.state]} *${r.questionText}*\n${STATE_LABEL[r.state]} — ${detail}`,
      },
      accessory: {
        type: 'button',
        action_id: 'open_answer_card',
        value: r.questionId,
        text: { type: 'plain_text', text: 'Review' },
      },
    });
  }

  if (hasNext) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'table_next_page',
          value: String(opts.page + 1),
          text: { type: 'plain_text', text: 'Next page →' },
        },
      ],
    });
  }

  return blocks;
}

export function answerCardBlocks(r: DraftResult): Block[] {
  const blocks: Block[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${r.questionText}*\n${STATE_EMOJI[r.state]} ${STATE_LABEL[r.state]}` },
    },
  ];

  if (r.state === 'needs_sme') {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_No draft — ${REASON_LABEL[r.reason ?? 'no_evidence']}._\nAsked & Answered would rather ask a human than invent a compliance answer.`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            action_id: 'route_to_sme',
            value: r.questionId,
            style: 'primary',
            text: { type: 'plain_text', text: 'Route to an expert' },
          },
        ],
      },
    );
    return blocks;
  }

  blocks.push({ type: 'section', text: { type: 'mrkdwn', text: r.answerText ?? '' } });

  const citationLines = (r.citations ?? [])
    .map((c, i) => `<${c.permalink}|evidence ${i + 1}>`)
    .join('  ·  ');
  if (citationLines) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `:link: ${citationLines}` }],
    });
  }

  if (r.state === 'verified') {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `:shield: Verified — approved by <@${r.approvedBy}> on ${r.approvedAt ?? ''} · re-checked against your permissions`,
        },
      ],
    });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        action_id: 'approve_answer',
        value: r.questionId,
        style: 'primary',
        text: { type: 'plain_text', text: 'Approve' },
      },
      {
        type: 'button',
        action_id: 'edit_answer',
        value: r.questionId,
        text: { type: 'plain_text', text: 'Edit' },
      },
      {
        type: 'button',
        action_id: 'reject_answer',
        value: r.questionId,
        style: 'danger',
        text: { type: 'plain_text', text: 'Reject' },
      },
    ],
  });

  return blocks;
}

export function smeRequestBlocks(input: {
  questionText: string;
  requesterId: string;
  questionId: string;
}): Block[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `:raised_hand: <@${input.requesterId}> needs your expertise on a questionnaire question:\n` +
          `*${input.questionText}*\n\n_Asked & Answered found no sufficient evidence in the workspace, so it did not draft an answer._`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'sme_provide_answer',
          value: input.questionId,
          style: 'primary',
          text: { type: 'plain_text', text: 'Provide an answer' },
        },
      ],
    },
  ];
}

export function verifyResultBlocks(result: VerifyResult): Block[] {
  if (result.ok) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:white_check_mark: *Ledger intact.* ${result.entriesChecked} entries verified — every hash chains cleanly to genesis.`,
        },
      },
    ];
  }
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `:rotating_light: *Ledger verification FAILED.* Tampering detected at entry *#${result.firstBadSeq}* ` +
          `(of ${result.entriesChecked} checked). The approval trail after this point cannot be trusted.`,
      },
    },
  ];
}
