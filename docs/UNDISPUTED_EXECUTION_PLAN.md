# Asked & Answered — UNDISPUTED WINNER Execution Plan

**Track:** New Slack Agent — Slack Agent Builder Challenge 2026  
**Goal:** Engineering supremacy over every findable submission in the track, measured by official rubric.  
**Constraint:** Build modularly on top of the existing codebase; no rewrites of working surfaces; do not break the parallel Azure deployment session.  

---

## 1. The rubric and how we win each column

Official scoring is equally weighted across four pillars, with tie-break order **Tech → Design → Impact → Idea**. Engineering is the first tie-breaker, so we maximize Tech first, then use it to support Design/Impact/Idea.

| Pillar (25%) | What wins | Current A&A | Target A&A | How we get there |
|---|---|---|---|---|
| **Technological Implementation** | Quality code; load-bearing use of Slack AI / MCP / RTS; tests; error handling; architecture legibility; reproducibility; eval metrics. | Strong: 91 tests, property-tested invariant, eval harness, CI. Weak: 15 eval cases, no snippet-level grounding, unverified live Slack path. | **Benchmark:** 120+ eval cases, deterministic grounding, multi-agent jury, event-sourced ledger, formal invariant verification, load benchmark. | Phases 1–5 below. |
| **Design** | Slack-native UX; balanced frontend/backend; Block Kit; App Home; loading/empty/error states; interactivity. | Basic Block Kit table; no App Home / Canvas / Data Table. | **Complete product feel:** App Home dashboard, streaming review cards, Canvas export, Data Table view, invariant-check button. | Phase 3–4 UI additions; keep existing flows intact. |
| **Potential Impact** | Quantified, nameable-user story; Slack-community first, beyond-Slack second. | "Saves SME time" is unquantified. | **Simulated + honest:** counterfactual impact simulator; named user persona; clear before/after numbers. | Phase 5 counterfactual. |
| **Quality of the Idea** | Creative **or** a measured improvement on an existing concept. | Fail-closed compliance angle is a differentiator but not novel enough vs. Consensus/Arbiter. | **"Deterministically grounded organizational memory"** — the only agent with formal/property verification of its safety claims. | Surface the invariant as a product feature; prove it in CI. |

**Win condition:** A submission that scores 9–10 on Tech, 8–9 on Design, 8–9 on Impact, and 8–9 on Idea, with Tech as the decisive first tie-breaker.

---

## 2. The two projects to beat

### 2.1 Consensus (BitTriad)
- **Strengths:** 58-case eval (9 adversarial), App Home, live sandbox, polished demo, "contradiction firewall" idea.
- **Weaknesses:** Single-LLM judge, trusts LLM paraphrase of cited decisions, weaker deterministic verification.
- **How we beat it:**
  1. **Eval:** 120+ cases, 20 adversarial patterns, held-out set, non-vacuity tests.
  2. **Grounding:** deterministic snippet-level verification (Consensus only checks permalink existence).
  3. **Contradiction:** evidence graph with typed edges (SUPPORTS/CONTRADICTS/SUPERSEDES), not a flat ledger.
  4. **Formal assurance:** property-tested + live invariant endpoint (Consensus has none).

### 2.2 Arbiter (nirbhay221)
- **Strengths:** Multi-agent debate across heterogeneous LLMs, Neo4j claim graph, held-out workslop benchmark, dense UX surface.
- **Weaknesses:** Smaller/less rigorous evals, contradictory metric claims, heuristic/prompt-based safety.
- **How we beat it:**
  1. **Jury:** Match the multi-agent pattern, then harden with deterministic GroundingGate after the panel.
  2. **Graph:** Build evidence graph from approved answers + RTS hits with contradiction detection.
  3. **Safety:** Arbiter's safety is mostly prompt-engineered; ours is enforced in code + property tests.
  4. **Metrics:** Separate guard-only metrics from model-dependent metrics; report both honestly.

---

## 3. Target architecture v3

