# Demo Script v7 — "One Question"

**Runtime:** ~2 min 45 s · **Format:** screen recording of the Slack web client, one continuous take
**Workspace:** Asked Answered Demo · **App:** Asked & Answered (A0BHW9UC23A)
**Cast:** two browser tabs — Tab A = your main account (requester/approver), Tab B = Demo User (confirmer)
**Core move:** no spreadsheet, no montage. ONE question, and you own every stage of the pipeline on camera: search → grounded draft → citation → human gates → library → tamper-evident ledger.

---

## Pre-flight (do this 10 minutes before recording)

1. `curl -s -H 'Accept: application/json' https://asked-and-answered-app.onrender.com/health` → confirm `"status":"ok"` and `canvas:true, lists:true`.
2. The demo question must NOT already be in the approved library — the library persists between runs and would short-circuit the "grounded" beat straight to "verified". Either trigger a fresh Render deploy (wipes the DB) or confirm a fresh run of the question shows *grounded*, not *verified*.
3. **Rehearse with a different question** ("Is MFA enforced for all employees?") so rehearsal approvals don't contaminate the demo question.
4. Tab A: open the **Asked & Answered** app → Messages tab. Tab B: sign in as Demo User, same place. Arrange tabs so you can switch in one click.
5. Have `https://asked-and-answered-app.onrender.com/safety-report` open in a third tab, hidden behind the Slack window.

---

## SCENE 1 — Cold open: the claim (0:00–0:15)

**ACTION:** Slack web client already open on the Asked & Answered App Home dashboard (stats, invariant badge). Cursor still.

**SAY:**
> "Every security questionnaire your team gets asked — encryption, MFA, backups — your team already answered, somewhere in Slack. The problem isn't knowledge. It's that the knowledge is buried, and the person digging it out is your most expensive engineer.
> This is Asked & Answered. Watch it take one question through an entire compliance pipeline — with a guarantee no other tool makes: **it never invents a compliance answer.**"

*Rubric: IDEA — one-sentence novel claim (fail-closed compliance agent), stated before any UI motion.*

## SCENE 2 — Ask the one question (0:15–0:45)

**ACTION (Tab A):** Click into the Messages tab of the app. Type, on camera:
`Do you encrypt customer data at rest?`
Hit Enter. The progress messages stream in: *"Searching workspace evidence…" → "Evidence retrieval complete. Drafting evidence-grounded answers…"*

**SAY (over the progress messages):**
> "One question, pasted like a colleague would. Behind that first message it's running Slack's Real-Time Search across only the channels **I** can see — permissions are inherited, never widened.
> And here's the design decision that matters: the model is never consulted without evidence in hand. No evidence, no draft — the question goes to a human instead. The LLM literally cannot freelance."

*Rubric: DESIGN — narrate the architecture while the product visibly does it. No dead air: the pipeline's own progress messages are your B-roll.*

## SCENE 3 — The receipt: citation click (0:45–1:15)

**ACTION (Tab A):** The summary lands: *"0 verified · 1 grounded in workspace evidence · 0 need a human"*, then the **Review** card. Click the **Review** button on the question row. The answer card appears — answer text plus citation. Click the citation permalink → Slack jumps to the actual message in **#security**: *"All customer data is encrypted at rest with AES-256 managed by AWS KMS…"*

**SAY:**
> "Grounded — with a receipt. Click the citation and you land on the real message in #security where our team said it.
> Every drafted sentence must be backed by a citation the requester can see *right now* — that's not a prompt instruction, it's a deterministic gate in code, and the invariant behind it is machine-proved with the Z3 theorem prover. If a citation stops being visible to you, the answer is withheld. Fail closed, always."

*Rubric: DESIGN + IDEA — the citation click is the single most convincing 5 seconds of the demo. Slow down here.*

## SCENE 4 — It refuses its own author (1:15–1:35)

The buttons on a grounded answer card are **Confirm / Edit / Reject**. Approve only appears after a confirm — and it will still refuse the same human. Show both refusals on camera.

**ACTION (Tab A), on the answer card from Scene 3:**

1. Click **Confirm** → *"📝 Confirmed by @you — ready for final approval by a different human."*
2. Back on the Review message, click the row's **Review** button again → a fresh answer card posts, the primary button is now **Approve**.
3. Click **Approve** → *"✋ …not in the library yet: the final approval must come from a **different human** than the confirmer."* Let that refusal sit on screen for a beat.

**SAY:**
> "I confirm the draft — one human gate down. But when I try to give it the *final* approval myself — refused. The approver must be a different human than the confirmer. My own rubber stamp doesn't count.
> That's not a policy document. It's the state machine: nothing enters the reusable library on one person's say-so."

*Rubric: DESIGN (craft) — you're demoing the failure modes on purpose. Judges reward products that show their guardrails working, not just their happy path.*

## SCENE 5 — The expert loop closes it (1:35–2:15)

Now show the second human — via the flow that exists for it: **Route to an expert**. Use a question the workspace *can't* prove, which also demos the honest refusal.

**ACTION:**

