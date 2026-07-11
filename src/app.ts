import bolt from '@slack/bolt';
import { AnswerLibrary } from './core/library.js';
import { Ledger } from './core/ledger.js';
import { QueryPlanner, RateBudget } from './core/planner.js';
import { parseCsv, parseText, parseXlsx } from './core/parse.js';
import { exportXlsx } from './core/export.js';
import { AnthropicDrafter } from './llm/anthropic.js';
import {
  answerCardBlocks,
  planSummaryText,
  reviewTableBlocks,
  smeRequestBlocks,
  verifyResultBlocks,
} from './slack/blocks.js';
import { runQuestionnaire, ReviewSession, type RunDeps } from './slack/flows.js';
import { ActionTokenStore, SlackRtsClient } from './slack/rts.js';
import { ChannelMembershipChecker } from './slack/visibility.js';

const { App } = bolt;

/**
 * Asked & Answered — Bolt wiring (App A, internal install).
 *
 * Listeners follow the agent_view event model (post June 30 2026):
 * conversations live in the app's Messages tab; message.im carries user
 * turns; app_home_opened (tab=messages) greets first-time users.
 * TODO(S1): verify event payloads against the live sandbox and wire
 * chat.startStream / task cards / Data Table where available.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

const app = new App({
  token: required('SLACK_BOT_TOKEN'),
  signingSecret: required('SLACK_SIGNING_SECRET'),
  socketMode: process.env.SLACK_APP_TOKEN ? true : false,
  ...(process.env.SLACK_APP_TOKEN ? { appToken: process.env.SLACK_APP_TOKEN } : {}),
  port: Number(process.env.PORT ?? 3000),
});

const dbPath = process.env.AA_DB_PATH ?? 'asked-and-answered.db';
const library = AnswerLibrary.atPath(dbPath);
const ledger = Ledger.atPath(dbPath.replace(/\.db$/, '-ledger.db'));
const tokens = new ActionTokenStore();
const drafter = new AnthropicDrafter();

/** Sessions keyed by `${channel}:${thread_ts}` so button clicks find their run. */
const sessions = new Map<string, ReviewSession>();

function depsForUser(userId: string): RunDeps {
  const rts = new SlackRtsClient(
    (method, args) => app.client.apiCall(method, args),
    tokens,
    userId,
  );
  const membership = new ChannelMembershipChecker(async (channelId) => {
    const members: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await app.client.conversations.members({ channel: channelId, limit: 200, ...(cursor ? { cursor } : {}) });
      members.push(...(page.members ?? []));
      cursor = page.response_metadata?.next_cursor || undefined;
    } while (cursor);
    return members;
  });
  return {
    library,
    ledger,
    llm: drafter,
    visibility: membership,
    planner: new QueryPlanner(rts, {
      budget: new RateBudget({ maxPerWindow: 9, windowMs: 60_000 }),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    }),
  };
}

const WELCOME =
  'Hi — I turn questionnaires into evidence-cited answers from this workspace.\n' +
  '• Upload an *.xlsx/.csv* questionnaire or paste questions here.\n' +
  '• I only answer what the workspace can prove — everything else goes to a human.\n' +
  '• `verify ledger` checks the tamper-evident approval trail.';

app.event('app_home_opened', async ({ event, client }) => {
  const tab = (event as { tab?: string }).tab;
  if (tab !== 'messages') return;
  // Greet only if the conversation is empty (best-effort; ignore failures).
  try {
    const history = await client.conversations.history({ channel: event.channel ?? '', limit: 1 });
    if ((history.messages ?? []).length === 0) {
      await client.chat.postMessage({ channel: event.channel ?? '', text: WELCOME });
    }
  } catch {
    /* greeting is cosmetic */
  }
});

app.event('app_context_changed', async ({ body }) => {
  // Entity context (what the user is viewing) — recorded for future scoping.
  void body;
});

