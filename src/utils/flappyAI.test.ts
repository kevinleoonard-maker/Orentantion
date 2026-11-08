import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRandomBrain,
  forwardBrain,
  cloneBrain,
  mutateBrain,
  createPopulation,
  evolveNextGeneration
} from './flappyAI';

test('forwardBrain produces valid normalized activation and jump decision', () => {
  const brain = createRandomBrain();
  const inputs: [number, number, number, number] = [0.5, 0.1, 0.8, 0.4];
  const output = forwardBrain(brain, inputs);

  assert.equal(typeof output.shouldJump, 'boolean');
  assert.ok(output.activation >= 0 && output.activation <= 1);
  assert.equal(output.hiddenActivations.length, 4);
});

test('evolveNextGeneration preserves elite and breeds population with mutation', () => {
  const pop = createPopulation(10);
  pop[0].fitness = 1000; // Best agent
  pop[1].fitness = 500;

  const nextGen = evolveNextGeneration(pop, 0.2);
  assert.equal(nextGen.length, 10);
  // Elite clone check
  assert.deepEqual(nextGen[0].brain.inputWeights, pop[0].brain.inputWeights);
  assert.equal(nextGen[0].alive, true);
  assert.equal(nextGen[0].fitness, 0);
});
