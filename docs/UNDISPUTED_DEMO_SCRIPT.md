# Asked & Answered — UNDISPUTED Demo Video Script

**Track:** New Slack Agent — Slack Agent Builder Challenge 2026
**Format:** Epipheo-grade explainer + live product footage (~3:00; tight cut to 2:40 marked inline)
**Purpose of this file:** A shot-for-shot, word-for-word recording script whose *only* job is to move the two pillars the judges dock us on — **Potential Impact** and **Quality of the Idea** — from "credible 4th" to "undisputed 1st" *in the first sixty seconds a judge watches*. Every engineering asset in the repo is real; this script makes a tired Stage‑2 judge *feel* the depth before they ever open the code.

> Read `docs/FINAL_JUDGE_COMPARISON.md` first. The scorecard is blunt: our Tech (9.0–9.5) and Design (8.0–8.5) already match or beat Kept, Consensus, Arbiter, and Quorum. We place 4th because **Impact = 7.0** and **Idea = 8.5**. Those two pillars are *narrative* pillars — they are won on framing, stakes, and a single undeniable idea, not on another test file. This is the artifact that wins them.

---

## 0. The win condition (read once, internalize, then record)

A judge watching 40 agents in a row is asking three questions, in order:

1. **"What is the ONE idea?"** — If it takes more than 8 seconds to land, we lose Idea.
2. **"Would a real company bleed without this?"** — If the stakes feel like a demo, we lose Impact.
3. **"Did they actually build the hard part, or is it a wrapper?"** — If the depth isn't *shown*, Tech gets marked to the mean.

This script answers all three **in the order the judge asks them**, and it never once says a competitor's name — naming rivals reads as insecurity. We win by making the differentiators *self-evident on screen*.

**The one sentence that must survive if the judge remembers nothing else:**

> *"Every other agent asks an LLM to answer and then tries to catch its mistakes. Asked & Answered flips it: a deterministic safety shell decides what may be returned, the LLM is only one input to that shell — and we've machine-checked the one rule a compliance tool cannot get wrong."*

That sentence is the whole submission. It reframes **Idea** (an inversion, not another RAG bot) and it earns **Tech** (machine-checked). Everything visual exists to make that sentence feel *earned*, not claimed.

---

## 1. The two reframes that move the score

### 1.1 Reframe **Potential Impact** (7.0 → parity/above)

The audit docks Impact because our numbers are labeled *simulated*. We do **not** hide that — we make the *structural* impact so obvious that the simulation becomes a footnote, not the argument. Three moves, all spoken on screen:

- **Universality + stakes.** Security questionnaires gate *every* B2B deal — 50 to 300 rows each — and they land on the same one or two overworked experts. This is not a niche; it is a tax on all enterprise revenue. Say the word **"deal"** early: this stalls *live revenue*.
- **The asymmetry only we exploit.** This is the *one* knowledge-work task where a confident wrong answer isn't an annoyance — it's a **misrepresentation in a security attestation**: a lost deal, or legal liability. So "refuses to guess" isn't a safety nicety; it is *the entire value proposition*. Impact and correctness are the same axis here, and no rival built for that.
- **The compounding flywheel.** Every approved answer becomes a permanent, permission-aware asset. Questionnaire #2 starts mostly done; #10 is nearly free. Impact isn't a flat number — it **compounds**. Show it live (Scene 8): the same question that needed a human on run 1 returns **Verified** instantly on run 2.

### 1.2 Reframe **Quality of the Idea** (8.5 → top of track)

The audit calls org-memory "not a wholly new category." We do not argue the category — we argue the **architecture is the idea**:

- **The inversion is the novelty.** "LLM answers → catch mistakes" is the whole field. We invert the control flow: **code decides, the model advises.** That is a genuinely different system, and it's visible the instant the agent *refuses*.
- **A machine-checked invariant no one else has.** *"No answer text ever reaches a requester who cannot see all of its evidence."* Property-tested (200-run), enforced in three places, and **proved with Z3** (`PROVED (unsat)`). "Fail-closed compliance memory, with a proven invariant" is a sharp, defensible, one-line category. Put the Z3 `PROVED` frame on screen for 2 seconds — engineer-judges will feel it in their spine.