app.message(async ({ message, client }) => {
  const msg = message as {
    channel: string;
    channel_type?: string;
    user?: string;
    text?: string;
    ts: string;
    thread_ts?: string;
    files?: Array<{ url_private_download?: string; filetype?: string; name?: string }>;
    assistant_thread?: { action_token?: string };
    bot_id?: string;
  };
  if (msg.bot_id || !msg.user || msg.channel_type !== 'im') return;

  // Harvest the action token for RTS (spike S2 verifies exact location).
  const token = (msg as unknown as Record<string, unknown>).action_token;
  if (typeof token === 'string') tokens.record(msg.user, token);
  if (msg.assistant_thread?.action_token) tokens.record(msg.user, msg.assistant_thread.action_token);

  const threadTs = msg.thread_ts ?? msg.ts;
  const say = (text: string, blocks?: unknown[]) =>
    client.chat.postMessage({
      channel: msg.channel,
      thread_ts: threadTs,
      text,
      ...(blocks ? { blocks: blocks as never } : {}),
    });

  // `verify ledger` command surface (works in DM without a slash command).
  if ((msg.text ?? '').trim().toLowerCase() === 'verify ledger') {
    const result = ledger.verify();
    await say('Ledger verification', verifyResultBlocks(result) as unknown[]);
    return;
  }

  // Intake: attached questionnaire file, or pasted questions.
  let parsed;
  const file = msg.files?.[0];
  try {
    if (file?.url_private_download) {
      const response = await fetch(file.url_private_download, {
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
      });
      const buf = Buffer.from(await response.arrayBuffer());
      parsed =
        file.filetype === 'csv' || file.name?.endsWith('.csv')
          ? parseCsv(buf.toString('utf8'))
          : await parseXlsx(buf);
    } else if (msg.text && msg.text.trim().length > 0) {
      parsed = parseText(msg.text);
    } else {
      return;
    }
  } catch (err) {
    await say(`I couldn't read that file (${(err as Error).message}). xlsx and csv are supported.`);
    return;
  }

  if (parsed.questions.length === 0) {
    await say("I didn't find any questions in that. Upload an xlsx/csv questionnaire or paste the questions as text.");
    return;
  }

  await say(`:hourglass_flowing_sand: Working on ${parsed.questions.length} questions — searching workspace evidence…`);

  try {
    const session = await runQuestionnaire(parsed, msg.user, depsForUser(msg.user), () => {});
    sessions.set(`${msg.channel}:${threadTs}`, session);
    await say(planSummaryText(session.counts));
    await say('Review', reviewTableBlocks(session.results, { page: 0 }) as unknown[]);
  } catch (err) {
    await say(`Something went wrong during the run: ${(err as Error).message}`);
  }
});

function sessionFor(body: { channel?: { id?: string }; message?: { thread_ts?: string; ts?: string } }): ReviewSession | undefined {
  const channel = body.channel?.id;
  const thread = body.message?.thread_ts ?? body.message?.ts;
  if (!channel || !thread) return undefined;
  return sessions.get(`${channel}:${thread}`);
}

app.action('open_answer_card', async ({ ack, body, client, action }) => {
  await ack();
  const session = sessionFor(body as never);
  const questionId = (action as { value?: string }).value ?? '';
  const result = session?.results.find((r) => r.questionId === questionId);
  const b = body as { channel?: { id?: string }; message?: { thread_ts?: string; ts?: string } };
  if (!session || !result || !b.channel?.id) return;
  await client.chat.postMessage({
    channel: b.channel.id,
    thread_ts: b.message?.thread_ts ?? b.message?.ts ?? '',
    text: result.questionText,
    blocks: answerCardBlocks(result) as never,
  });
});

app.action('table_next_page', async ({ ack, body, client, action }) => {
  await ack();
  const session = sessionFor(body as never);
  const page = Number((action as { value?: string }).value ?? '0');
  const b = body as { channel?: { id?: string }; message?: { thread_ts?: string; ts?: string } };
  if (!session || !b.channel?.id) return;
  await client.chat.postMessage({
    channel: b.channel.id,
    thread_ts: b.message?.thread_ts ?? b.message?.ts ?? '',
    text: 'Review (continued)',
    blocks: reviewTableBlocks(session.results, { page }) as never,
  });
});

for (const [actionId, verb] of [
  ['approve_answer', 'approve'],
  ['reject_answer', 'reject'],
] as const) {
  app.action(actionId, async ({ ack, body, client, action }) => {
    await ack();
    const session = sessionFor(body as never);
    const questionId = (action as { value?: string }).value ?? '';
    const userId = (body as { user?: { id?: string } }).user?.id ?? 'unknown';
    const b = body as { channel?: { id?: string }; message?: { thread_ts?: string; ts?: string } };
    if (!session || !b.channel?.id) return;
    try {
      const result = verb === 'approve' ? session.approve(questionId, userId) : session.reject(questionId, userId);
      const counts = session.recount();
      await client.chat.postMessage({
        channel: b.channel.id,
        thread_ts: b.message?.thread_ts ?? b.message?.ts ?? '',
        text:
          verb === 'approve'
            ? `:white_check_mark: Approved by <@${userId}> — saved to the answer library.\n${planSummaryText(counts)}`
            : `:no_entry: Rejected by <@${userId}> — routed back to humans.\n${planSummaryText(counts)}`,
      });
      void result;
    } catch (err) {
      await client.chat.postMessage({
        channel: b.channel.id,
        thread_ts: b.message?.thread_ts ?? b.message?.ts ?? '',
        text: (err as Error).message,
      });
    }
  });
}