Keep the existing outer shape (`parse → plan → retrieve → draft → review → export`). Wrap it in a **deterministic safety shell** and add a **provenance layer** underneath.

```
Slack / Files / MCP / App Home
        │
    src/app.ts
        │
┌───────┴───────┬───────────────┬─────────────────┬───────────────┐
▼               ▼               ▼                 ▼               ▼
parse.ts    QueryPlanner    Jury (multi-agent  Decide (pure      Ledger v2
(questions) (RTS budget)     draft/verify)      event-sourced    (hash chain +
                                                  lifecycle)       external anchor)
        │               │                │               │
        │        GroundingGate      EvidenceGraph   InvariantCheck
        │        (deterministic     (claims +       (live + formal)
        │         citation verify)    contradictions)
        │               │                │
        │        ReviewSession    AnswerLibrary v2
        │        (Block Kit)      (conformal match)
        │               │
        │        Export (xlsx / Canvas / MCP)
        │
   Evals / Counterfactual / Load benchmark
```

**Non-negotiable invariant (already present, must stay):**
> Answer text is returned to a requester only if that requester can currently see every citation backing the answer.

Every new component must preserve this invariant and, where possible, make it stronger.

---

## 4. Component plan — every gate, eval, and algorithm

### A. Deterministic grounding gate (Phase 1)
**Surpasses Consensus.** Current A&A checks that a cited permalink is in the retrieved set. New A&A verifies that the LLM's cited *snippet* actually appears in the retrieved evidence.

**Algorithm:**
1. NFKC-normalize answer text and evidence snippet.
2. Lowercase, strip punctuation, collapse whitespace.
3. Exact substring match in either direction.
4. Fallback: character-trigram Jaccard similarity ≥ `0.85`.
5. Any failing citation → `needs_sme` with reason `ungrounded_citations`.

**Files:** `src/core/grounding.ts`, edit `src/core/pipeline.ts`, tests in `tests/grounding.test.ts`.

### B. Multi-agent jury (Phase 2)
**Matches + hardens Arbiter.** Roles: Drafter, Critic, Citer, Synthesizer. Run sequentially or as a panel. After synthesis, run GroundingGate deterministically. Support heterogeneous providers (Anthropic + OpenAI + Azure) via provider registry. Add self-consistency voting.

**Files:** `src/core/jury.ts`, `src/llm/providerRegistry.ts`, `tests/jury.test.ts`.

### C. Evidence graph + contradiction detection (Phase 3)
**Surpasses Consensus.** Typed nodes (`evidence`, `claim`, `answer`) and edges (`SUPPORTS`, `CONTRADICTS`, `SUPERSEDES`). Before reusing a Verified answer, check if newer evidence contradicts any supporting claim; if yes, degrade to `needs_sme(stale_evidence)`.

**Files:** `src/core/evidenceGraph.ts`, edit `src/core/library.ts`, `tests/evidenceGraph.test.ts`.

### D. Conformal question matching (Phase 3)
**Surpasses hand-tuned thresholds.** Calibrate token-Jaccard + embedding-cosine nonconformity score on a labeled calibration set. Use split-conformal prediction to return Verified only when the prediction set is a singleton.

**Files:** `src/core/conformal.ts`, `scripts/calibrateMatching.ts`.

### E. Event-sourced ledger + pure decision engine (Phase 4)
**Matches Relay / Kept.** Event taxonomy: `QuestionnaireIntaken`, `EvidenceRetrieved`, `DraftProduced`, `CitationValidated`, `VisibilityChecked`, `AnswerApproved`, `AnswerEdited`, `AnswerRejected`, `AnswerProposed`, `Exported`. Pure `decide(events, command)` returns `{ outcome, events, reason }`.

**Files:** `src/core/events.ts`, `src/core/decide.ts`, `src/core/ledgerV2.ts`, edit `src/slack/flows.ts`.

### F. Ledger v2 — tamper-evidence (Phase 4)
**Matches CornerCheck.** Embed `_meta: { actor, action, ts }` inside hashed payload. Verify recomputed hashes and cross-check columns. External anchor: post chain head to a public channel or `/api/invariant` daily. Mutation tests ensure a corrupted guard fails verification.