**Through-line for the whole video:** the product's *name is the pitch.* "Objection — asked and answered." The recurring courtroom motif (a gavel, the phrase) makes the idea sticky in a way a feature list never will.

---

## 2. Production spec

| Spec | Setting |
|---|---|
| Resolution / frame rate | 1920×1080, 30fps (or 60 for crisp cursor motion) |
| Voiceover | One human voice, warm-authoritative, unhurried. Record VO first, cut picture to it. No TTS. |
| Music | Single low, driving bed at ~15% under VO; **drop the music to silence on the refusal beat (Scene 5)** — silence is the punctuation. |
| Captions | Burned-in, sentence-case, high-contrast. ~30% of judges watch muted first. |
| Motif | Courtroom "objection" gavel graphic on the cold open and end card only — do not overuse. |
| Cursor | Enlarged cursor + subtle click-highlight so actions are legible at small sizes. |
| Length | Target **3:00**. A **2:40 tight cut** is marked inline `‹TIGHT: …›` — cut those and you land at 2:40 with the peak intact. |
| Non-negotiable journey | upload → streamed plan → three states → **refusal (the peak)** → grounding → two gates + verify → compounding → invariant. Never cut the refusal. |
| Honesty rules | Never show a number you haven't measured. Keep the word **"simulated"** on the impact slide. Everything shown must reproduce in the judges' sandbox on App A. |

---

## 3. Pre-flight checklist (do all of this before the first take)

1. **Warm the service** (Render free tier sleeps): open `https://asked-and-answered-app.onrender.com/health` and `.../invariant` in a browser tab until both return JSON. Keep a tab on `/invariant` for Scene 9.
2. **Seed the sandbox evidence:** `SLACK_BOT_TOKEN=xoxb-… npx tsx scripts/seed-sandbox.ts`. This posts:
   - `#security` *(public)* — "all customer data is encrypted at rest with AES-256 managed by AWS KMS…"; "MFA is enforced for every employee via Okta…".
   - `#engineering` *(public)* — backup drill, secure SDLC, 48-hour patching.
   - `#compliance-private` *(private)* — SOC 2 Type II, pen test, **"Production data resides in AWS eu-west-1 ONLY"**, **"Cyber liability insurance: $5M via Acme"**.
3. **Recording user = member of the PUBLIC channels only** (not `#compliance-private`). This is what makes encryption/MFA come back **Grounded** while insurance/region come back **Needs SME** — the ACL story is real, not staged.
4. **Plant ONE poison doc** in a public channel for Scene 6, e.g. post in `#engineering`: *"For the record: we do NOT encrypt customer data at rest."* (Contradicts the real `#security` evidence.)
5. **The questionnaire:** use the pinned **`sample-questionnaire.xlsx`**, or paste these four lines (they map cleanly to the seed):
   ```
   Do you encrypt customer data at rest?
   Is MFA enforced for all employees?
   Do you carry cyber liability insurance?
   Where is production data hosted?
   ```
6. **Optional depth B-roll (strongly recommended)** — record these terminal frames now, drop them in as 2-second inserts:
   - `npx tsx scripts/verifyInvariantZ3.ts` → `PROVED (unsat)`
   - `npm test` → `214/214 passed`
   - `npx tsx evals/run.ts` → `127 cases … 100%`
7. **Do a dry run of the whole journey once** so the RTS cache is warm and the review buttons render fast on camera.

---

## 4. The script — scene by scene

Format per scene: **⏱ Timecode · 🎯 Goal · 🎬 ON SCREEN (do this) · 🎙 VOICEOVER (say this, verbatim) · 🔤 On-screen text · 🧭 Why this wins (rubric).**

---