app.action('route_to_sme', async ({ ack, body, client, action }) => {
  await ack();
  const session = sessionFor(body as never);
  const questionId = (action as { value?: string }).value ?? '';
  const result = session?.results.find((r) => r.questionId === questionId);
  const requester = (body as { user?: { id?: string } }).user?.id ?? 'unknown';
  const b = body as { channel?: { id?: string }; message?: { thread_ts?: string; ts?: string } };
  if (!session || !result || !b.channel?.id) return;
  // v1: route to the requester-chosen expert via a users_select in the thread.
  await client.chat.postMessage({
    channel: b.channel.id,
    thread_ts: b.message?.thread_ts ?? b.message?.ts ?? '',
    text: 'Pick the expert to ask',
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `Who should answer:\n*${result.questionText}*` },
        accessory: {
          type: 'users_select',
          action_id: 'sme_selected',
          placeholder: { type: 'plain_text', text: 'Choose an expert' },
        },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `question:${questionId} requester:<@${requester}>` }],
      },
    ] as never,
  });
});

app.action('sme_selected', async ({ ack, body, client, action }) => {
  await ack();
  const smeId = (action as { selected_user?: string }).selected_user;
  const b = body as {
    user?: { id?: string };
    channel?: { id?: string };
    message?: { thread_ts?: string; ts?: string; blocks?: Array<{ elements?: Array<{ text?: string }> }> };
  };
  const contextText = b.message?.blocks?.find((bl) => bl.elements)?.elements?.[0]?.text ?? '';
  const questionId = /question:(\S+)/.exec(contextText)?.[1] ?? '';
  const session = sessionFor(body as never);
  const result = session?.results.find((r) => r.questionId === questionId);
  if (!smeId || !session || !result) return;

  const dm = await client.conversations.open({ users: smeId });
  if (dm.channel?.id) {
    await client.chat.postMessage({
      channel: dm.channel.id,
      text: `You've been asked to answer a questionnaire question`,
      blocks: smeRequestBlocks({
        questionText: result.questionText,
        requesterId: b.user?.id ?? 'unknown',
        questionId,
      }) as never,
    });
    if (b.channel?.id) {
      await client.chat.postMessage({
        channel: b.channel.id,
        thread_ts: b.message?.thread_ts ?? b.message?.ts ?? '',
        text: `:incoming_envelope: Routed to <@${smeId}>.`,
      });
    }
  }
});

app.action('sme_provide_answer', async ({ ack, body, client, action }) => {
  await ack();
  const questionId = (action as { value?: string }).value ?? '';
  await client.views.open({
    trigger_id: (body as { trigger_id: string }).trigger_id,
    view: {
      type: 'modal',
      callback_id: 'sme_answer_modal',
      private_metadata: questionId,
      title: { type: 'plain_text', text: 'Provide an answer' },
      submit: { type: 'plain_text', text: 'Approve & save' },
      blocks: [
        {
          type: 'input',
          block_id: 'answer_block',
          label: { type: 'plain_text', text: 'Your answer (it will be saved as Verified)' },
          element: { type: 'plain_text_input', action_id: 'answer_input', multiline: true },
        },
      ],
    },
  });
});

app.view('sme_answer_modal', async ({ ack, body, view }) => {
  await ack();
  const questionId = view.private_metadata;
  const answer = view.state.values.answer_block?.answer_input?.value ?? '';
  const smeId = body.user.id;
  // Find the session containing this question (SME answers arrive via DM,
  // outside the original thread).
  for (const session of sessions.values()) {
    if (session.results.some((r) => r.questionId === questionId && r.state === 'needs_sme')) {
      session.smeProvide(questionId, smeId, answer);
      break;
    }
  }
});

app.action('export_xlsx', async ({ ack, body, client }) => {
  await ack();
  const session = sessionFor(body as never);
  const b = body as { channel?: { id?: string }; message?: { thread_ts?: string; ts?: string } };
  if (!session || !b.channel?.id) return;
  const buf = await exportXlsx(session.results);
  await client.files.uploadV2({
    channel_id: b.channel.id,
    thread_ts: b.message?.thread_ts ?? b.message?.ts ?? '',
    filename: 'questionnaire-asked-and-answered.xlsx',
    file: buf,
    initial_comment: 'Completed questionnaire — every answer cited and approval-logged.',
  });
});

// Health endpoint for the deploy platform (HTTP mode only; Bolt's default
// receiver exposes a raw Node server we can hang a route on).
if (!process.env.SLACK_APP_TOKEN) {
  const receiver = (app as unknown as { receiver?: { router?: { get?: (path: string, handler: (req: unknown, res: { writeHead: (n: number) => void; end: (s: string) => void }) => void) => void } } }).receiver;
  receiver?.router?.get?.('/health', (_req, res) => {
    res.writeHead(200);
    res.end('ok');
  });
}

const port = Number(process.env.PORT ?? 3000);
await app.start(port);
console.log(`⚡ Asked & Answered running (${process.env.SLACK_APP_TOKEN ? 'socket mode' : `http :${port}`})`);
