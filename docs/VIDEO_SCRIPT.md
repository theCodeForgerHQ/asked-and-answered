# Demo video script (target ≤ 2:40, product footage only)

Rules: real product on screen by 0:20. No slides. No competitor names on screen.
No third-party music. Fully synthetic questionnaire. Speak the refusal line aloud.

| Time | Screen | Voiceover |
|---|---|---|
| 0:00–0:15 | The real human: a short quote card or a talking-head clip from an actual security engineer/AE — their name, title, and the hours number. Then a 200-row questionnaire scrolling. | "[Name], a security engineer, told us her last vendor questionnaire took [N] hours — and most of it she'd answered before." |
| 0:15–0:35 | Slack Messages tab. Drag `sample-questionnaire.xlsx` in. The agent streams a plan: parsed → deduped → searching. | "Asked & Answered is a Slack agent. Hand it a questionnaire, and it searches your own workspace for the answers." |
| 0:35–1:05 | The Block Kit review table fills in: green Verified/Grounded rows, a raised-hand Needs-SME row. Open a Grounded card — show the draft and its citation permalink. Approve it. | "Every answer is grounded in real Slack evidence, and cited. You approve with one click." |
| 1:05–1:35 | **The peak.** Open the *cyber liability insurance* card: no draft, the refusal message. Read it aloud. Click Route → pick an expert → their DM arrives. | "When there's no evidence, it does not guess. It would rather ask a human than invent a compliance answer. That's the whole product." |
| 1:35–1:55 | Type `verify ledger` → intact. Then (from the repo) show `npm run smoke` printing "Tamper detected at ledger entry #0". | "Every approval is logged to a tamper-evident ledger. Change one entry, and verification catches it." |
| 1:55–2:20 | Paste the same questions again. The encryption row returns **Verified** instantly. Export xlsx → open it, show citations + approver columns. | "Approved answers compound. The second questionnaire starts mostly done — cited, and permission-checked for whoever's asking." |
| 2:20–2:40 | The eval card: fail-closed [X]%, injection resistance [X]%, on-screen "measured: seeded workspace, 15 labeled cases". End on the repo + "MCP · RTS · Slack AI". | "Fail-closed, permission-safe, and measured. Asked & Answered." |

## Recording checklist
- [ ] Sandbox seeded (`scripts/seed-sandbox.ts`), judge test user in public channels only.
- [ ] `npm run smoke` rehearsed for the tamper clip.
- [ ] Eval numbers on the card match `docs/EVALS.md` exactly.
- [ ] Upload to YouTube **public**, well before the deadline (processing lag).
- [ ] Under 3:00. Two 1st-place winners in our research came in under 2:00 — tight beats padded.