1. **Tab A:** paste `Do you operate a bug bounty program?` → summary: *"…1 need a human"*. Click the row's **Review** button → the card says *"No draft — no evidence found in this workspace. Asked & Answered would rather ask a human than invent a compliance answer."* with one button: **Route to an expert**.
2. **Tab A:** click **Route to an expert** → user picker → choose **Demo User**→ *"📨 Routed to @Demo User."*
3. **Tab B (Demo User):** the bot's DM has arrived → click **Provide an answer** → modal opens → type: `Not yet — a private bug bounty program launches Q4 2026; until then we run annual third-party penetration tests.` → **Approve & save**. That records Demo User as the human confirmer.
4. **Tab A:** click the row's **Review** button again → the card now shows the expert's answer with **Approve** → click it → *"✅ Approved by @you — saved to the answer library."* Two distinct humans, loop closed.
5. **Tab A:** paste the same bug-bounty question again → *"1 verified from the approved library"*, instantly — and the bot's **Native Canvas** decision log link. Click it: question, answer, who confirmed, who approved, when.

**SAY:**
> "And when the workspace can't prove an answer? It says so — no draft, no guess — and hands me a single button: route it to a human who knows.
> Sarah gets the DM, writes the real answer, signs it. Her name is the confirmation; now my approval lands, and the loop is closed — two distinct humans on record.
> Ask it again — instant, *Verified*, pre-approved. Every answer a human signs compounds into a reusable library, so the second questionnaire is cheaper than the first and the fiftieth is nearly free. And the decision log writes itself to a native Slack Canvas."

*Rubric: POTENTIAL IMPACT — refusal-to-hallucinate, human routing, and compounding economics in one 40-second arc.*

## SCENE 6 — Proof, then the XYZ close (2:15–2:45)

**ACTION (Tab A):** Type `verify ledger` in the DM → *"✅ Ledgers intact… entries."* Then flash the `/safety-report` browser tab for ~3 seconds (Z3 proofs + ledger verification, one page).

**SAY:**
> "One more thing you can't fake: every human decision you just watched went into a tamper-evident, hash-chained ledger — and anyone can verify it, from inside Slack.
> So here's the whole product in one sentence: **security teams eliminate the hours lost to repeat questionnaire answers — with zero un-cited, un-approved claims, enforced by a Z3-proven permission invariant, 288 automated tests, and a 136-case eval — by turning Slack itself into an evidence-grounded, human-gated answer pipeline.**
> Your team already answered this. Asked & Answered just proves it."

*Rubric: IMPACT + IDEA — the Google XYZ sentence ("accomplished X, measured by Y, by doing Z") is the last thing judges hear. End on the tagline, hard cut.*

---

## The XYZ articulations (reuse in submission copy)

- **X (accomplish):** eliminate repeat security-questionnaire work and hallucinated compliance claims
- **Y (measured by):** 0 answers released without visible citations + distinct-human approval; Z3-proved invariant (abstract + code-level); 288 tests; 136-case eval; tamper-evident ledger verifiable in-channel
- **Z (by doing):** an evidence-grounded, fail-closed pipeline on Slack Real-Time Search with two enforced human gates and a compounding approved-answer library

## Why one question beats a spreadsheet on camera

A 47-row xlsx demos *throughput*; judges can't verify throughput in a video and rate-limits make it drag. One question demos *the pipeline* — search, grounding, citation, refusal, governance, reuse, audit — and every beat is verifiable on screen. Depth over volume is what the design rubric rewards.

## Beat → rubric map

| Beat | Rubric area |
|---|---|
| Cold open claim ("never invents") | Idea / novelty |
| Progress-message narration | Design (architecture made visible) |
| Citation click into #security | Design + trustworthiness |
| Blocked approvals (two-human gate) | Design craft (guardrails on camera) |
| Instant Verified + Canvas log | Potential impact (compounding economics) |
| `verify ledger` + safety report | Impact (auditability) + idea |

## Known traps

- **Don't rehearse with the demo question** — an approved rehearsal answer makes Scene 2 show *verified* instead of *grounded*.
- **Render deploys wipe the library** — a deploy between rehearsal and recording resets everything (which is also the cleanest way to reset).
- Avoid "cyber liability insurance" and "hosted geographically" as demo questions — workspace seed data grounds both, so they no longer demo the Needs-SME path.
- If you want a Needs-SME beat instead of Scene 4's blocked-approve beat, ask something with no workspace evidence (e.g. `Do you operate a bug bounty program?`) and show **Route to SME** — but keep the runtime under 3:00.
- Occasionally a run comes back *"Needs SME — draft cited evidence that does not support the answer."* That's the deterministic grounding gate refusing a sloppy LLM draft — the product failing closed, exactly as designed. On camera you can either re-ask the question, or *feature it*: "it just refused its own draft rather than ship an unsupported answer." The encryption question grounds most reliably because the evidence phrasing ("encrypted at rest with AES-256") echoes naturally into the answer.
- The SME modal (Provide an answer) is the one step that requires a real click in a real session (`trigger_id`); every other beat in this script was verified end-to-end against the live deployment on 2026-07-14.
