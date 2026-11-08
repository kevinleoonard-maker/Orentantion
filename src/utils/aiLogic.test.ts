import test from 'node:test';
import assert from 'node:assert/strict';
import { sigmoid, trainLinearClassifier, predictKNN, DataPoint } from './aiLogic';

test('sigmoid calculates standard activation bounds', () => {
  assert.equal(sigmoid(0), 0.5);
  assert.ok(sigmoid(10) > 0.99);
  assert.ok(sigmoid(-10) < 0.01);
});

test('trainLinearClassifier learns linearly separable sets', () => {
  // Class 0 at top-left, Class 1 at bottom-right
  const points: DataPoint[] = [
    { id: '1', x: 0.1, y: 0.1, category: 0 },
    { id: '2', x: 0.2, y: 0.2, category: 0 },
    { id: '3', x: 0.8, y: 0.8, category: 1 },
    { id: '4', x: 0.9, y: 0.9, category: 1 },
  ];

  const model = trainLinearClassifier(points, 200, 0.3);
  assert.ok(model.accuracy >= 75);
});

test('predictKNN classifies by nearest neighbors', () => {
  const points: DataPoint[] = [
    { id: '1', x: 0.1, y: 0.1, category: 0 },
    { id: '2', x: 0.12, y: 0.11, category: 0 },
    { id: '3', x: 0.85, y: 0.88, category: 1 },
    { id: '4', x: 0.9, y: 0.9, category: 1 },
  ];

  const resultNearZero = predictKNN(0.11, 0.1, points, 1);
  assert.equal(resultNearZero.category, 0);

  const resultNearOne = predictKNN(0.88, 0.91, points, 1);
  assert.equal(resultNearOne.category, 1);
});