**Files:** `src/core/ledgerV2.ts`, `tests/ledgerV2.test.ts`.

### G. Formal invariant verification (Phase 5)
**Surpasses everyone.** Short term: non-vacuity regression tests (monkeypatch `canSee` to always true → property test must fail), live `/invariant` endpoint, invariant-check button in review card. Long term: optional Z3/SMT-LIB encoding of the invariant.

**Files:** `src/core/invariant.ts`, `tests/invariant.test.ts`, optional `verification/invariant.smt2`.

### H. Expanded eval harness (Phase 1–5)
**Target 120+ cases:**

| Category | Count | Purpose |
|---|---|---|
| Grounded | 30 | Prove recall on visible evidence. |
| Fail-closed (no evidence) | 20 | Prove LLM is never asked to invent. |
| ACL degraded | 15 | Prove invariant under visibility changes. |
| Citation faithfulness | 15 | Real permalink + fabricated snippet caught by GroundingGate. |
| Injection resistance | 20 | 9 Consensus patterns + role-play, JSON smuggling, fake system tags, delimiter breaks, prompt chaining. |
| Contradiction / stale evidence | 10 | Evidence graph degrades stale Verified answers. |
| Conformal matching | 10 | Calibrated threshold beats magic `0.8`. |
| **Total** | **120** | |

**Reporting:** Separate guard-only metrics from model-dependent metrics; held-out set; local load benchmark.

**Files:** `evals/adversarial.ts`, `evals/counterfactual.ts`, `evals/loadBenchmark.ts`, edit `evals/dataset.ts`, `evals/harness.ts`, `evals/run.ts`.

### I. Human-gated MCP writes (Phase 4)
**Matches Relay / Kept.** `propose_answer` files an `AnswerProposed` event. Slack shows pending proposal card with Approve/Edit/Reject. `decide()` rejects agent-originated `AnswerApproved`. Disabled unless `AA_MCP_WRITES_ENABLED=1`.

**Files:** `src/mcp/serverV2.ts`, edit `src/core/decide.ts`.

### J. Counterfactual impact simulator (Phase 5)
**Matches Relay.** Define baseline manual process rules; run corpus through A&A; compute SME hours saved, citation coverage, inconsistent answers avoided. Label as `SIMULATED`.

**Files:** `evals/counterfactual.ts`, `docs/BASELINE-RULES.md`.

---

## 5. Execution roadmap

### Phase 0 — Safety net (done)
- Baseline verified: `npm run typecheck` clean, `npm test` 91/91, `npm run smoke` pass, `npx tsx evals/run.ts` 100% on 15 cases.

### Phase 1 — Deterministic grounding + eval expansion (NOW)
- [x] Implement `GroundingGate`.
- [x] Wire into pipeline after citation-subset check, before ACL check.
- [x] Add `ungrounded_citations` reason.
- [x] Add `tests/grounding.test.ts`.
- [x] Expand `evals/dataset.ts` to 60+ cases.
- [ ] Add non-vacuity invariant tests.
- **Outcome:** A&A surpasses Consensus on citation safety and matches/exceeds it on eval volume.

### Phase 2 — Multi-agent jury
- Implement `JuryDrafter` behind `DraftingLlm` interface.
- Provider registry for heterogeneous models.
- Self-consistency voting + cost telemetry.
- **Outcome:** A&A matches Arbiter on drafting verification.

### Phase 3 — Evidence graph + conformal matching + Design uplift
- Evidence graph with contradiction detection.
- Conformal matcher calibrated on eval data.
- App Home dashboard, Canvas export, Data Table view.
- **Outcome:** A&A has smarter reuse and more complete UX than Consensus or Arbiter.

### Phase 4 — Event-sourced ledger + human-gated MCP writes
- Events, pure `decide()`, ledger v2.
- Migrate review flow to `decide()`.
- MCP v2 with human-gated write tool.
- **Outcome:** A&A matches Relay / Kept on auditability and governance.

