/**
 * Pure logic for the Snake game
 */

export interface Point {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface SnakeConfig {
  speed: number;        // ms per tick (60 - 220)
  wallsDeadly: boolean; // true = crash into wall, false = wrap around
  color: string;        // Hex code
  gridSize: number;     // e.g. 20x20
}

export const DEFAULT_CONFIG: SnakeConfig = {
  speed: 120,
  wallsDeadly: true,
  color: '#06B6D4', // Modern cyan
  gridSize: 20,
};

export function createInitialSnake(): Point[] {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
}

export function isValidDirectionChange(current: Direction, next: Direction): boolean {
  if (current === 'UP' && next === 'DOWN') return false;
  if (current === 'DOWN' && next === 'UP') return false;
  if (current === 'LEFT' && next === 'RIGHT') return false;
  if (current === 'RIGHT' && next === 'LEFT') return false;
  return true;
}

export function getNextHead(head: Point, direction: Direction, wallsDeadly: boolean, gridSize: number): Point | null {
  let { x, y } = head;
  switch (direction) {
    case 'UP': y -= 1; break;
    case 'DOWN': y += 1; break;
    case 'LEFT': x -= 1; break;
    case 'RIGHT': x += 1; break;
  }

  if (wallsDeadly) {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
      return null; // Wall collision
    }
    return { x, y };
  } else {
    // Wrap around
    x = (x + gridSize) % gridSize;
    y = (y + gridSize) % gridSize;
    return { x, y };
  }
}

export function checkSelfCollision(head: Point, body: Point[]): boolean {
  return body.some(segment => segment.x === head.x && segment.y === head.y);
}

export function spawnFood(snake: Point[], gridSize: number): Point {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
  const available: Point[] = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) return { x: 0, y: 0 };
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}
