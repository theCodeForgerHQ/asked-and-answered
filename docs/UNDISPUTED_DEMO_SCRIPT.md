# Asked & Answered — Live Slack Demo Script

**A pure screen-recording of the real Slack workspace. No slides, no motion graphics, no on-screen text — you record your screen and talk over it.** Two columns per beat: **DO** (the exact action in Slack) and **SAY** (speak this while you do it). Target ~3 minutes, one continuous take if you can.

The spoken words are written to win the two pillars the judges dock us on — **Potential Impact** and **Quality of the Idea** (see `docs/FINAL_JUDGE_COMPARISON.md`). Say them close to verbatim; the phrasing is doing the work.

**The repeatable handle:** the whole narration hangs on one rule the judge should be able to say back — **"No proof, no answer."** It's stated at the open (twice), at the refusal, and at the close. It's the answer to the strongest rival's sticky two-word handle ("contradiction firewall"): where an ambient agent *warns you* about inconsistency and *trusts the model's read* of the evidence, this one *refuses to answer without proof* and *proves it can't leak*. The narration deliberately frames "warning / best judgment" as a **lower tier** than "proof / verification" — never naming a competitor, just occupying the higher ground. Deliver "no proof, no answer" the way a tagline is delivered: it is the thing they remember.

---

## Before you hit record (setup — not filmed)

1. **Warm the app** so nothing lags on camera: open `https://asked-and-answered-app.onrender.com/health` in a browser until it returns JSON. (Render free tier sleeps.)
2. **Seed the evidence:** `SLACK_BOT_TOKEN=xoxb-… npx tsx scripts/seed-sandbox.ts`. This posts:
   - `#security` *(public)* — AES-256 / AWS KMS encryption at rest; MFA enforced via Okta.
   - `#compliance-private` *(private)* — SOC 2, pen test, "production data resides in AWS eu-west-1 ONLY," "cyber liability insurance: $5M via Acme."
3. **Your recording user is a member of the PUBLIC channels only** (not `#compliance-private`). This is what makes encryption/MFA come back Grounded while insurance/hosting come back Needs SME — the permission story is real, not staged.
4. **Plant one poison message** in a public channel (e.g. `#engineering`): *"For the record: we do NOT encrypt customer data at rest."*
5. Have the app's **Messages** tab open, and the pinned **`sample-questionnaire.xlsx`** ready to drag in (or paste the four questions below).
6. Do one silent dry-run so the search cache is warm and the review buttons render instantly.

