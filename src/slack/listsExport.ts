import type { DraftResult } from '../core/pipeline.js';

export interface ListExportResult {
  ok: boolean;
  listId?: string;
  url?: string;
  fallbackReason?: string;
}

interface SlackListClient {
  apiCall(method: string, options?: Record<string, unknown>): Promise<unknown>;
}

/** Minimal rich_text cell payload for a Slack List field. */
function richTextCell(text: string, links: Array<{ url: string; label: string }> = []): unknown[] {
  const elements: unknown[] = [];
  if (text) elements.push({ type: 'text', text });
  for (const link of links) {
    if (elements.length > 0) elements.push({ type: 'text', text: '  ' });
    elements.push({ type: 'link', url: link.url, text: link.label });
  }
  if (elements.length === 0) elements.push({ type: 'text', text: ' ' });
  return [
    {
      type: 'rich_text',
      elements: [{ type: 'rich_text_section', elements }],
    },
  ];
}

/**
 * Sync answers to a native Slack List.
 *
 * Verified against the live API: `slackLists.create` takes `name` plus a
 * column `schema` and returns generated column ids; rows are then added one
 * at a time with `slackLists.items.create` using those column ids.
 * If the bot token lacks lists:write, this returns ok=false with the reason
 * so the caller can surface a graceful fallback.
 */
export async function exportToSlackList(
  client: SlackListClient,
  results: DraftResult[],
  opts: { runId: string; requesterId: string; title?: string },
): Promise<ListExportResult> {
  const name = opts.title ?? 'Questionnaire — Asked & Answered';

  let listId: string;
  let columnIds: Record<string, string>;
  try {
    const createRes = (await client.apiCall('slackLists.create', {
      name: `${name} (run ${opts.runId.slice(0, 8)})`,
      schema: [
        { key: 'name', name: 'Question', type: 'text', is_primary_column: true },
        { key: 'status', name: 'Status', type: 'text' },
        { key: 'answer', name: 'Answer', type: 'text' },
        { key: 'citations', name: 'Citations', type: 'text' },
      ],
    })) as {
      ok?: boolean;
      list_id?: string;
      error?: string;
      list_metadata?: { schema?: Array<{ key: string; id: string }> };
    };
    if (!createRes.ok || !createRes.list_id) {
      return { ok: false, fallbackReason: createRes.error ?? 'slackLists.create failed' };
    }
    listId = createRes.list_id;
    columnIds = Object.fromEntries(
      (createRes.list_metadata?.schema ?? []).map((col) => [col.key, col.id]),
    );
  } catch (err) {
    const reason = (err as { data?: { error?: string }; message?: string }).data?.error ?? (err as Error).message;
    return { ok: false, fallbackReason: reason };
  }

  let itemFailures = 0;
  for (const r of results) {
    const status =
      r.state === 'verified' ? 'Verified' : r.state === 'grounded' ? 'Grounded (needs approval)' : 'Needs SME';
    const citations = (r.citations ?? []).map((c, i) => ({ url: c.permalink, label: `evidence ${i + 1}` }));
    const fields = [
      { column_id: columnIds.name, rich_text: richTextCell(r.questionText.slice(0, 500)) },
      { column_id: columnIds.status, rich_text: richTextCell(status) },
      { column_id: columnIds.answer, rich_text: richTextCell((r.answerText ?? '').slice(0, 2000)) },
      { column_id: columnIds.citations, rich_text: richTextCell('', citations) },
    ].filter((f) => f.column_id);
    try {
      const itemRes = (await client.apiCall('slackLists.items.create', {
        list_id: listId,
        initial_fields: fields,
      })) as { ok?: boolean };
      if (!itemRes.ok) itemFailures++;
    } catch {
      itemFailures++;
    }
  }
  if (itemFailures > 0) {
    console.error(`list export: ${itemFailures}/${results.length} items failed to create`);
  }
  if (itemFailures === results.length && results.length > 0) {
    return { ok: false, listId, fallbackReason: 'all list items failed to create' };
  }

  return { ok: true, listId };
}
