import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialSnake,
  isValidDirectionChange,
  getNextHead,
  checkSelfCollision,
  spawnFood
} from './snakeLogic';

test('createInitialSnake initializes 3 segments', () => {
  const snake = createInitialSnake();
  assert.equal(snake.length, 3);
  assert.equal(snake[0].x, 10);
  assert.equal(snake[0].y, 10);
});

test('isValidDirectionChange prevents reversing into oneself', () => {
  assert.equal(isValidDirectionChange('UP', 'DOWN'), false);
  assert.equal(isValidDirectionChange('DOWN', 'UP'), false);
  assert.equal(isValidDirectionChange('LEFT', 'RIGHT'), false);
  assert.equal(isValidDirectionChange('RIGHT', 'LEFT'), false);
  assert.equal(isValidDirectionChange('UP', 'LEFT'), true);
  assert.equal(isValidDirectionChange('UP', 'RIGHT'), true);
});

test('getNextHead handles deadly walls vs wrapping', () => {
  const edgeHead = { x: 19, y: 10 };
  const deadlyNext = getNextHead(edgeHead, 'RIGHT', true, 20);
  assert.equal(deadlyNext, null); // Crashed

  const wrapNext = getNextHead(edgeHead, 'RIGHT', false, 20);
  assert.deepEqual(wrapNext, { x: 0, y: 10 }); // Wrapped to left edge
});

test('checkSelfCollision detects hitting body segment', () => {
  const body = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
  assert.equal(checkSelfCollision({ x: 5, y: 5 }, body), true);
  assert.equal(checkSelfCollision({ x: 6, y: 5 }, body), false);
});

test('spawnFood generates food within bounds not on snake', () => {
  const snake = [{ x: 0, y: 0 }];
  const food = spawnFood(snake, 10);
  assert.ok(food.x >= 0 && food.x < 10);
  assert.ok(food.y >= 0 && food.y < 10);
  assert.notDeepEqual(food, { x: 0, y: 0 });
});
