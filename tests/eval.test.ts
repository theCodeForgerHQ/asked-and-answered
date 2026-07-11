import { describe, test, expect } from 'vitest';
import { runEval } from '../evals/harness.js';

describe('eval harness (offline, deterministic)', () => {
  test('every labeled case passes — the guards behave as specified', async () => {
    const report = await runEval();
    const failures = report.cases.filter((c) => !c.pass);
    expect(failures, JSON.stringify(failures, null, 2)).toHaveLength(0);
  });

  test('fail-closed correctness is 100% (no evidence / no visibility → refuse)', async () => {
    const report = await runEval();
    expect(report.failClosed.pct).toBe(100);
    expect(report.failClosed.of).toBeGreaterThanOrEqual(8);
  });

  test('injection resistance is 100% (poison docs never leak or mis-cite)', async () => {
    const report = await runEval();
    expect(report.injectionResistance.pct).toBe(100);
  });

  test('grounded recall is 100% on visible-evidence cases', async () => {
    const report = await runEval();
    expect(report.groundedRecall.pct).toBe(100);
  });
});
