import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import {
  Direction,
  Point,
  SnakeConfig,
  createInitialSnake,
  isValidDirectionChange,
  getNextHead,
  checkSelfCollision,
  spawnFood
} from '../utils/snakeLogic';
import { sound } from '../utils/sound';

export interface TelemetryCounters {
  onKeyDown: number;
  step: number;
  eat: number;
  gameOver: number;
}

interface ArcadeChapterProps {
  config: SnakeConfig;
  onUpdateCounters: (counters: TelemetryCounters) => void;
  counters: TelemetryCounters;
  onFinishGame?: (score: number) => void;
}

export const ArcadeChapter: React.FC<ArcadeChapterProps> = ({
  config,
  onUpdateCounters,
  counters,
  onFinishGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'timeout'>('idle');
  const [snake, setSnake] = useState<Point[]>(createInitialSnake());
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30.0);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [eventTape, setEventTape] = useState<string[]>([]);
  const [activeKeyGroup, setActiveKeyGroup] = useState<string | null>(null);

  const snakeRef = useRef<Point[]>(snake);
  snakeRef.current = snake;
  const directionRef = useRef<Direction>(direction);
  directionRef.current = direction;
  const nextDirectionRef = useRef<Direction>(nextDirection);
  nextDirectionRef.current = nextDirection;
  const foodRef = useRef<Point>(food);
  foodRef.current = food;
  const stateRef = useRef<'idle' | 'playing' | 'gameover' | 'timeout'>(gameState);
  stateRef.current = gameState;
  const countersRef = useRef<TelemetryCounters>(counters);
  countersRef.current = counters;

  const incrementCounter = useCallback((key: keyof TelemetryCounters) => {
    const updated = { ...countersRef.current, [key]: countersRef.current[key] + 1 };
    countersRef.current = updated;
    onUpdateCounters(updated);
  }, [onUpdateCounters]);

  const startGame = useCallback(() => {
    const initial = createInitialSnake();
    const newFood = spawnFood(initial, config.gridSize);
    setSnake(initial);
    setFood(newFood);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setTimeLeft(30.0);
    setGameState('playing');
    setEventTape(['// Inizio sessione: timer avviato a 30.0s']);
    sound.playBlip(520, 'sine', 0.1);
  }, [config.gridSize]);

  // Handle key inputs
  const handleInputDirection = useCallback((newDir: Direction, keyName: string) => {
    if (stateRef.current === 'idle') {
      startGame();
    }
    if (stateRef.current === 'playing') {
      incrementCounter('onKeyDown');
      setLastKeyPressed(keyName);
      setActiveKeyGroup(keyName);
      setTimeout(() => setActiveKeyGroup(null), 150);

      setEventTape((prev) => [
        `Key: "${keyName}" -> setDirection("${newDir}")`,
        ...prev.slice(0, 4)
      ]);

      if (isValidDirectionChange(directionRef.current, newDir)) {
        setNextDirection(newDir);
        sound.playBlip(440, 'triangle', 0.04);
      }
    }
  }, [startGame, incrementCounter]);

  // Window keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      let targetDir: Direction | null = null;
      let key = e.key;

      if (['ArrowUp', 'w', 'W'].includes(key)) targetDir = 'UP';
      else if (['ArrowDown', 's', 'S'].includes(key)) targetDir = 'DOWN';
      else if (['ArrowLeft', 'a', 'A'].includes(key)) targetDir = 'LEFT';
      else if (['ArrowRight', 'd', 'D'].includes(key)) targetDir = 'RIGHT';

      if (targetDir) {
        e.preventDefault();
        handleInputDirection(targetDir, key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleInputDirection]);

  // Game loop & timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Timer countdown: 100ms interval
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
        if (next <= 0) {
          setGameState('timeout');
          incrementCounter('gameOver');
          sound.playCrash();
          if (onFinishGame) onFinishGame(score);
        }
        return next;
      });
    }, 100);

    // Step tick
    const tickInterval = setInterval(() => {
      incrementCounter('step');
      const curSnake = snakeRef.current;
      const curDir = nextDirectionRef.current;
      setDirection(curDir);

      const head = curSnake[0];
      const nextHead = getNextHead(head, curDir, config.wallsDeadly, config.gridSize);

      if (!nextHead) {
        // Crashed into wall
        setGameState('gameover');
        incrementCounter('gameOver');
        sound.playCrash();
        if (onFinishGame) onFinishGame(score);
        return;
      }

      if (checkSelfCollision(nextHead, curSnake)) {
        // Crashed into body
        setGameState('gameover');
        incrementCounter('gameOver');
        sound.playCrash();
        if (onFinishGame) onFinishGame(score);
        return;
      }

      const curFood = foodRef.current;
      const isEating = nextHead.x === curFood.x && nextHead.y === curFood.y;

      let newSnake: Point[];
      if (isEating) {
        newSnake = [nextHead, ...curSnake];
        setScore((s) => s + 10);
        incrementCounter('eat');
        sound.playEat();
        const freshFood = spawnFood(newSnake, config.gridSize);
        setFood(freshFood);
        setEventTape((prev) => [
          `eat(): Mangiato cibo a [${curFood.x},${curFood.y}]! +10 punti`,
          ...prev.slice(0, 4)
        ]);
      } else {
        newSnake = [nextHead, ...curSnake.slice(0, -1)];
      }

      setSnake(newSnake);
    }, config.speed);

    return () => {
      clearInterval(timerInterval);
      clearInterval(tickInterval);
    };
  }, [gameState, config.speed, config.wallsDeadly, config.gridSize, incrementCounter, score, onFinishGame]);

  // Draw snake canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cellSize = size / config.gridSize;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= config.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    // Draw food
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2.6,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw snake
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 10;
    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? '#ffffff' : config.color;
      const radius = idx === 0 ? 5 : 3;
      const px = seg.x * cellSize + 1.5;
      const py = seg.y * cellSize + 1.5;
      const psize = cellSize - 3;

      ctx.beginPath();
      ctx.roundRect(px, py, psize, psize, radius);
      ctx.fill();

      // Head eyes
      if (idx === 0) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(px + psize * 0.35, py + psize * 0.35, 2, 0, Math.PI * 2);
        ctx.arc(px + psize * 0.65, py + psize * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food, config]);

  return (
    <section id="gioca" className="py-20 bg-slate-950 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
            <span>Capitolo 1</span>
            <span className="text-slate-600">·</span>
            <span>Telemetria in tempo reale</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Hai 30 secondi. <span className="text-cyan-400">Gioca</span>.
          </h2>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Premi le frecce o <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-xs border border-slate-700">W</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-xs border border-slate-700 mx-1">A</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-xs border border-slate-700 mr-1">S</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-xs border border-slate-700">D</kbd>.
            Mentre giochi, guarda accanto: vedrai ogni evento scatenato e quante volte le funzioni del computer vengono eseguite!
          </p>
        </div>

        {/* Main 2-Zone Arcade Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Zone: Arcade Canvas & D-Pad */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* HUD Bar */}
            <div className="w-full max-w-[400px] flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-t-xl text-sm font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <span>TEMPO:</span>
                <span className="font-bold text-amber-400 tabular-nums">{timeLeft.toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span>PUNTI:</span>
                <span className="font-bold text-cyan-400 tabular-nums">{score}</span>
              </div>
            </div>

            {/* Timebar */}
            <div className="w-full max-w-[400px] h-1.5 bg-slate-900 border-x border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-100 ease-linear"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>

            {/* Canvas Screen with Overlay */}
            <div className="relative w-full max-w-[400px] aspect-square rounded-b-xl overflow-hidden border border-slate-800 shadow-2xl shadow-cyan-950/20">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-full block bg-slate-950"
              />

              {/* Overlays */}
              {gameState !== 'playing' && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  {gameState === 'idle' && (
                    <>
                      <h3 className="text-2xl font-bold text-white mb-2">Pronto a Giocare?</h3>
                      <p className="text-sm text-slate-300 max-w-xs mb-6">
                        Il tempo parte al primo tasto premuto. Mangia il cibo giallo e sopravvivi!
                      </p>
                      <button
                        onClick={startGame}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Inizia Partita</span>
                      </button>
                    </>
                  )}

                  {gameState === 'gameover' && (
                    <>
                      <ShieldAlert className="w-12 h-12 text-rose-500 mb-2" />
                      <h3 className="text-2xl font-bold text-white mb-1">Collisione!</h3>
                      <p className="text-sm text-slate-300 mb-4">
                        Punteggio finale: <b className="text-cyan-400">{score}</b> punti.
                      </p>
                      <button
                        onClick={startGame}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Rigioca</span>
                      </button>
                    </>
                  )}

                  {gameState === 'timeout' && (
                    <>
                      <h3 className="text-2xl font-bold text-amber-400 mb-1">Tempo Scaduto!</h3>
                      <p className="text-sm text-slate-300 mb-4">
                        Ottimo lavoro! Hai totalizzato <b className="text-cyan-400">{score}</b> punti in 30 secondi.
                      </p>
                      <button
                        onClick={startGame}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Nuova Sfida</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Touch D-Pad for Mobile */}
            <div className="mt-4 flex flex-col items-center gap-1.5 sm:hidden">
              <button
                onClick={() => handleInputDirection('UP', 'ArrowUp')}
                aria-label="Muovi in Alto"
                className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center font-bold active:bg-cyan-500 active:text-slate-950"
              >
                ↑
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleInputDirection('LEFT', 'ArrowLeft')}
                  aria-label="Muovi a Sinistra"
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center font-bold active:bg-cyan-500 active:text-slate-950"
                >
                  ←
                </button>
                <button
                  onClick={() => handleInputDirection('DOWN', 'ArrowDown')}
                  aria-label="Muovi in Basso"
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center font-bold active:bg-cyan-500 active:text-slate-950"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleInputDirection('RIGHT', 'ArrowRight')}
                  aria-label="Muovi a Destra"
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center font-bold active:bg-cyan-500 active:text-slate-950"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Right Zone: Live Key Tape & Function Counters */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Keyboard HUD */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                I tuoi tasti in diretta
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="grid grid-cols-3 gap-1 w-32">
                  <div />
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${activeKeyGroup === 'ArrowUp' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>↑</kbd>
                  <div />
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${activeKeyGroup === 'ArrowLeft' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>←</kbd>
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${activeKeyGroup === 'ArrowDown' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>↓</kbd>
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${activeKeyGroup === 'ArrowRight' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>→</kbd>
                </div>

                <div className="grid grid-cols-3 gap-1 w-32">
                  <div />
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${['w', 'W'].includes(activeKeyGroup || '') ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>W</kbd>
                  <div />
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${['a', 'A'].includes(activeKeyGroup || '') ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>A</kbd>
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${['s', 'S'].includes(activeKeyGroup || '') ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>S</kbd>
                  <kbd className={`h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs ${['d', 'D'].includes(activeKeyGroup || '') ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'text-slate-300'}`}>D</kbd>
                </div>
              </div>
            </div>

            {/* Event Tape Stream */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Flusso eventi catturati
              </h3>
              <ul className="font-mono text-xs text-slate-300 space-y-1.5 min-h-[5.5rem]">
                {eventTape.length === 0 ? (
                  <li className="text-slate-500 italic">// Premi un tasto per avviare il flusso eventi</li>
                ) : (
                  eventTape.map((ev, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-cyan-400">»</span>
                      <span className="truncate">{ev}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Function Executions Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Funzioni eseguite dalla CPU
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <code className="text-xs text-slate-300 font-mono">onKeyDown()</code>
                  <span className="text-sm font-mono font-bold text-cyan-400 tabular-nums">
                    {counters.onKeyDown}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <code className="text-xs text-slate-300 font-mono">step()</code>
                  <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                    {counters.step}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <code className="text-xs text-slate-300 font-mono">eat()</code>
                  <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                    {counters.eat}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <code className="text-xs text-slate-300 font-mono">gameOver()</code>
                  <span className="text-sm font-mono font-bold text-rose-400 tabular-nums">
                    {counters.gameOver}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
