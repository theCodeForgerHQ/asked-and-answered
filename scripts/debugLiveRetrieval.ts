/**
 * Live retrieval diagnostic — runs the exact production retrieval stack
 * (SlackRtsClient → QueryPlanner) against the real workspace and prints
 * where each question's evidence lands. No writes to Slack.
 *
 *   npx tsx scripts/debugLiveRetrieval.ts [requesterUserId]
 */
import bolt from '@slack/bolt';
import { ActionTokenStore, SlackRtsClient } from '../src/slack/rts.js';
import { QueryPlanner, RateBudget, buildSearchQuery } from '../src/core/planner.js';
import { ChannelMembershipChecker } from '../src/slack/visibility.js';

const token = process.env.SLACK_BOT_TOKEN;
if (!token) throw new Error('SLACK_BOT_TOKEN required');
const client = new bolt.App({ token, signingSecret: 'unused' }).client;

const requesterId = process.argv[2] ?? 'U0BGVMUBYHH';

const QUESTIONS = [
  { id: 'q1', text: 'Do you encrypt customer data at rest?', sourceRef: 'debug:1' },
  { id: 'q2', text: 'Is multi-factor authentication enforced for all employees?', sourceRef: 'debug:2' },
  { id: 'q3', text: 'Do you carry cyber liability insurance?', sourceRef: 'debug:3' },
  { id: 'q4', text: 'Where is production customer data hosted geographically?', sourceRef: 'debug:4' },
];

const tokens = new ActionTokenStore(); // empty, like a DM with no action token
const rts = new SlackRtsClient((method, args) => client.apiCall(method, args), tokens, requesterId);

console.log('=== Step 1: raw searchContext per question ===');
for (const q of QUESTIONS) {
  const query = buildSearchQuery(q.text);
  const { hits } = await rts.searchContext({ query, limit: 15 });
  console.log(`\n[${q.id}] query="${query}" → ${hits.length} hits`);
  for (const h of hits.slice(0, 3)) console.log(`   - ch=${h.channelId} ts=${h.ts} "${h.snippet.slice(0, 60)}"`);
}

console.log('\n=== Step 2: full planner.retrieve (rate-budgeted) ===');
const planner = new QueryPlanner(rts, {
  budget: new RateBudget({ maxPerWindow: 9, windowMs: 60_000 }),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
});
const evidence = await planner.retrieve(QUESTIONS, { strategy: 'per-question' });
for (const [id, ev] of evidence) {
  console.log(`[${id}] searchFailed=${ev.searchFailed} hits=${ev.hits.length}`);
}

console.log('\n=== Step 3: visibility for requester', requesterId, '===');
const membership = new ChannelMembershipChecker(async (channelId) => {
  const page = await client.conversations.members({ channel: channelId, limit: 200 });
  return page.members ?? [];
});
const seenChannels = new Set<string>();
for (const ev of evidence.values()) for (const h of ev.hits) seenChannels.add(h.channelId);
for (const ch of seenChannels) {
  const visible = await membership.canSee(requesterId, { permalink: 'x', channelId: ch, ts: '0' });
  console.log(`channel ${ch}: requester visible=${visible}`);
}
console.log('\nDONE');