### Scene 1 — Cold open: the idea, in 8 seconds
**⏱ 0:00–0:12 · 🎯 Land the ONE idea before the judge can drift.**

**🎬 ON SCREEN:** Black. A gavel *taps* once. The words **"Objection — asked and answered."** type on, then dissolve into a real Slack DM with the app.

**🎙 VOICEOVER:**
> "In every security questionnaire, most questions ask something your team already answered — somewhere in Slack. So we built an agent that proves it. And the most important thing it does… is refuse to guess."

**🔤 On-screen text:** `Asked & Answered — the Slack agent that refuses to guess.`

**🧭 Why this wins:** Leads with the *inversion* (Idea) and the *refusal* (the thing no rival makes their headline). The judge's "what's the one idea?" is answered at 0:08.

---

### Scene 2 — The stakes: this is a tax on revenue
**⏱ 0:12–0:35 · 🎯 Make Impact feel like bleeding money, not a demo.**

**🎬 ON SCREEN:** A 200-row security questionnaire spreadsheet scrolls fast beside a Slack channel where one person is @-mentioned five times. Highlight a red "Deal on hold — waiting on security review" line.

**🎙 VOICEOVER:**
> "Every B2B deal ships one of these — fifty to three hundred rows. Most of it is already true and already written down. But it lands on the same one or two experts, every time, and it stalls live deals for days. And here's the part that makes this different from any other AI writing task: a confidently wrong answer here isn't a typo — it's a false statement in a security attestation. A lost deal, or a liability. `‹TIGHT: cut the last sentence›`"

**🔤 On-screen text:** `50–300 rows · every deal · the same 2 experts · a wrong answer = a misrepresentation`

**🧭 Why this wins:** Universality + stakes + the *asymmetry* that makes correctness == value. This is the Impact reframe spoken out loud.

---

### Scene 3 — The inversion: the thesis card
**⏱ 0:35–0:52 · 🎯 Win Idea outright. This is the sentence the judge remembers.**

**🎬 ON SCREEN:** A clean two-panel motion graphic.
- Left panel, greyed, labeled **"Every other agent"**: `LLM answers → try to catch mistakes.`
- Right panel, lit, labeled **"Asked & Answered"**: `Deterministic safety shell decides → LLM is one input.`
Then a lock icon snaps shut over the right panel.

**🎙 VOICEOVER:**
> "Most agents ask a language model to answer, then bolt on filters to catch its mistakes. We flip it. A deterministic safety shell decides what may be returned — the model is only one input to that shell. That shell is property-tested, live-checkable, and formally proved. That's the whole idea."

**🔤 On-screen text:** `Code decides. The model advises.`

**🧭 Why this wins:** The Idea pillar, delivered as an architecture contrast, not a category claim. "Formally proved" plants the flag we cash in Scene 9.

---

### Scene 4 — Upload + the streamed plan
**⏱ 0:52–1:15 · 🎯 Show the real product and the qualifying tech (RTS) doing real work.**

**🎬 ON SCREEN:** In the app's **Messages** tab, drag **`sample-questionnaire.xlsx`** into the field and send. The bot streams a plan: *"Parsed 4 questions → searching workspace evidence…"* then posts the review table.

**🎙 VOICEOVER:**
> "You hand it a questionnaire right in Slack. It parses, de-duplicates, and searches your workspace with Slack's Real-Time Search API — and every search is scoped to what *you* can see. So the agent can never surface evidence from a channel you're not in. That permission boundary isn't a setting; it's the foundation."

**🔤 On-screen text:** `Real-Time Search API · scoped to the requester · rate-budgeted planner`

**🧭 Why this wins:** RTS shown as *load-bearing* (Tech), and the permission-scoping sets up the invariant payoff. "Rate-budgeted planner" is a depth cue engineers register.

---

### Scene 5 — THE PEAK: the refusal
**⏱ 1:15–1:40 · 🎯 The emotional and intellectual center. Hold on it. Drop the music.**

