import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBubbleSortSteps } from './sortingLogic';

test('generateBubbleSortSteps sorts correctly and tracks operations', () => {
  const input = [5, 2, 8, 1];
  const steps = generateBubbleSortSteps(input);
  assert.ok(steps.length > 0);
  const finalStep = steps[steps.length - 1];
  assert.deepEqual(finalStep.array, [1, 2, 5, 8]);
  assert.ok(finalStep.comparisons > 0);
  assert.ok(finalStep.swaps > 0);
});