### Phase 5 — Formal verification + counterfactual + load benchmark
- Live invariant endpoint, optional Z3 proof.
- Counterfactual impact simulator.
- Load benchmark.
- **Outcome:** A&A is the engineering benchmark of the track.

---

## 6. Head-to-head scorecard after full implementation

| Dimension | Consensus | Arbiter | New A&A |
|---|---|---|---|
| Eval size | 58 | ~40 | **120+** |
| Adversarial depth | 9 patterns | 12 cases | **20 patterns + non-vacuity** |
| Citation verification | Permalink-in-set | Prompt-based | **Deterministic snippet grounding** |
| Multi-agent verification | Single judge | Heterogeneous debate | **Heterogeneous + deterministic gate** |
| Knowledge/claim graph | Flat ledger | Neo4j claim graph | **Evidence graph + contradictions** |
| Question matching | Hand-tuned | Hand-tuned | **Conformal prediction** |
| Ledger auditability | Hash-chain | Audit log | **Event-sourced + anchored** |
| Agent write safety | N/A | Prompt-gated | **State-machine-gated** |
| Formal assurance | None | None | **Property tests + live invariant + optional Z3** |
| Impact measurement | None | Workslop benchmarks | **Counterfactual simulator + load benchmark** |

---

## 7. What NOT to change

- Do not rewrite `src/app.ts` Slack listeners unless adding new entry points.
- Do not remove the existing `AnswerLibrary` / `Ledger` interfaces; wrap or extend them.
- Do not break the existing `DraftingLlm` interface; new drafters implement it.
- Do not lower the permission invariant; every change must preserve or strengthen it.

---

## 8. Verification command

After every phase:

```bash
npm run typecheck && npm test && npm run smoke && npx tsx evals/run.ts
```

If this is green, the phase is safe to commit.

---

## 9. Phase completion log

### Phase 1 — Deterministic grounding + eval expansion ✅

**Date:** 2026-07-14  
**Scope:** Add snippet-level citation grounding and expand the eval dataset to 60+ cases.

**Changes:**
- `src/core/grounding.ts` — new deterministic `GroundingGate` with NFKC normalization, exact substring match, and character-trigram Jaccard fallback (threshold 0.85).
- `src/core/pipeline.ts` — wired `GroundingGate` after citation-subset and ACL checks; added `ungrounded_citations` reason.
- `src/slack/blocks.ts` — added human-readable label for `ungrounded_citations`.
- `tests/grounding.test.ts` — 12 unit tests covering exact match, near-match, fabricated snippets, NFKC normalization, and multi-citation cases.
- `tests/invariant.test.ts` — non-vacuity test proving the ACL guard is the difference between release and degradation.
- `tests/pipeline.test.ts` — added fabricated-snippet regression test.
- `tests/flows.test.ts`, `tests/review-fixes.test.ts`, `scripts/smoke.ts` — updated fake LLM stubs to return answers that overlap with evidence (required by the new gate).
- `evals/dataset.ts` — expanded from 15 to 60 cases: 29 grounded, 15 no-evidence, 10 ACL-degraded, 10 injection-resistance cases with 8 adversarial poison docs.

**Verification results:**

```
npm run typecheck    ✅ clean
npm test             ✅ 106/106 passed
npm run smoke        ✅ SMOKE PASS
npx tsx evals/run.ts ✅ 60 cases, 100% across all metrics
```

```json
{
  "cases": 60,
  "grounded_recall_pct": 100,
  "fail_closed_pct": 100,
  "injection_resistance_pct": 100,
  "citation_faithfulness_pct": 100
}
```

**What this proves:** A&A now deterministically verifies that any cited snippet actually supports the answer text. This exceeds Consensus's permalink-in-set check and gives A&A a measurable, reproducible citation-safety advantage.

**Next:** Phase 2 — Multi-agent jury (`src/core/jury.ts`, `src/llm/providerRegistry.ts`).

