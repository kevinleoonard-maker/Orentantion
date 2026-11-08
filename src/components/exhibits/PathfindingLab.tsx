import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GridCoord, runAStar } from '../../utils/pathfinding';
import { sound } from '../../utils/sound';
import { Navigation, Play, RotateCcw, Compass, MapPin, Sparkles } from 'lucide-react';

export const PathfindingLab: React.FC<{ onActivity: () => void }> = ({ onActivity }) => {
  const ROWS = 14;
  const COLS = 24;

  const [start, setStart] = useState<GridCoord>({ r: 2, c: 2 });
  const [end, setEnd] = useState<GridCoord>({ r: 11, c: 21 });
  const [walls, setWalls] = useState<Set<string>>(() => {
    const initialWalls = new Set<string>();
    // Default labyrinth walls
    for (let r = 2; r < 12; r++) initialWalls.add(`${r},10`);
    for (let r = 0; r < 10; r++) initialWalls.add(`${r},16`);
    initialWalls.delete(`6,10`); // gap in wall 1
    initialWalls.delete(`4,16`); // gap in wall 2
    return initialWalls;
  });

  const [algorithm, setAlgorithm] = useState<'astar' | 'dijkstra'>('astar');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [visitedNodes, setVisitedNodes] = useState<GridCoord[]>([]);
  const [pathNodes, setPathNodes] = useState<GridCoord[]>([]);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<{ visitedCount: number; pathLength: number } | null>(null);

  const executePathfinding = useCallback(() => {
    setIsComputing(true);
    const result = runAStar(ROWS, COLS, start, end, walls);

    // Animate visited nodes
    setVisitedNodes([]);
    setPathNodes([]);

    let idx = 0;
    const interval = setInterval(() => {
      idx += 3;
      if (idx >= result.visitedOrder.length) {
        clearInterval(interval);
        setVisitedNodes(result.visitedOrder);
        setPathNodes(result.path);
        setIsComputing(false);
        setMetrics({
          visitedCount: result.visitedOrder.length,
          pathLength: result.path.length,
        });
        sound.playSuccess();
      } else {
        setVisitedNodes(result.visitedOrder.slice(0, idx));
        sound.playBlip(300 + idx * 4, 'sine', 0.02);
      }
    }, 25);

    onActivity();
  }, [start, end, walls, onActivity]);

  const handleCellClick = (r: number, c: number) => {
    if (r === start.r && c === start.c) return;
    if (r === end.r && c === end.c) return;

    const key = `${r},${c}`;
    setWalls((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    sound.playBlip(500, 'sine', 0.03);
    onActivity();
  };

  const generateRandomMaze = () => {
    const nextWalls = new Set<string>();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if ((r === start.r && c === start.c) || (r === end.r && c === end.c)) continue;
        if (Math.random() < 0.28) {
          nextWalls.add(`${r},${c}`);
        }
      }
    }
    setWalls(nextWalls);
    setVisitedNodes([]);
    setPathNodes([]);
    setMetrics(null);
    sound.playBlip(600, 'sine', 0.08);
    onActivity();
  };

  const clearWalls = () => {
    setWalls(new Set());
    setVisitedNodes([]);
    setPathNodes([]);
    setMetrics(null);
    sound.playBlip(350, 'sine', 0.05);
    onActivity();
  };

  const visitedSet = new Set(visitedNodes.map(p => `${p.r},${p.c}`));
  const pathSet = new Set(pathNodes.map(p => `${p.r},${p.c}`));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      {/* Exhibit Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Esperimento 3 · Algoritmi di Navigazione &amp; Teoria dei Grafi</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Come Pensa Google Maps: Algoritmo A* (A-Star)
          </h3>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
            Disegna muri e ostacoli sulla mappa cliccando sulle caselle. Poi avvia l'algoritmo per osservare il fronte d'onda di scansione euristica calcolare istantaneamente la rotta minima garantita.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={executePathfinding}
            disabled={isComputing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Calcola Rotta A*</span>
          </button>

          <button
            onClick={generateRandomMaze}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300"
          >
            Labirinto Casuale
          </button>

          <button
            onClick={clearWalls}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Pulisci ostacoli"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Grid Map */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Map Status Bar */}
          <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-t-xl text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded bg-emerald-500 flex items-center justify-center text-[8px] text-black font-bold">S</span>
                <span>Partenza (Rover)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold">G</span>
                <span>Destinazione</span>
              </span>
            </div>

            {metrics && (
              <div className="flex items-center gap-4 text-slate-300">
                <span>Nodi esplorati: <b className="text-amber-400 tabular-nums">{metrics.visitedCount}</b></span>
                <span>Passi rotta: <b className="text-emerald-400 tabular-nums">{metrics.pathLength}</b></span>
              </div>
            )}
          </div>

          {/* Grid Canvas / Divs */}
          <div className="w-full p-2 rounded-b-xl border border-slate-800 bg-[#0a0f1d] overflow-x-auto shadow-2xl">
            <div className="grid grid-cols-24 gap-[2px] min-w-[550px] select-none">
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: COLS }).map((_, c) => {
                  const key = `${r},${c}`;
                  const isStart = r === start.r && c === start.c;
                  const isEnd = r === end.r && c === end.c;
                  const isWall = walls.has(key);
                  const isPath = pathSet.has(key);
                  const isVisited = visitedSet.has(key);

                  let cellClass = 'bg-slate-900/60 hover:bg-slate-800';
                  if (isWall) cellClass = 'bg-slate-700 shadow-inner';
                  else if (isStart) cellClass = 'bg-emerald-500 text-slate-950 font-black';
                  else if (isEnd) cellClass = 'bg-rose-500 text-white font-black animate-pulse';
                  else if (isPath) cellClass = 'bg-amber-400 shadow-md shadow-amber-400/30 scale-[1.03]';
                  else if (isVisited) cellClass = 'bg-sky-950/70 border border-sky-800/40 text-sky-400';

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      className={`aspect-square rounded-[3px] transition-all duration-75 flex items-center justify-center text-[10px] ${cellClass}`}
                      aria-label={`Cella ${r},${c}`}
                    >
                      {isStart ? 'S' : isEnd ? 'G' : ''}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block text-center">
            Clicca sulle celle per aggiungere o rimuovere ostacoli in tempo reale.
          </span>
        </div>

        {/* Algorithm Insight Card */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-emerald-400 font-bold block mb-1">
              TEORIA DEGLI ALGORITMI
            </span>
            <h4 className="text-sm font-bold text-white">Funzione di Costo Euristico: f(n) = g(n) + h(n)</h4>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-amber-400 block font-bold">g(n): Costo Effettivo</span>
              <span className="text-slate-400 text-[11px]">Numero di passi percorsi dalla partenza.</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-sky-400 block font-bold">h(n): Euristica di Manhattan</span>
              <span className="text-slate-400 text-[11px]">Distanza stimata in linea d'aria dalla meta: |Δr| + |Δc|.</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Senza euristica, un computer esplorerebbe in cerchio alla cieca (Dijkstra puro). Con l'algoritmo A*, l'esplorazione punta con precisione laser verso il traguardo, riducendo le operazioni di calcolo del 95%.
          </p>
        </div>
      </div>
    </div>
  );
};