**🎬 ON SCREEN:** The review table shows three states. Encryption + MFA = **✅ Grounded** with citations. Insurance + hosting-region = **✋ Needs SME**. Click **Review** on **"Do you carry cyber liability insurance?"** The card opens with **no draft** and the line: *"Asked & Answered would rather ask a human than invent a compliance answer."* **Music cuts to silence. Hold two full seconds.**

**🎙 VOICEOVER:** *(after the silence)*
> "Here's the moment that matters. The evidence for this one lives in a private channel this user can't see. Every other agent would still write something plausible. This one stops — and routes it to a human. That refusal is not an error state. It is the product."

**🔤 On-screen text:** `Needs SME — no visible evidence. It refuses. That's the feature.`

**🧭 Why this wins:** This single frame *is* the Idea and the Impact fused — the judge watches the "refuses to guess" thesis become literal. The two-second silence is what makes it land on a fatigued reviewer.

---

### Scene 6 — Deterministic grounding, not prompt-engineering
**⏱ 1:40–2:02 · 🎯 Prove the "safety shell" is code, not vibes. Signal depth.**

**🎬 ON SCREEN:** Cut to `#engineering` showing the planted poison line: *"we do NOT encrypt customer data at rest."* Re-open the **encryption** answer card: it still cites the real **`#security` AES-256 / KMS** message. Circle the citation permalink.

**🎙 VOICEOVER:**
> "We don't trust the model to cite honestly. A component called GroundingGate checks every cited snippet against the evidence that was actually retrieved — an exact or high-overlap match. A planted contradiction, a fabricated quote, an out-of-context citation — all downgraded automatically to 'Needs SME.' Deterministic. Not prompt-engineered."

**🔤 On-screen text:** `GroundingGate · snippet-level citation verification · fabrications fail closed`

**🧭 Why this wins:** Tech depth made visible; the poison doc is a live adversarial demo. "Deterministic, not prompt-engineered" is the line that separates us from every prompt-gated rival.

---

### Scene 7 — Two human gates + tamper-evident ledger
**⏱ 2:02–2:25 · 🎯 Governance depth: the model can propose, only humans commit — twice.**

**🎬 ON SCREEN:** On a Grounded answer, click **Confirm** (as one user), then **Approve** (the button now reads Approve; a second, distinct user approves). Then in the DM type `verify ledger`. Bot replies the chain verifies intact. `‹TIGHT: show only the Approve + verify ledger reply›`

**🎙 VOICEOVER:**
> "Nothing enters the approved library without two different humans — one confirms, a second approves. Every action is appended to an event-sourced, hash-chained ledger, so the approval trail is tamper-evident. `verify ledger` re-checks the whole chain live. The agent can draft and propose; it can never self-approve."

**🔤 On-screen text:** `Confirm ≠ Approve (distinct humans) · event-sourced hash-chained ledger · agent never self-approves`

**🧭 Why this wins:** Matches the strongest rival's governance and exceeds it (two *distinct actors*, event-sourced). Tech + Design in one beat.

---

### Scene 8 — The compounding payoff (the flywheel)
**⏱ 2:25–2:45 · 🎯 Convert Impact from "simulated" to "watch it compound."**

**🎬 ON SCREEN:** Paste the same four questions again. The encryption row now returns **🛡 Verified — instantly**, crediting the approver, with the caption *"re-checked against your permissions."* Then a clean lower-third: `Per 100 questions: ~37.5 expert-hours saved (simulated).`

**🎙 VOICEOVER:**
> "And it compounds. The answer a human just approved comes back on the next questionnaire as Verified — instantly — and it's *re-checked against your permissions* before it's ever reused. Questionnaire two starts mostly done. Number ten is nearly free. Every approval is a permanent, permission-aware asset."

**🔤 On-screen text:** `Approved once → reused forever (re-validated every time) · impact compounds`

