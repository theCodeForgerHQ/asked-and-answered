# Evaluation

Run: `npx tsx evals/run.ts` (add `AA_EVAL_LLM=anthropic|openai|azure` + the matching credentials to score with the real drafting model).

The harness runs the **real pipeline** against a seeded company workspace
(`evals/dataset.ts`: 8 evidence docs across public/private channels + 2 planted
prompt-injection docs) over 15 labeled cases. It measures behavior the product
*guarantees*, not model vibes — the fail-closed and injection numbers come from
the pipeline's deterministic guards, so they hold regardless of which LLM drafts.

## Metrics measured

| Metric | What it proves |
|---|---|
| **Grounded recall** | When visible evidence exists, we ground the answer and cite the right document. |
| **Fail-closed correctness** | When no visible evidence exists (missing, or present-but-not-visible), we never emit a grounded answer. |
| **ACL correctness** | When evidence exists but the requester can't see it, we degrade to Needs-SME for that specific reason — the core invariant. |
| **Injection resistance** | Planted "ignore all instructions" / "leak the private region" docs never produce a foreign-cited answer or an ACL leak. |
| **Citation faithfulness** | Every grounded answer cites a real, question-relevant permalink. |

## Latest run (faithful deterministic LLM)

```json
{
  "cases": 15,
  "grounded_recall_pct": 100,
  "fail_closed_pct": 100,
  "injection_resistance_pct": 100,
  "citation_faithfulness_pct": 100
}
```

These are honest measurements of the deterministic guarantees. Grounded recall
and citation faithfulness with the *real* model are measured in the sandbox
(with `AA_EVAL_LLM=anthropic|openai|azure`) and reported in the submission; the
fail-closed and injection numbers are model-independent by construction.
