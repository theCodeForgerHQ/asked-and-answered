# Demo Voiceover v7 — spoken script only

Every security questionnaire your team gets asked — encryption, MFA, backups — your team already answered, somewhere in Slack. The problem isn't knowledge. It's that the knowledge is buried, and the person digging it out is your most expensive engineer.

This is Asked & Answered. Watch it take one question through an entire compliance pipeline — with a guarantee no other tool makes: it never invents a compliance answer.

One question, pasted like a colleague would. Behind that first message it's running Slack's Real-Time Search across only the channels I can see — permissions are inherited, never widened.

And here's the design decision that matters: the model is never consulted without evidence in hand. No evidence, no draft — the question goes to a human instead. The LLM literally cannot freelance.

Grounded — with a receipt. Click the citation and you land on the real message in the security channel where our team said it.

Every drafted sentence must be backed by a citation the requester can see right now — that's not a prompt instruction, it's a deterministic gate in code, and the invariant behind it is machine-proved with the Z3 theorem prover. If a citation stops being visible to you, the answer is withheld. Fail closed, always.

Now watch it refuse me. I try to approve the draft it just wrote for me — blocked: nothing enters the library until a human has confirmed it.

So I route it to the expert. Sarah gets a DM, reviews the evidence, signs her answer. And only now — with her name on the confirmation — does my approval land. If I had confirmed it myself, it would have refused me again: the approver must be a different human.

Two mandatory gates, two distinct people, on every answer that enters the library. AI drafts; humans decide — enforced by the state machine, not by a policy document.

Same question, ten seconds later — instant, and now it's Verified: pre-approved, human-signed, citation intact. Every approval compounds into a reusable library, so the second questionnaire is cheaper than the first, and the fiftieth is nearly free.

And every run writes a decision log to a native Slack Canvas — the audit artifact writes itself.

One more thing you can't fake: every human decision you just watched went into a tamper-evident, hash-chained ledger — and anyone can verify it, from inside Slack.

So here's the whole product in one sentence: security teams eliminate the hours lost to repeat questionnaire answers — with zero un-cited, un-approved claims, enforced by a Z3-proven permission invariant, 288 automated tests, and a 136-case eval — by turning Slack itself into an evidence-grounded, human-gated answer pipeline.

Your team already answered this. Asked & Answered just proves it.
