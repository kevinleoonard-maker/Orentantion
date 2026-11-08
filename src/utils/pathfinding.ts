/**
 * Pathfinding algorithms: A* and Dijkstra for interactive grid exploration
 */

export interface GridCoord {
  r: number;
  c: number;
}

export interface PathResult {
  path: GridCoord[];
  visitedOrder: GridCoord[];
  found: boolean;
}

export function manhattanDistance(a: GridCoord, b: GridCoord): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

export function runAStar(
  rows: number,
  cols: number,
  start: GridCoord,
  end: GridCoord,
  walls: Set<string>
): PathResult {
  const openSet: GridCoord[] = [start];
  const cameFrom = new Map<string, GridCoord>();

  const gScore = new Map<string, number>();
  gScore.set(`${start.r},${start.c}`, 0);

  const fScore = new Map<string, number>();
  fScore.set(`${start.r},${start.c}`, manhattanDistance(start, end));

  const visitedOrder: GridCoord[] = [];
  const closedSet = new Set<string>();

  while (openSet.length > 0) {
    // Pick node in openSet with lowest fScore
    let lowestIdx = 0;
    let lowestF = Infinity;
    for (let i = 0; i < openSet.length; i++) {
      const key = `${openSet[i].r},${openSet[i].c}`;
      const f = fScore.get(key) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        lowestIdx = i;
      }
    }

    const current = openSet.splice(lowestIdx, 1)[0];
    const curKey = `${current.r},${current.c}`;

    visitedOrder.push(current);
    closedSet.add(curKey);

    if (current.r === end.r && current.c === end.c) {
      // Reconstruct path
      const path: GridCoord[] = [current];
      let curr = current;
      while (cameFrom.has(`${curr.r},${curr.c}`)) {
        curr = cameFrom.get(`${curr.r},${curr.c}`)!;
        path.unshift(curr);
      }
      return { path, visitedOrder, found: true };
    }

    // Neighbors: up, down, left, right
    const neighbors: GridCoord[] = [
      { r: current.r - 1, c: current.c },
      { r: current.r + 1, c: current.c },
      { r: current.r, c: current.c - 1 },
      { r: current.r, c: current.c + 1 },
    ];

    for (const nb of neighbors) {
      if (nb.r < 0 || nb.r >= rows || nb.c < 0 || nb.c >= cols) continue;
      const nbKey = `${nb.r},${nb.c}`;
      if (walls.has(nbKey)) continue;
      if (closedSet.has(nbKey)) continue;

      const tentativeG = (gScore.get(curKey) ?? Infinity) + 1;
      const nbG = gScore.get(nbKey) ?? Infinity;

      if (tentativeG < nbG) {
        cameFrom.set(nbKey, current);
        gScore.set(nbKey, tentativeG);
        fScore.set(nbKey, tentativeG + manhattanDistance(nb, end));

        if (!openSet.some(p => p.r === nb.r && p.c === nb.c)) {
          openSet.push(nb);
        }
      }
    }
  }

  return { path: [], visitedOrder, found: false };
}