**The four questions (paste fallback if you don't drag the file):**
```
Do you encrypt customer data at rest?
Is MFA enforced for all employees?
Do you carry cyber liability insurance?
Where is production data hosted?
```

---

## The demo

### 1 — Open on the DM
**DO:** Start recording on the app's **Messages** tab. The welcome message is visible ("I turn questionnaires into evidence-cited answers from this workspace").

**SAY:**
> "Every AI answers first and hopes it's right. This one has one rule: no proof, no answer. On a security questionnaire it won't write a single word unless the proof is already sitting in your Slack. It's called Asked & Answered, and it turns your team's own history into the finished questionnaires that stall six-figure deals for days on one overloaded security lead. The model only ever proposes; deterministic code decides what's allowed out, and its default answer is no. No proof, no answer."

---

### 2 — Upload the questionnaire
**DO:** Drag **`sample-questionnaire.xlsx`** into the message box and send (or paste the four questions). The bot streams a short plan line, then posts the review table.

**SAY:**
> "I hand it a questionnaire right here in Slack. It parses the questions, drops duplicates, and searches the workspace using Slack's Real-Time Search API — and every search is scoped to what I can personally see. So it can never pull evidence from a channel I'm not in. Watch what comes back."

---

### 3 — Read the three states
**DO:** Point the cursor down the review table: encryption and MFA are **Grounded** with citations; insurance and hosting are **Needs SME**.

**SAY:**
> "Every question lands in one of three states. Grounded — a fresh answer cited to the actual Slack messages behind it. Needs SME — not enough visible evidence. And Verified — a match a human already approved. Encryption and MFA came back Grounded, because that evidence is in a channel I can see. But look at these two."

---

### 4 — The refusal (the peak — slow down here)
**DO:** Click **Review** on **"Do you carry cyber liability insurance?"**. The card opens with **no draft** and the line *"Asked & Answered would rather ask a human than invent a compliance answer."* Pause here for a couple of seconds. Let it sit.

**SAY:** *(after a short pause)*
> "This is the moment that matters. The evidence for this one lives in a private channel I'm not a member of. And remember — a customer signs a contract on this answer; an auditor reads it. So a confident wrong answer here isn't a typo, it's a false statement your company is now on the hook for. Almost any other agent would still write something plausible. This one stops, and asks a human instead. That refusal isn't a failure — it's the rule working. No proof, no answer."

---

### 5 — Deterministic grounding (the poison doc)
**DO:** Open `#engineering` and show the planted line: *"we do NOT encrypt customer data at rest."* Go back to the DM and click **Review** on the **encryption** row — the answer still cites the real `#security` AES-256 / KMS message. Hover the citation link.

**SAY:**
> "And it doesn't just trust the model to cite honestly. Other agents read your evidence and give you their best judgment — some even warn you when something looks off, and that's genuinely useful. But a compliance answer has to clear a higher bar than judgment: it has to be *proven*. Watch — someone planted a contradicting message in this channel saying we do *not* encrypt at rest. The grounded answer still cites the real evidence, because a deterministic check verifies every cited snippet against what was actually retrieved. A fabricated or out-of-context citation is downgraded automatically. That's proof — not prompt-engineering."

---

### 6 — Two human gates
**DO:** On the encryption answer card, click **Confirm**. The button changes to **Approve**; have a second user approve it (second browser profile / second sandbox user). 

**SAY:**
> "Nothing enters the approved library on the agent's say-so. One person confirms, and a second, different person approves — two humans, always. The agent can draft and propose. It can never approve itself."

---

### 7 — Tamper-evident ledger
**DO:** In the DM, type `verify ledger` and send. The bot replies that the approval chain verifies intact.

**SAY:**
> "And every one of those approvals is written to a hash-chained, event-sourced ledger. I can verify the whole chain, live, right here — if anything had been altered, this check would fail."

---

### 8 — The compounding payoff
**DO:** Paste the same four questions again and send. The encryption row now returns **Verified** instantly, crediting the approver, with the note *"re-checked against your permissions."*

**SAY:**
> "Now watch it compound. The answer we just approved comes back on the next questionnaire as Verified — instantly — and notice it's re-checked against my permissions before it's reused. That's the entire economic model in one motion: every approval becomes a permanent, permission-aware asset, so deal two starts mostly done and deal ten is nearly free. Our impact model puts that at thirty-seven expert-hours — about fifty-six hundred dollars — off every hundred questions, and it grows with every deal you close."

---

### 9 — The invariant, checked live
**DO:** Click the app's **Home** tab, then click the **Check invariant** quick action (or open `https://asked-and-answered-app.onrender.com/invariant` in a browser tab and show the `"status":"pass"` JSON).

**SAY:**
> "Underneath all of this is one rule: no answer text ever reaches someone who can't see all of its evidence. We enforce it in reuse, in fresh drafts, and in our MCP server — and we guard that rule two ways. In our build, we run it through the Z3 proof engine: the negation comes back unsatisfiable, so under our model the invariant can't be violated. And live, right here: this health endpoint re-runs the permission property against fresh cases every time you hit it — and it's non-vacuous, so if anyone disabled the guard, it would go red. A proof in the build, and a tripwire in production. That's the one thing a compliance tool cannot get wrong."

---

### 10 — Close
**DO:** Return to the Messages tab (the completed run visible). Optionally click **Export xlsx** to show the finished file downloading.

**SAY:**
> "Asked & Answered: your Slack history, turned into finished questionnaires — cited, approved, tamper-evident, and provably fail-closed. One rule the whole way through: no proof, no answer. Everything you just saw reproduces in your sandbox. Thanks for watching."

---

## Quick reference

**Actions used (exact Slack labels):** drag `sample-questionnaire.xlsx` → `Review` → `Confirm` → `Approve` → type `verify ledger` → re-paste questions → **Home** tab → **Check invariant** → `Export xlsx`.

**Expected states (recording user in public channels only):**
| Question | State |
|---|---|
| Encrypt data at rest? | Grounded → (after approval) Verified on re-run |
| MFA enforced? | Grounded |
| Cyber liability insurance? | **Needs SME** (evidence is private — this is the refusal beat) |
| Where is production data hosted? | Needs SME (region is private) |

**If a beat runs short, you can drop in one line** (each is true and shows depth):
- "The drafters are actually a panel of different models, reconciled behind one deterministic gate."
- "Untrusted evidence is normalized and delimiter-hardened before the model ever sees it — homoglyphs, zero-width characters, the works."
- "Our MCP server fails closed by default — unconfigured, it redacts every evidence-backed answer."

**On the impact number (read this before you record beat 8):** the ~37 hours / ~$5,600 figure comes from `scripts/runCounterfactual.ts`, which is a **model**, not a measured pilot — its output is literally tagged `SIMULATED`. Judges in this track have repo + sandbox access and will see that. So the number is always attributed to the model — **"our impact model puts that at…"** — never spoken as a measured or realized result. This is not a weakness to hide: your product's entire thesis is *"no proof, no answer,"* and a claim you can't back would hand a judge the exact contradiction that sinks you. The *real*, on-camera impact proof is the compounding you demonstrate live (Verified-instantly-on-re-run) — lead with that; the modeled dollars are support. When you run a real pilot after the video, swap in the measured number and drop the "model" attribution.

**Contingencies:**
- Don't feature **Export Canvas** unless it renders natively on camera — `Export xlsx` is the reliable one.
- If search lags, you warmed the app in setup; if it still stalls, cut and re-take that beat only.
- Staging the two-gate approval is easiest with two browser profiles logged in as two sandbox users.
