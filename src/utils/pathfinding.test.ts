import test from 'node:test';
import assert from 'node:assert/strict';
import { runAStar } from './pathfinding';

test('runAStar finds direct shortest path on open grid', () => {
  const start = { r: 0, c: 0 };
  const end = { r: 2, c: 2 };
  const walls = new Set<string>();

  const result = runAStar(5, 5, start, end, walls);
  assert.equal(result.found, true);
  assert.equal(result.path.length, 5); // 0,0 -> 1,0 -> 2,0 -> 2,1 -> 2,2 (or similar 4 steps + start)
  assert.deepEqual(result.path[0], start);
  assert.deepEqual(result.path[result.path.length - 1], end);
});

test('runAStar navigates around simple obstacle wall', () => {
  const start = { r: 1, c: 0 };
  const end = { r: 1, c: 2 };
  // Wall blocks direct horizontal path at (1,1)
  const walls = new Set<string>(['1,1']);

  const result = runAStar(3, 3, start, end, walls);
  assert.equal(result.found, true);
  // Path must not contain (1,1)
  assert.ok(!result.path.some(p => p.r === 1 && p.c === 1));
});
