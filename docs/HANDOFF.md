# Handoff — what only you (with credentials) can do

The code is complete: 85 tests green, offline smoke passes, docs written, eval
numbers measured, submission text drafted. What's left needs YOUR accounts and
YOUR hands. Do it in this order.

## A. Accounts to have ready (15 min)
- [ ] Anthropic API key with billing (drafting model).
- [ ] GitHub — push this repo public (license already MIT).
- [ ] Railway or Fly account with a card (non-sleeping deploy).
- [ ] YouTube channel (for the demo video).
- [ ] A real security engineer / AE contact for a 30-min interview — TODAY.

## B. Push the repo (5 min)
```bash
cd asked-and-answered
gh repo create asked-and-answered --public --source=. --push
```

## C. Slack sandbox + spikes (the T-0 to T-6h block) — DO BEFORE feature confidence
1. Join the Slack Developer Program; provision a sandbox.
2. api.slack.com/apps → Create New App → **From a manifest** → paste `slack/manifest.json`. This is **App A** (internal). Install to the sandbox.
3. Put `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN`, `ANTHROPIC_API_KEY` in `.env`.
4. `npm run dev` (Socket Mode) → DM the app, paste 3 questions.
5. **Spike verifications (this is the real risk — do them first):**
   - **S1** agent_view events: confirm `app_home_opened`/`message.im` fire. If the manifest's `assistant_view` block conflicts with agent_view in your sandbox, switch the manifest to the agent_view shape per docs.slack.dev/ai/developing-agents (the code already listens for both).
   - **S2** action_token: confirm RTS returns hits. If `assistant.search.context` rejects the bot token, check where the action_token arrives in `message.im` and adjust `ActionTokenStore` harvesting in `src/app.ts` (search `action_token`).
   - **S3** Data Table: our review UI already uses the sections+buttons fallback, so this can't block you — upgrade to the Data Table block only if it renders.
   - **S4** Marketplace counter (only if pursuing Orgs track): see section F.
6. Seed the sandbox: `SLACK_BOT_TOKEN=xoxb-... npx tsx scripts/seed-sandbox.ts`, then add the judge test user to the PUBLIC channels only.
7. Grant sandbox Member access to `slackhack@salesforce.com` and `testing@devpost.com`.

## D. Measure the REAL eval numbers (10 min)
```bash
AA_EVAL_LLM=anthropic ANTHROPIC_API_KEY=sk-ant-... npx tsx evals/run.ts
```
Copy the printed numbers into `docs/EVALS.md` and `docs/SUBMISSION.md`. If grounded
recall drops below what the fake LLM showed, note it honestly — the fail-closed and
injection numbers won't move (they're model-independent).

## E. Deploy 24/7 (20 min)
- Railway: `railway up` (uses `Dockerfile` + `railway.json`). Set env vars in the dashboard. Omit `SLACK_APP_TOKEN` so it runs HTTP mode; point the Slack app's Request URL at `https://<app>.up.railway.app/slack/events`.
- Add an uptime monitor (e.g. a free cron-ping to `/health`) through Aug 11.

## F. Track decision — Organizations vs New Slack Agent (decide by T-48h)
- Try the Marketplace path only if you can get **5 real, active workspaces** (Devpost sanctions creating free workspaces). App B = a second app id with distribution activated; keep judging on App A. Time-box this to **6 hours**. One-line disclosure in the submission: installs bootstrapped across own workspaces per Devpost guidance.
- If the automated 5-workspace check isn't green by T-48h → select **New Slack Agent** on the Devpost form. Zero rework. The submission text in `docs/SUBMISSION.md` works for both; just drop the Marketplace paragraph.

## G. Video + submit (the T-48h to T-12h block)
1. Interview the human; capture the quote + hours number.
2. Record per `docs/VIDEO_SCRIPT.md` (≤2:40, product footage, refusal is the peak). Upload YouTube **public** early.
3. Screenshot `docs/architecture.svg` for the diagram field.
4. Fill `docs/SUBMISSION.md` brackets with real numbers + quote + URLs.
5. Devpost form: track, description, video, sandbox URL + access confirmation, App ID (if Orgs), repo link.
6. **Submit Monday night IST (a full day early).** Devpost lets you edit until the deadline — refine after, but be DONE.

## Standing rules (from the strategy)
- Never put a number on screen you haven't measured.
- The 5-step demo journey (upload → plan → review → refusal → verify → export) is never cut.
- Everything the video shows must reproduce in the judges' sandbox on App A.