**🧭 Why this wins:** This is the Impact reframe made *visible and honest* — the flywheel is the argument; the simulated number is a labeled footnote, exactly as the honesty rules require.

---

### Scene 9 — The invariant, machine-checked — and close
**⏱ 2:45–3:05 · 🎯 Cash the "formally proved" promise. End on the sentence.**

**🎬 ON SCREEN:** Quick cut to the `/invariant` endpoint JSON (`"status":"pass"`), then a 2-second insert of the terminal: `verifyInvariantZ3.ts → PROVED (unsat)`. Return to the gavel motif and end card.

**🎙 VOICEOVER:**
> "One rule holds the whole system together: no answer text ever reaches someone who can't see all of its evidence. We enforce it in library reuse, in fresh drafts, and in our MCP server — property-tested two hundred times, exposed as a live health check, and proved with Z3. Asked & Answered: your Slack history, turned into finished questionnaires — without inventing a single compliance answer."

**🔤 On-screen text:** `Invariant: no answer outruns its evidence · property-tested · Z3 PROVED · live /invariant`

**🧭 Why this wins:** No competitor pairs a live-checkable *and* formally proved invariant. Closing on `PROVED (unsat)` leaves the engineer-judge with the depth signal ringing.

---

### Scene 10 — End card
**⏱ 3:05–3:12 · 🎯 Make it trivially easy to go verify everything.**

**🎬 ON SCREEN:** Static card, held 5s.

**🔤 On-screen text:**
```
Asked & Answered
The Slack agent that refuses to guess — and proves it.

Live app  ·  asked-and-answered-app.onrender.com
Repo      ·  github.com/theCodeForgerHQ/asked-and-answered
Judge sandbox access: slackhack@salesforce.com · testing@devpost.com
214 tests · 127-case eval · Z3-proved permission invariant
```

**🎙 VOICEOVER (optional):** "Everything you just saw reproduces in the judges' sandbox. Thank you."

---

## 5. Exact assets (copy/paste ready)

**On-screen URLs / IDs:**
- Live app: `https://asked-and-answered-app.onrender.com`
- Live invariant check: `https://asked-and-answered-app.onrender.com/invariant`
- Health (warm-up): `https://asked-and-answered-app.onrender.com/health`
- Repo: `https://github.com/theCodeForgerHQ/asked-and-answered`
- Slack App ID: `A0BHW9UC23A` · Sandbox: `Asked Answered Demo`

**Slack actions used (exact labels):** `Review` · `Confirm` → `Approve` · `Edit` · `Reject` · `Route to an expert` · `Export xlsx` · `Export Canvas` · DM command `verify ledger`.

**Questionnaire (paste fallback):**
```
Do you encrypt customer data at rest?
Is MFA enforced for all employees?
Do you carry cyber liability insurance?
Where is production data hosted?
```

**Expected states (recording user in public channels only):**
| Question | State | Why |
|---|---|---|
| Encrypt data at rest? | ✅ Grounded | `#security` AES-256/KMS is visible |
| MFA enforced? | ✅ Grounded | `#security` Okta MFA is visible |
| Cyber liability insurance? | ✋ Needs SME | evidence only in `#compliance-private` |
| Production data hosted where? | ✋ Needs SME | `eu-west-1` only in `#compliance-private` |
| (Re-run) Encrypt at rest? | 🛡 Verified | reused from the approval in Scene 7 |

**Depth B-roll inserts (2s each):** `PROVED (unsat)` · `214/214 passed` · `127 cases … 100%`.

---

## 6. Depth one-liner bank (drop any into the VO if a beat runs short)

Use these to make an engineer-judge nod — each maps to a real module:

- "The question matcher uses split-conformal prediction — a statistical coverage guarantee, not a magic 0.8 threshold." (`src/core/conformal.ts`)
- "An evidence graph tracks supports / contradicts / supersedes — so a Verified answer degrades itself when newer evidence contradicts it." (`src/core/evidenceGraph.ts`)
- "The drafters are a heterogeneous jury — Anthropic, OpenAI, Azure — reconciled behind one deterministic gate." (`src/core/jury.ts`)
- "The MCP server exposes the approved library read-only and fails closed by default — an unconfigured server redacts every evidence-backed answer." (`src/mcp/serverV2.ts`)
- "Untrusted evidence is NFKC-normalized and delimiter-hardened before it ever reaches the model — homoglyphs, zero-width joiners, RTL marks." (`src/core/sanitize.ts`)
- "The eval separates guard-only metrics from model-dependent ones — the fail-closed and injection numbers hold regardless of which LLM drafts."

---

## 7. Contingencies

- **RTS returns nothing on camera (cold cache):** you warmed it in pre-flight; if it still lags, cut to the pre-recorded warm take. Never show a spinner longer than 3s.
- **Canvas export falls back to Markdown:** don't feature Export Canvas on camera unless the native Canvas renders; `Export xlsx` is the reliable beat. (Design is already carried by the review table + App Home.)
- **Render cold start mid-record:** keep the `/health` tab pinging; if the app sleeps, wake it and re-take the affected scene only.
- **Two-user gate is awkward to stage:** use two browser profiles / two sandbox users; the Confirm-then-Approve buttons switch based on state, so screenshot both states if a single continuous take is hard.
- **Over length:** apply every `‹TIGHT›` cut → lands ~2:40 with the refusal, grounding, and invariant fully intact.

---

## 8. Publishing metadata

**YouTube/Vimeo — public, unlisted-off.** Warm the app before you share the link.

**Title:**
`Asked & Answered — the Slack agent that refuses to guess (and proves it) | Slack Agent Builder Challenge`

**Description box:**
```
Asked & Answered turns your team's Slack history into completed security
questionnaires — every answer evidence-cited, SME-approved, and tamper-evidently
logged. It never invents a compliance answer: no visible evidence → no answer →
a human is asked instead.

The one idea: a deterministic safety shell decides what may be returned; the LLM
is only one input to that shell. We prove the core rule with Z3 — no answer text
ever reaches a requester who cannot see all of its evidence.

Built with: Slack Real-Time Search API (the evidence engine, scoped per user),
Slack AI surfaces (agent Messages tab, Block Kit review, App Home, Data Table,
Canvas, Workflow Builder step), and an MCP server exposing the approved-answer
library read-only and fail-closed.

214 hermetic tests · 127-case eval (103 dev / 24 held-out) · deterministic
GroundingGate · event-sourced hash-chained ledger · two distinct human gates ·
Z3-proved permission invariant.

Live app:  https://asked-and-answered-app.onrender.com
Repo:      https://github.com/theCodeForgerHQ/asked-and-answered
```

**Thumbnail:** the gavel + the line **"It refuses to guess."** on a dark field. High contrast, three words, no clutter.

---

## 9. Why this script takes us from 4th to 1st (self-audit against `FINAL_JUDGE_COMPARISON.md`)

| Pillar | Was | This video's lever | Result |
|---|---|---|---|
| **Quality of the Idea** (8.5) | "org-memory isn't new" | Scenes 1, 3, 5 reframe the *inversion* + machine-checked invariant as the idea; the refusal makes it visceral | Reads as top-of-track novelty |
| **Potential Impact** (7.0 — our weakest) | "impact is simulated" | Scenes 2 + 8 sell universality, the correctness==value asymmetry, and the *live* compounding flywheel; simulated number demoted to a labeled footnote | Parity or above, honestly |
| **Technological Implementation** (9.0–9.5) | already strong | Scenes 4, 6, 7, 9 *show* RTS-load-bearing, deterministic GroundingGate, two-actor ledger, and `Z3 PROVED` | Depth felt, not claimed |
| **Design** (8.0–8.5) | already strong | Streamed plan, Block Kit review table, three-state cards, App Home / invariant surfaces on camera | Held |

The engineering is done. This is the artifact that makes a judge *feel* it in three minutes — and vote us first.
