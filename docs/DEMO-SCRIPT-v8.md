# Demo Script v8: "Two Thirds to One Hundred"

**Runtime:** ~3 min 30 s, one continuous screen recording of the Slack web client. No motion graphics, no subtitles, no edits beyond pause/resume.
**Workspace:** Asked Answered Demo, `https://app.slack.com/client/E0BGZV586KG`
**Cast:** two browser windows.
- **Tab A** = you (requester, confirmer in round 1). Bot DM: sidebar → *Agents & apps* → **AskedAnswered**.
- **Tab B** = your teammate's session, signed in as **Demo User** (the second human). Same app DM.
**Third tab, hidden behind Slack:** `https://asked-and-answered-app.onrender.com/safety-report`

**The spine of this demo:** ask three questions cold, watch the product answer two and honestly refuse the third, close both human loops, ask again, and watch the auto-answer rate go from a visible two-thirds to a visible one hundred percent. Every number spoken is either on screen or derived from one shown at the open. The cold open plants "watch what it refuses to do"; scene 6 pays it off.

---

## Pre-flight (10 minutes before recording)

1. `curl -s https://asked-and-answered-app.onrender.com/health` returns `ok`.
2. None of the three demo questions may already be in the approved library. Trigger a fresh Render deploy (the free-tier disk wipes the DB) or verify a fresh ask shows *grounded*, not *verified*.
3. **Rehearse with a different question** (`What is your password policy?`) so rehearsal approvals never contaminate the demo set.
4. The three demo questions, verified against workspace seed evidence:
   - `Do you encrypt customer data at rest?` → grounded (the AES-256 message in #security)
   - `Where is customer data hosted geographically?` → grounded (the us-east-1 message in #engineering)
   - `Do you operate a bug bounty program?` → needs a human (no seed evidence)
   If the geography question ever comes back needs-a-human on a test run, swap in `Is MFA enforced for all employees?` and pick a new rehearsal question.
5. Tab A and Tab B both open on the **AskedAnswered** DM. Practice the window switch once.
6. Open the App Home once in Tab A (click the app name at the top of the DM, then the **Home** tab) so the dashboard is warm for the cold open.
7. Open `/safety-report` in the hidden tab and note where the metric cards sit, you will point at two of them.

---

## SCENE 1: Cold open, the wall every deal hits (0:00–0:18)

**ACTION (Tab A):** Recording starts on the **AskedAnswered App Home**: the *Asked & Answered — Compliance memory* header, the stats block, the two green health ticks. Move the cursor slowly down the stats while you speak. At 0:15, click **Chat** to switch to the message tab.

**SAY:**
> "Every enterprise deal stops at the same wall: a security questionnaire. A hundred rows, half an hour each, and it lands on a 150-dollar-an-hour security engineer. That's 7,500 dollars a questionnaire, spent retyping answers your company already gave, somewhere in Slack.
> This is Asked & Answered. Watch what it does with three questions. And watch what it refuses to do."

## SCENE 2: Three questions, one paste (0:18–0:48)

**ACTION (Tab A):** In the **AskedAnswered** DM message box, type or paste on camera, as ONE message with each question on its OWN line (press **Shift+Enter** between them; the parser splits questions by line, so a single-line paste becomes one compound question and gets refused):
```
Do you encrypt customer data at rest?
Where is customer data hosted geographically?
Do you operate a bug bounty program?
```
Press Enter. The bot threads its progress live: *"Parsed 3 questions → 3 after removing 0 duplicates. Searching workspace evidence…"* then *"Evidence retrieval complete. Drafting evidence-grounded answers…"*. The summary lands: *"✅ 0 verified from the approved library · 🔍 2 grounded in workspace evidence · ✋ 1 need a human"*. Hold on that line.

**SAY (over the live progress messages, finish after the summary lands):**
> "Three questions, pasted like I'd ask a colleague. Three rows of the hundred, the other ninety-seven are just more rows. It starts searching: Slack's real-time search, only the channels I can see. The model doesn't get to say a word until there's evidence on the table.
> There's the score. Two grounded in real workspace evidence, and one it won't touch. Two out of three on a cold start, and it just told me the truth about the third."

## SCENE 3: The receipt (0:48–1:14)

**ACTION (Tab A):** The summary message lists the three question rows, each with a **Review** button. Click **Review** on the encryption row. The answer card posts: the question, the drafted answer, and a 🔗 **evidence 1** link. Click **evidence 1**. Slack jumps to the original message in **#security**: *"All customer data is encrypted at rest with AES-256 managed by AWS KMS…"*. Hold on that message for two full seconds. Click back into the app DM.

**SAY:**
> "Grounded, with a receipt. One click on the citation and I'm standing on the exact message in #security where our engineer said it. That's the difference between an AI that sounds right and an answer you can defend in an audit.
> And after the model drafts, a separate check in plain code verifies every sentence against that evidence and throws out anything that doesn't hold up. We attacked those guards ourselves: 136 adversarial cases, prompt injection, poisoned documents. Zero leaks. The scoreboard's at the end of this video."

## SCENE 4: It refuses its own author (1:14–1:38)

**ACTION (Tab A), on the answer card from Scene 3:**
1. Click **Confirm**. The bot replies: *"📝 Confirmed by @you. Final approval must come from a different human."* with a **Choose an approver** dropdown attached. Leave the dropdown alone for now.
2. Click the encryption row's **Review** button again. A fresh card posts, and the primary button now reads **Approve**.
3. Click **Approve**. The refusal posts: *"✋ @you — not in the library yet: the final approval must come from a different human than the confirmer."* Let the refusal sit on screen for a beat.

**SAY:**
> "I confirm the draft. That's the first human gate. Now watch me try to cheat: same card, and I give it final approval myself.
> Refused. I confirmed it, so my approval is worthless. That's not a policy document, that's the state machine, and it just stopped the person who built it. No answer your company reuses ever rests on one person's say-so."

## SCENE 5: The second human, in her own DM (1:38–2:02)

**ACTION:**
1. **Tab A:** On the confirmation message, open the **Choose an approver** dropdown and pick **Demo User**.
2. **Switch to Tab B (Demo User's window):** A DM from AskedAnswered has arrived: *"🛡️ @you needs your final approval on a questionnaire answer."* with the full answer card, the same 🔗 **evidence 1** citation, and **Approve / Edit / Reject**. Hover the citation link for a second so it registers. Click **Approve**. The bot confirms: *"✅ Approved by @Demo User — saved to the answer library."*
3. **Switch back to Tab A:** The run thread has already been notified: *"✅ Do you encrypt customer data at rest? approved by @Demo User — saved to the answer library."*

**SAY:**
> "So I hand it to my teammate, and this is her screen now. The request lands in her own DM with the same answer and the same citation I saw. She isn't approving my word, she's approving the receipt.
> One click, and back on my side the thread already knows. Two named humans on the record, and both signatures just went into a tamper-evident ledger. We'll check that ledger before we're done."

## SCENE 6: The refusal, paid off (2:02–2:36)

**ACTION:**
1. **Tab A:** Back on the summary message, click **Review** on the bug-bounty row. The card reads: *"No draft — no evidence found in this workspace. Asked & Answered would rather ask a human than invent a compliance answer."* with one button: **Route to an expert**. Hold for a beat.
2. Click **Route to an expert** and pick **Demo User**. The thread shows: *"📨 Routed to @Demo User."*
3. **Tab B:** The expert request is in: *"✋ @you needs your expertise on a questionnaire question…"*. Click **Provide an answer**. In the modal, type: `Not yet. A private bug bounty launches Q4 2026; until then we run annual third-party penetration tests.` Click **Approve & save**.
4. **Tab A:** Her answer card is already in the run thread, marked confirmed by Demo User, needing a different human. Click **Approve**: *"✅ Approved by @you — saved to the answer library."*

**SAY:**
> "Now the question it refused, which is the feature I'm proudest of. Every AI tool I've used would have written something confident and wrong right here. This one shows me a refusal and one button: route it to a human who knows.
> My teammate types the real answer and signs it. It enters the library labeled as expert testimony, so an auditor always knows a human vouched for this, not a document. And the roles just flipped: she confirmed, so now I'm the second human. Same rule in both directions."

## SCENE 7: Ask again, two thirds becomes one hundred (2:36–3:06)

**ACTION (Tab A):** Paste the exact same three-question message again and press Enter. The summary comes back: *"✅ 2 verified from the approved library · 🔍 1 grounded in workspace evidence · ✋ 0 need a human"*. Hold on it for a beat. Click **Open table view**: the modal opens with all three rows and per-row **Review** buttons. Close it. Rest the cursor on the **Export xlsx**, **Export Canvas** and **Export List** buttons under the table message for a second each.

**SAY:**
> "Same three questions. Zero human minutes this time. The two that humans signed come back verified, instantly, and the one that stumped it ten minutes ago now has a signed answer in the library. Needs-a-human went from one to zero, on camera.
> That's the business. Every signed answer becomes an asset, so your first questionnaire costs a few clicks of review and your fiftieth is nearly free. Ten a month is 75 thousand dollars of engineer time at the rate we opened with, and most of it comes back after the first pass. And the number nobody puts on a slide: your deals stop waiting a week on the security queue. It exports to a spreadsheet, a canvas, or a Slack list, one click each."

## SCENE 8: Verify everything, then the bet (3:06–3:30)

**ACTION (Tab A):** Type `verify ledger` in the DM. The reply: *"✅ Ledgers intact. Legacy: … entries. Event-sourced: … entries."* (real counts will show; both ledgers are cross-checked). Then bring the hidden browser tab forward: `https://asked-and-answered-app.onrender.com/safety-report`. Hold it for a full six seconds. Move the cursor deliberately onto the **Eval harness 136/136** card, then onto the **Z3 proof: PROVED** card. Then cut back to the Slack App Home, cursor resting on the two green health ticks.

**SAY:**
> "Everything you just watched, every confirm, every approval, every refusal, went into a hash-chained ledger, and anyone in the workspace can verify it by typing two words.
> And the rule underneath it all, that no answer ever reaches someone who can't see its evidence, isn't just tested. There's the eval: 136 for 136 against a real production model. And there's the proof: a formal verification tool checked that rule mathematically. The verdict's right there on the card.
> One last thing. The whole industry is trying to make AI sound more trustworthy. We made trust not depend on the AI at all.
> Your team already answered this. Asked & Answered just proves it."

---

## The XYZ articulations (for submission copy, not for the voiceover)

- **X (accomplish):** cut security-questionnaire SME time from 30 min/question toward zero and eliminate uncited compliance claims
- **Y (measured by):** auto-answer rate measured on camera at 66.7% cold → 100% after one approval cycle; 136/136 adversarial eval on a real LLM with 0 guard leaks; Z3-proven permission invariant (design and code level); hash-chained ledger verifiable in-channel
- **Z (by doing):** an evidence-first, fail-closed pipeline on Slack real-time search with two enforced human gates and a compounding, permission-aware answer library

## Why this beat order

1. Stakes in the first breath: the wall every deal hits, one derivable number ($7,500), and a planted hook ("watch what it refuses to do") that scene 6 pays off.
2. The 3-question batch makes the headline metric visible twice: "2 grounded · 1 need a human" then "2 verified · 1 grounded · 0 need a human". Two thirds to one hundred is watched, not claimed.
3. The citation click is the trust moment, and the voiceover names why it matters: audit-defensible versus sounds-right.
4. Guardrails demoed against the operator beat any happy path. Judges reward products that show their failure modes on purpose.
5. The second human acts in her own window, with the evidence in front of her. The approval loop is real, not staged in one account.
6. The refusal card plus expert routing is the differentiator, framed as the feature the builder is proudest of, and the role reversal proves the two-human rule is symmetric.
7. Impact lands twice: dollars that reconcile with the open ($75K), then the unmodeled one, deal velocity.
8. The close points at two on-screen cards (136/136, PROVED), states the category bet in one breath, then lands the tagline.

## Known traps

- Rehearsal approvals contaminate the library. Rehearse only with `What is your password policy?`, or redeploy to wipe.
- Do NOT use "cyber liability insurance" as the needs-a-human question; workspace seed data grounds it.
- The **Run Z3 proof** App Home button works but takes about a minute on the free tier. Don't click it live; the safety-report page shows the same verdict instantly.
- If a run comes back *"Needs SME — draft cited evidence that does not support the answer"*, that's the grounding gate refusing a sloppy draft. Re-ask, or feature it: "it just refused its own draft rather than ship an unsupported answer."
- The modal steps (**Provide an answer**, **Approve & save**) need a real click in a real session. Every other beat in this script was verified end-to-end against the live deployment on 2026-07-15, with two real users.
- Bot replies thread under your message. Keep the thread pane open while recording.
- **One question per line, always** (Shift+Enter). Pasting all three on one line makes the parser treat them as a single compound question, and the grounding gate will refuse the draft with "Needs SME — draft cited evidence that does not support the answer".
- The re-ask in Scene 7 re-drafts the geography question (it was never approved), so allow a few seconds; the progress messages cover the gap.