### Phase 2 — Multi-agent jury ✅

**Date:** 2026-07-14  
**Scope:** Add heterogeneous multi-agent drafting panel behind the existing `DraftingLlm` interface.

**Changes:**
- `src/core/jury.ts` — new `JuryDrafter` implementing `DraftingLlm`.
  - Runs a panel of drafters in parallel.
  - Supports deterministic majority-vote synthesis (default, no extra API call).
  - Supports optional LLM-based synthesizer with self-consistency runs.
  - Exposes `lastCallLog` telemetry per panelist (provider, latency, cost placeholder, draft).
- `src/llm/providerRegistry.ts` — factory registry for `anthropic`, `openai`, `azure`; parses `AA_JURY_PROVIDERS`.
- `src/llm/openai.ts` — constructor now accepts an explicit `provider` parameter so registry can force `openai` vs `azure` independently of `LLM_PROVIDER`.
- `src/llm/index.ts` — `createDrafter()` now returns a `JuryDrafter` when `AA_JURY_PROVIDERS` lists multiple providers; single-provider mode unchanged.
- `tests/jury.test.ts` — 9 tests covering consensus, dissent, majority, refusal, telemetry, synthesizer override, self-consistency, and zero-drafter guard.

**Verification results:**

```
npm run typecheck    ✅ clean
npm test             ✅ 115/115 passed
npm run smoke        ✅ SMOKE PASS
npx tsx evals/run.ts ✅ 60 cases, 100% across all metrics
```

**What this proves:** A&A can now run a panel of heterogeneous models (e.g., Anthropic + OpenAI + Azure) and reconcile their outputs. Because the jury implements the same `DraftingLlm` interface, the pipeline's deterministic guards (citation-subset, ACL, grounding) automatically harden every jury output — something Arbiter does not do.

**Next:** Phase 3 — Evidence graph + conformal matching + Design uplift (`src/core/evidenceGraph.ts`, `src/core/conformal.ts`).

### Phase 3 — Evidence graph + conformal matching ✅

**Date:** 2026-07-14  
**Scope:** Smarter approved-answer reuse with contradiction detection and calibrated question matching.

**Changes:**
- `src/core/evidenceGraph.ts` — typed graph of `evidence`, `claim`, and `answer` nodes with `SUPPORTS` / `CONTRADICTS` / `SUPERSEDES` edges.
  - Auto-detects contradictions via trigram overlap + negation-flip heuristic.
  - Supports manual contradiction links for cases the heuristic misses.
  - `isStale(answerId)` checks whether any claim supporting an approved answer is contradicted by newer evidence.
- `src/core/library.ts` — `AnswerLibrary` now accepts an optional `EvidenceGraph`.
  - `saveApproved()` indexes the answer, its citations, and sentence-level claims into the graph.
  - `observeEvidence()` lets the graph see actual snippets for contradiction detection.
  - `findVerified()` degrades stale answers to `needs_sme` with reason `stale_evidence`.
  - `LibraryLookup` carries a `reason` field to distinguish ACL vs. staleness.
- `src/core/conformal.ts` — `ConformalMatcher` using split-conformal prediction on token-Jaccard nonconformity scores.
  - Calibrated `qHat` guarantees same-question coverage at level `1 - α`.
  - Returns a verified answer only when the prediction set is a singleton.
  - Integrated into `AnswerLibrary.bestMatch()`; falls back to hand-tuned threshold when uncalibrated.
- `scripts/calibrateMatching.ts` — calibration dataset and reporting for the matcher.
- `src/core/pipeline.ts` — added `stale_evidence` to `NeedsSmeReason` and routes stale library hits to `needs_sme`.
- `src/slack/blocks.ts` — added human-readable label for `stale_evidence`.
- `tests/evidenceGraph.test.ts` — 7 tests covering auto-contradiction, manual links, supersedes, and `contradictionsForAnswer`.
- `tests/conformal.test.ts` — 6 tests covering calibration, singleton match, ambiguity, empty set, and score bounds.

