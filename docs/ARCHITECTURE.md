# Architecture

Asked & Answered is a Slack agent that answers security questionnaires from
evidence that already lives in your workspace — fail-closed, evidence-cited,
and tamper-evidently logged.

## The one diagram

```
                         Slack (agent_view Messages tab)
                                    │
                 upload xlsx/csv  ┌─┴─┐  stream plan · review table · /verify
                                  │app│  (src/app.ts — Bolt listeners & actions)
                                  └─┬─┘
        ┌───────────────┬──────────┼───────────────┬─────────────────┐
        ▼               ▼          ▼               ▼                 ▼
    parse.ts       QueryPlanner  DraftingPipeline  AnswerLibrary     Ledger
  (questions)      (RTS budget)  (3-state, fail-   (approved answers  (hash-chained
                        │         closed, guards)   + ACL invariant)   approvals)
                        ▼               │                 │                 │
              ┌─────────────────┐       ▼                 │                 │
              │ Real-Time Search│   AnthropicDrafter      │                 │
              │  (assistant.    │   (prompt.ts hardening) │                 │
              │  search.context)│                         │                 │
              └─────────────────┘                         │                 │
                                                          ▼                 ▼
                                              asked-answered-mcp      /aa verify
                                            (search_answers,          (tamper check)
                                             get_answer_provenance)
```

## Where each qualifying technology sits

| Technology | Module | Role — and why it is load-bearing |
|---|---|---|
| **Real-Time Search API** | `src/slack/rts.ts`, `src/core/planner.ts` | The *only* evidence source. Remove it and every question becomes Needs-SME — there is nothing to ground answers in. The Query Planner is what makes it usable under the 10-req/min budget. |
| **Slack AI capabilities** | `src/app.ts`, `src/slack/blocks.ts` | The agent surface: agent_view Messages tab, streamed plan, Block Kit review table + cards + `feedback_buttons`. This is the entire frontend and the human-in-the-loop approval UX. |
| **MCP** | `src/mcp/server.ts` | Ships `asked-answered-mcp`, exposing the approved-answer library to Claude/Cursor/Slackbot as identity-bound read-only tools. The library is reachable outside Slack without ever bypassing the ACL invariant. |

## Data flow, one question at a time

1. **Parse** (`core/parse.ts`) — xlsx/csv/text → deduped `Question[]`.
2. **Retrieve** (`core/planner.ts` → `slack/rts.ts`) — per-question RTS search,
   rate-budgeted; `include_context_messages` supplies surrounding context.
3. **Draft** (`core/pipeline.ts`) — three outcomes, fail-closed by construction:
   - **Verified** — a matching SME-approved answer exists *and* every one of its
     citations is visible to this requester right now (`core/library.ts`).
   - **Grounded** — the model drafts from evidence; its citations must be a
     subset of what we retrieved, and every cited channel is re-checked against
     the requester before any text is released.
   - **Needs SME** — no evidence, failed search, model refusal, invalid
     citations, or an ACL block. No answer text is produced.
4. **Review** (`slack/flows.ts`, `slack/blocks.ts`) — the human approves / edits /
   rejects / routes. Approvals append to the ledger and feed the library.
5. **Export** (`core/export.ts`) — xlsx with citations and approval records.

## The invariant

> **No answer text ever flows to a requester who cannot see all of its evidence.**

Enforced in three places and property-tested (`tests/library.test.ts`,
`tests/review-fixes.test.ts`):

- **Library reuse** re-validates every citation against the current requester
  and degrades to Needs-SME on any miss.
- **Grounded drafts** re-check each cited channel against the requester before
  releasing text.
- **The MCP server** redacts any evidence-backed answer whose evidence the
  bound identity cannot verify. It **fails closed by default**: an unconfigured
  server (no visibility supplied) redacts every evidence-backed answer;
  disclosure is opt-in (`AA_MCP_TRUST_LOCAL=1` for a local single-operator run,
  or an injected `VisibilityChecker`).

All three fail *closed*: a visibility-check error, or an unconfigured checker,
counts as "not visible."

## Trust & integrity

- **Zero-copy.** The library stores app-authored approved answers plus permalink
  *pointers* — never copied Slack content. The ledger stores keyed HMAC content
  hashes, not answer text.
- **Tamper-evident.** Every approval chains to the previous entry's hash;
  `/aa verify` (or `verify ledger` in DM) recomputes the chain and names the
  first altered entry. The production `Ledger` class has no mutation method
  beyond `append`.
- **Injection-resistant.** Evidence is quoted as untrusted data; the model is
  told to ignore instructions inside it; output is strict JSON (anything else
  fails closed); cited permalinks are re-validated against the retrieved set, so
  a fully-hijacked reply still cannot smuggle a foreign citation.

## Testing

- `npm test` — 85 hermetic tests (no network, no Slack), incl. a 200-run
  fast-check property suite on the invariant.
- `npm run smoke` — the full loop offline: parse → plan → draft → review →
  compounding reuse → tamper detection → export.
- `npx tsx evals/run.ts` — the labeled eval (see `docs/EVALS.md`).
