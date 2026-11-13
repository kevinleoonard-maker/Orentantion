import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Agent,
  createPopulation,
  evolveNextGeneration,
  forwardBrain,
  cloneBrain
} from '../../utils/flappyAI';
import { sound } from '../../utils/sound';
import { Play, Pause, RotateCcw, FastForward, User, Bot, Zap, Brain } from 'lucide-react';

interface Pipe {
  x: number;
  gapY: number;
  gapHeight: number;
  width: number;
  passed: boolean;
}

// Passi di simulazione al secondo con velocità 1x (2x e 5x li moltiplicano). Prima era un passo per fotogramma,
// cioè 60 al secondo e anche di più su schermi veloci: troppo rapido per capire cosa fanno i droni.
// Ora 1x è lenta, 2x il doppio, 5x più di due volte e mezza: così tutta la fase di apprendimento si segue meglio.
const STEPS_PER_SECOND = 24;
// Se la pagina resta indietro (computer lento) non si recupera tutto insieme: si salta il ritardo.
const MAX_STEPS_PER_FRAME = 12;
const SPEED_LABEL = { 1: 'Lenta', 2: 'Media', 5: 'Veloce' } as const;

export const FlappyAILab: React.FC<{ onActivity: () => void }> = ({ onActivity }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [generation, setGeneration] = useState<number>(1);
  const [aliveCount, setAliveCount] = useState<number>(20);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 5>(1);
  const [mutationRate, setMutationRate] = useState<number>(0.15);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [humanMode, setHumanMode] = useState<boolean>(false);
  const [humanY, setHumanY] = useState<number>(200);
  const [humanVy, setHumanVy] = useState<number>(0);
  const [humanAlive, setHumanAlive] = useState<boolean>(true);

  // Neural network live telemetry for the best current agent
  const [brainTelemetry, setBrainTelemetry] = useState<{
    inputs: [number, number, number, number];
    hidden: number[];
    output: number;
    jumped: boolean;
  }>({
    inputs: [0.5, 0, 0.8, 0.5],
    hidden: [0, 0, 0, 0],
    output: 0,
    jumped: false,
  });

  const populationRef = useRef<Agent[]>(createPopulation(20));
  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const highScoreRef = useRef<number>(0);
  const generationRef = useRef<number>(1);
  const humanRef = useRef<{ y: number; vy: number; alive: boolean }>({ y: 200, vy: 0, alive: true });

  const resetPipes = useCallback(() => {
    pipesRef.current = [
      { x: 380, gapY: 160, gapHeight: 110, width: 44, passed: false },
      { x: 600, gapY: 190, gapHeight: 110, width: 44, passed: false },
    ];
  }, []);

  const handleNextGeneration = useCallback(() => {
    const nextGen = evolveNextGeneration(populationRef.current, mutationRate);
    populationRef.current = nextGen;
    generationRef.current += 1;
    setGeneration(generationRef.current);
    scoreRef.current = 0;
    setCurrentScore(0);
    resetPipes();
    humanRef.current = { y: 200, vy: 0, alive: true };
    setHumanAlive(true);
    sound.playSuccess();
    onActivity();
  }, [mutationRate, resetPipes, onActivity]);

  const handleHumanJump = useCallback(() => {
    if (humanRef.current.alive) {
      humanRef.current.vy = -6.5;
      sound.playBlip(550, 'triangle', 0.05);
      onActivity();
    }
  }, [onActivity]);

  // Tastiera solo mentre si pilota: altrimenti spazio e freccia devono continuare a scorrere la pagina
  useEffect(() => {
    if (!humanMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleHumanJump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleHumanJump, humanMode]);

  // La simulazione si ferma quando lo schermo della prova è fuori dalla finestra (la pagina ha tutte le prove)
  const onScreenRef = useRef<boolean>(true);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const io = new IntersectionObserver(([e]) => {
      onScreenRef.current = e.isIntersecting;
    });
    io.observe(canvas);
    return () => io.disconnect();
  }, []);

  // Simulation Game Loop
  useEffect(() => {
    resetPipes();
    let animId: number;
    let lastTime = performance.now();
    let owed = 0; // passi di simulazione ancora da fare (la parte con la virgola)

    const gameLoop = () => {
      const now = performance.now();
      const elapsed = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      if (!onScreenRef.current) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }
      if (!isPaused) {
        // I passi seguono il tempo vero e non i fotogrammi dello schermo: prima ce n'era uno a fotogramma e su
        // schermi a 120-144 Hz i droni andavano il doppio più veloci. Le regole di ogni passo non cambiano.
        owed += elapsed * STEPS_PER_SECOND * speedMultiplier;
        const whole = Math.floor(owed);
        const steps = Math.min(whole, MAX_STEPS_PER_FRAME);
        owed -= whole; // se il computer è lento si perde il ritardo, non si accumula
        for (let step = 0; step < steps; step++) {
          frameCountRef.current++;

          // Move pipes
          for (const pipe of pipesRef.current) {
            pipe.x -= 2.5;

            // Score check
            if (!pipe.passed && pipe.x < 80) {
              pipe.passed = true;
              scoreRef.current += 1;
              setCurrentScore(scoreRef.current);
              if (scoreRef.current > highScoreRef.current) {
                highScoreRef.current = scoreRef.current;
                setHighScore(scoreRef.current);
              }
            }
          }

          // Recycle pipes
          if (pipesRef.current[0] && pipesRef.current[0].x < -50) {
            pipesRef.current.shift();
            const lastPipeX = pipesRef.current[pipesRef.current.length - 1]?.x || 300;
            const newGapY = Math.floor(Math.random() * 160) + 80;
            pipesRef.current.push({
              x: lastPipeX + 220,
              gapY: newGapY,
              gapHeight: 110,
              width: 44,
              passed: false,
            });
          }

          // Find next oncoming pipe for agents
          const nextPipe = pipesRef.current.find(p => p.x + p.width > 80) || pipesRef.current[0];
          const pipeDistNorm = nextPipe ? (nextPipe.x - 80) / 400 : 1;
          const pipeGapYNorm = nextPipe ? nextPipe.gapY / 320 : 0.5;

          // Update human player
          if (humanMode && humanRef.current.alive) {
            humanRef.current.vy += 0.38; // gravity
            humanRef.current.y += humanRef.current.vy;

            // Floor & ceiling
            if (humanRef.current.y > 305 || humanRef.current.y < 10) {
              humanRef.current.alive = false;
              setHumanAlive(false);
            }

            // Pipe collision for human
            if (nextPipe && nextPipe.x < 80 + 16 && nextPipe.x + nextPipe.width > 80 - 16) {
              if (humanRef.current.y - 12 < nextPipe.gapY - nextPipe.gapHeight / 2 ||
                  humanRef.current.y + 12 > nextPipe.gapY + nextPipe.gapHeight / 2) {
                humanRef.current.alive = false;
                setHumanAlive(false);
              }
            }
            setHumanY(humanRef.current.y);
            setHumanVy(humanRef.current.vy);
          }

          // Update AI agents
          let alive = 0;
          let bestAgent: Agent | null = null;

          for (const agent of populationRef.current) {
            if (!agent.alive) continue;
            alive++;

            agent.fitness++;
            agent.vy += 0.38; // gravity

            // Inputs to neural network
            const normY = agent.y / 320;
            const normVy = Math.max(-1, Math.min(1, agent.vy / 10));
            const inputs: [number, number, number, number] = [
              normY,
              normVy,
              pipeDistNorm,
              pipeGapYNorm,
            ];

            const decision = forwardBrain(agent.brain, inputs);

            if (decision.shouldJump) {
              agent.vy = -6.5; // Jump action!
            }

            agent.y += agent.vy;

            // Collision with boundaries
            if (agent.y > 310 || agent.y < 5) {
              agent.alive = false;
            }

            // Collision with pipe
            if (nextPipe && nextPipe.x < 80 + 14 && nextPipe.x + nextPipe.width > 80 - 14) {
              if (agent.y - 10 < nextPipe.gapY - nextPipe.gapHeight / 2 ||
                  agent.y + 10 > nextPipe.gapY + nextPipe.gapHeight / 2) {
                agent.alive = false;
              }
            }

            if (!bestAgent || agent.fitness > bestAgent.fitness) {
              bestAgent = agent;
              setBrainTelemetry({
                inputs,
                hidden: decision.hiddenActivations,
                output: decision.activation,
                jumped: decision.shouldJump,
              });
            }
          }

          setAliveCount(alive);

          // All birds dead: evolve!
          if (alive === 0 && (!humanMode || !humanRef.current.alive)) {
            handleNextGeneration();
            break;
          }
        }
      }

      // Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Technical Blueprint Background
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(0, 0, width, height);

          // Grid coordinates
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1;
          for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // Ostacoli: in alto zona vietata al volo, in basso un palazzo
          for (const pipe of pipesRef.current) {
            const topHeight = pipe.gapY - pipe.gapHeight / 2;
            const bottomY = pipe.gapY + pipe.gapHeight / 2;

            ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
            ctx.fillRect(pipe.x, 0, pipe.width, topHeight);
            ctx.save();
            ctx.beginPath();
            ctx.rect(pipe.x, 0, pipe.width, topHeight);
            ctx.clip();
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
            ctx.lineWidth = 6;
            for (let s = -pipe.width; s < topHeight; s += 16) {
              ctx.beginPath();
              ctx.moveTo(pipe.x, s);
              ctx.lineTo(pipe.x + pipe.width, s + pipe.width);
              ctx.stroke();
            }
            ctx.restore();
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(pipe.x, -2, pipe.width, topHeight + 2);

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#38bdf8';
            ctx.fillRect(pipe.x, bottomY, pipe.width, height - bottomY);
            ctx.strokeRect(pipe.x, bottomY, pipe.width, height - bottomY + 2);
            for (let j = 0; bottomY + 10 + j * 14 < height - 6; j++) {
              for (let i = 0; i < 3; i++) {
                const lit = (i * 7 + j * 3 + pipe.gapY) % 5 === 0;
                ctx.fillStyle = lit ? 'rgba(251, 191, 36, 0.75)' : 'rgba(148, 163, 184, 0.15)';
                ctx.fillRect(pipe.x + 7 + i * 12, bottomY + 10 + j * 14, 6, 7);
              }
            }
          }

          const drawDrone = (color: string, glow: boolean, spin: number) => {
            ctx.shadowColor = glow ? color : 'transparent';
            ctx.shadowBlur = glow ? 10 : 0;
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-13, -4);
            ctx.lineTo(13, -4);
            ctx.stroke();
            ctx.beginPath();
            ctx.roundRect(-7, -6, 14, 10, 3);
            ctx.fill();
            const w = 3 + Math.abs(Math.sin(spin)) * 7;
            ctx.beginPath();
            ctx.ellipse(-13, -8, w, 1.8, 0, 0, Math.PI * 2);
            ctx.ellipse(13, -8, w, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a0f1d';
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
          };

          populationRef.current.forEach((agent, idx) => {
            if (!agent.alive) return;
            ctx.save();
            ctx.translate(80, agent.y);
            ctx.rotate(Math.max(-0.4, Math.min(0.4, agent.vy * 0.05)));
            ctx.globalAlpha = idx === 0 ? 1 : 0.4;
            drawDrone('#38bdf8', idx === 0, frameCountRef.current * 0.9 + idx);
            ctx.restore();
          });

          if (humanMode && humanRef.current.alive) {
            ctx.save();
            ctx.translate(80, humanRef.current.y);
            ctx.scale(1.15, 1.15);
            drawDrone('#10b981', true, frameCountRef.current * 0.9);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('TU', -6, -14);
            ctx.restore();
          }

          // Target line sensor
          const nextP = pipesRef.current.find(p => p.x + p.width > 80);
          if (nextP) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(80, 160);
            ctx.lineTo(nextP.x + nextP.width / 2, nextP.gapY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, speedMultiplier, humanMode, resetPipes, handleNextGeneration]);

  const handleRestart = () => {
    populationRef.current = createPopulation(20);
    generationRef.current = 1;
    setGeneration(1);
    scoreRef.current = 0;
    setCurrentScore(0);
    resetPipes();
    sound.playBlip(400, 'sine', 0.1);
    onActivity();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      {/* Exhibit Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sky-400 mb-1">
            <Brain className="w-4 h-4 text-sky-400" />
            <span>Prova 01 · Addestramento al volo</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Venti droni, zero istruzioni
          </h3>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
            Nessuno ha spiegato loro come si vola. Si schiantano contro palazzi e zone vietate, i migliori sopravvivono e passano il loro "istinto" ai prossimi. Quante generazioni servono prima che smettano di cadere?
          </p>
        </div>

        {/* Speed & Control Deck */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Speed toggles */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 px-2 font-mono">Velocità:</span>
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                title={`Velocità ${SPEED_LABEL[spd].toLowerCase()}`}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  speedMultiplier === spd
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border transition-all ${
              isPaused
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            aria-label={isPaused ? 'Riprendi' : 'Metti in pausa'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Ricomincia con droni nuovi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Simulation Viewport */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Live Telemetry Bar */}
          <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-t-xl text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">GENERAZIONE:</span>
              <span className="font-bold text-amber-400 tabular-nums">#{generation}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">IN VOLO:</span>
              <span className="font-bold text-sky-400 tabular-nums">{aliveCount}/20</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">PUNTI:</span>
              <span className="font-bold text-emerald-400 tabular-nums">{currentScore}</span>
              <span className="text-slate-500 text-[10px]">(Record: {highScore})</span>
            </div>
          </div>

          {/* Interactive Flappy Canvas */}
          <div className="relative w-full aspect-[16/10] rounded-b-xl overflow-hidden border border-slate-800 bg-[#0a0f1d] shadow-2xl">
            <canvas
              ref={canvasRef}
              width={540}
              height={337}
              onClick={() => {
                if (humanMode) handleHumanJump();
              }}
              className="w-full h-full block cursor-pointer"
            />

            {/* Human mode overlay banner */}
            {humanMode && (
              <div className="absolute top-3 left-3 bg-emerald-950/80 border border-emerald-500/50 backdrop-blur px-3 py-1 rounded-lg text-xs font-mono text-emerald-300">
                {humanAlive ? '🟢 Stai pilotando! Clicca o premi SPAZIO per dare gas' : '🔴 Ti sei schiantato. I droni continuano da soli'}
              </div>
            )}
          </div>

          {/* Mode Switcher & Mutation Slider */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setHumanMode(!humanMode);
                  humanRef.current = { y: 200, vy: 0, alive: true };
                  setHumanAlive(true);
                  sound.playBlip(600, 'sine', 0.08);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  humanMode
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{humanMode ? 'Stai pilotando tu' : 'Pilota tu contro i droni'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Mutazione:</span>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.05"
                value={mutationRate}
                onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                className="w-24 accent-sky-400 cursor-pointer"
              />
              <span className="text-sky-400 font-bold tabular-nums">
                {Math.round(mutationRate * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Neural Network Brain Diagram */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Cervello del drone migliore
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${brainTelemetry.jumped ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-950 text-slate-500'}`}>
              {brainTelemetry.jumped ? 'MOTORI: SPINTA' : 'MOTORI: MINIMO'}
            </span>
          </div>

          {/* Interactive Network Visualizer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
            {/* 4 Input Nodes */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Input</span>
              {[
                { label: 'Quota Y', val: brainTelemetry.inputs[0] },
                { label: 'Velocità', val: brainTelemetry.inputs[1] },
                { label: 'Distanza', val: brainTelemetry.inputs[2] },
                { label: 'Apertura', val: brainTelemetry.inputs[3] },
              ].map((inp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] text-sky-300 shadow-inner">
                    I{idx}
                  </div>
                  <span className="text-[10px] text-slate-400 w-14 truncate">{inp.label}</span>
                </div>
              ))}
            </div>

            {/* Connecting lines representation */}
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
              <span className="tracking-tighter">━━━━▶</span>
            </div>

            {/* 4 Hidden Neurons */}
            <div className="flex flex-col gap-2.5 items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Nascosti</span>
              {brainTelemetry.hidden.map((act, hIdx) => {
                const intensity = Math.abs(act);
                return (
                  <div
                    key={hIdx}
                    className="w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition-colors"
                    style={{
                      backgroundColor: act > 0 ? `rgba(56, 189, 248, ${intensity})` : `rgba(244, 63, 94, ${intensity})`,
                      borderColor: act > 0 ? '#38bdf8' : '#f43f5e',
                      color: intensity > 0.5 ? '#000000' : '#ffffff',
                    }}
                  >
                    H{hIdx}
                  </div>
                );
              })}
            </div>

            {/* Connecting lines representation */}
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
              <span className="tracking-tighter">━━━━▶</span>
            </div>

            {/* 1 Output Neuron */}
            <div className="flex flex-col gap-2.5 items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Spinta</span>
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all shadow-lg ${
                  brainTelemetry.output > 0.5
                    ? 'bg-amber-400 text-slate-950 border-white shadow-amber-400/50 scale-110'
                    : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
              >
                {Math.round(brainTelemetry.output * 100)}%
              </div>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Come fa a imparare?</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              La prima generazione cade quasi subito. Teniamo il drone arrivato più lontano, copiamo il suo cervello con qualche piccolo errore a caso e ripartiamo. Dopo 3–6 generazioni passano tra i palazzi meglio di qualsiasi pilota.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