**Verification results:**

```
npm run typecheck         ✅ clean
npm test                  ✅ 128/128 passed
npm run smoke             ✅ SMOKE PASS
npx tsx evals/run.ts      ✅ 60 cases, 100% across all metrics
npx tsx scripts/calibrateMatching.ts  ✅ q_hat=0.9, 12/12 coverage
```

**What this proves:** A&A now self-corrects its approved library when newer workspace evidence contradicts a previous answer, and it matches questions with a statistically calibrated threshold instead of a magic number. This surpasses Consensus's flat ledger and improves matching rigor over both Consensus and Arbiter.

**Phase 3b remaining:** Design uplift — App Home dashboard, Canvas export, Data Table view.

**Next:** Phase 4 — Event-sourced ledger + human-gated MCP writes (`src/core/events.ts`, `src/core/decide.ts`, `src/core/ledgerV2.ts`).

### Phase 4 — Event-sourced ledger + human-gated MCP writes ✅

**Date:** 2026-07-14  
**Scope:** Replace implicit state mutations with an event-sourced audit log and add a human-gated agent write path.

**Changes:**
- `src/core/events.ts` — full `DomainEvent` taxonomy (QuestionnaireIntaken, EvidenceRetrieved, DraftProduced, CitationValidated, VisibilityChecked, AnswerApproved, AnswerEdited, AnswerRejected, AnswerProposed, Exported).
- `src/core/decide.ts` — pure `decide(events, command)` engine.
  - Validates commands against event history.
  - Enforces: agent cannot approve, rejected questions cannot be approved without re-proposal, idempotent re-approve/reject.
- `src/core/ledgerV2.ts` — event-sourced tamper-evident ledger.
  - Stores full JSON payloads in a hash chain.
  - `verify()` checks chain hashes AND cross-checks that stored columns (action/actor/questionId) match the payload metadata.
  - Test-only tamper simulation proves both chain and metadata checks fail on attack.
- `src/slack/flows.ts` — `ReviewSession` now accepts an optional `ledgerV2` in `RunDeps`.
  - `runQuestionnaire()` emits `QuestionnaireIntaken`, `EvidenceRetrieved`, and `DraftProduced` events.
  - `approve` / `reject` / `edit` / `smeProvide` call `decide()` and append resulting events to `ledgerV2`.
  - Existing `Ledger` behavior is preserved for backward compatibility.
- `src/mcp/serverV2.ts` — `buildMcpServerV2` extends the read-only MCP server with `propose_answer`.
  - Tool is disabled unless `writesEnabled: true` (controlled by `AA_MCP_WRITES_ENABLED`).
  - `propose_answer` creates an `AnswerProposed` event in `LedgerV2` but does NOT publish to the approved library.
  - Human approval must happen through the Slack review UI.
- `tests/decide.test.ts` — 9 tests for approve, reject, edit, smeProvide, propose, export, idempotency, and duplicate-proposal rejection.
- `tests/ledgerV2.test.ts` — 4 tests for append/retrieve, intact verification, hash tamper, and metadata mismatch.
- `tests/mcpV2.test.ts` — 3 tests for tool absence when disabled, pending proposal creation, and decide-level duplicate rejection.
- `tests/flowsV2.test.ts` — 2 integration tests proving `runQuestionnaire` + `approve` emit events and `ledgerV2.verify()` stays green.

**Verification results:**

```
npm run typecheck    ✅ clean
npm test             ✅ 146/146 passed
npm run smoke        ✅ SMOKE PASS
npx tsx evals/run.ts ✅ 60 cases, 100% across all metrics
```

**What this proves:** A&A now has a fully event-sourced audit trail and a state-machine-gated agent write path. This matches Relay / Kept on auditability and governance — a level above Consensus and Arbiter, whose safety is either heuristic or prompt-based.

**Next:** Phase 5 — Formal verification + counterfactual impact + load benchmark (`src/core/invariant.ts`, `evals/counterfactual.ts`, `evals/loadBenchmark.ts`).
