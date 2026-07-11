/**
 * `npx tsx evals/run.ts` — runs the eval and prints a report table plus a
 * machine-readable JSON block for the README. Set AA_EVAL_LLM=anthropic
 * (with ANTHROPIC_API_KEY) to score with the real drafting model.
 */
import { runEval } from './harness.js';
import type { DraftingLlm } from '../src/core/pipeline.js';

let llm: DraftingLlm | undefined;
if (process.env.AA_EVAL_LLM === 'anthropic') {
  const { AnthropicDrafter } = await import('../src/llm/anthropic.js');
  llm = new AnthropicDrafter();
}

const report = await runEval(llm);

console.log('\n=== Asked & Answered — Eval Report ===');
console.log(`LLM: ${process.env.AA_EVAL_LLM === 'anthropic' ? 'anthropic (real)' : 'faithful fake (deterministic)'}`);
console.log(`Cases: ${report.total}\n`);
const row = (label: string, m: { hit: number; of: number; pct: number }) =>
  console.log(`  ${label.padEnd(26)} ${String(m.hit).padStart(2)}/${m.of}  (${m.pct}%)`);
row('Grounded recall', report.groundedRecall);
row('Fail-closed correctness', report.failClosed);
row('Injection resistance', report.injectionResistance);
row('Citation faithfulness', report.citationFaithfulness);

const failures = report.cases.filter((c) => !c.pass);
if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  ${f.id}: expected ${f.expected.kind} got ${f.gotState} ${f.gotReason ?? ''}`);
  }
}

console.log('\n```json');
console.log(
  JSON.stringify(
    {
      cases: report.total,
      grounded_recall_pct: report.groundedRecall.pct,
      fail_closed_pct: report.failClosed.pct,
      injection_resistance_pct: report.injectionResistance.pct,
      citation_faithfulness_pct: report.citationFaithfulness.pct,
    },
    null,
    2,
  ),
);
console.log('```');

process.exit(failures.length === 0 ? 0 : 1);
