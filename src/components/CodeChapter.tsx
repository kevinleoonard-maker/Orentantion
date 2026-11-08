import React from 'react';
import { SnakeConfig } from '../utils/snakeLogic';
import { TelemetryCounters } from './ArcadeChapter';
import { Sliders, RotateCcw } from 'lucide-react';
import { sound } from '../utils/sound';

interface CodeChapterProps {
  config: SnakeConfig;
  onUpdateConfig: (newConfig: SnakeConfig) => void;
  counters: TelemetryCounters;
  onReplayWithRules: () => void;
}

export const CodeChapter: React.FC<CodeChapterProps> = ({
  config,
  onUpdateConfig,
  counters,
  onReplayWithRules,
}) => {
  const colorSwatches = [
    { label: 'Cyan', hex: '#06B6D4' },
    { label: 'Smeraldo', hex: '#10B981' },
    { label: 'Ambra', hex: '#F59E0B' },
    { label: 'Viola', hex: '#8B5CF6' },
    { label: 'Rosa', hex: '#F43F5E' },
  ];

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseInt(e.target.value, 10);
    onUpdateConfig({ ...config, speed });
    sound.playBlip(300 + (220 - speed) * 3, 'sine', 0.03);
  };

  const handleWallToggle = (deadly: boolean) => {
    onUpdateConfig({ ...config, wallsDeadly: deadly });
    sound.playBlip(deadly ? 600 : 400, 'sine', 0.05);
  };

  const handleColorChange = (hex: string) => {
    onUpdateConfig({ ...config, color: hex });
    sound.playBlip(750, 'sine', 0.05);
  };

  return (
    <section id="codice" className="py-20 bg-slate-900/50 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
            <span>Capitolo 2</span>
            <span className="text-slate-600">·</span>
            <span>Il codice che hai eseguito</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Quello che hai giocato è fatto di queste righe.
          </h2>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Non sono immagini o testi finti: è il codice JavaScript vero che ha mosso ogni pixel della tua partita.
            Il badge luminoso mostra esattamente quante volte ogni funzione è stata eseguita dalla tua CPU.
          </p>
        </div>

        {/* Code Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: CONFIG (Full width) */}
          <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-semibold">
                  CONFIG
                </span>
                <span className="text-sm font-semibold text-slate-300">Regole Globali dell'Ambiente</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">Sempre in memoria</span>
            </div>
            <pre className="p-4 rounded-lg bg-slate-900/90 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`const CONFIG = {
  speed: ${config.speed},            // ${config.speed} millisecondi tra ogni passo
  wallsDeadly: ${config.wallsDeadly},     // ${config.wallsDeadly ? 'impatto letale col bordo' : 'teletrasporto al lato opposto'}
  color: "${config.color}",       // tinta vettoriale del serpente
  gridSize: ${config.gridSize}           // matrice bidimensionale ${config.gridSize}x${config.gridSize} caselle
};`}</code>
            </pre>
            <p className="mt-3 text-xs text-slate-400">
              <b className="text-slate-200">Concetto chiave:</b> I bravi programmatori non spargono numeri a caso nel codice. Raccolgono le regole in una configurazione centrale: modificandola qui, tutto il gioco cambia all'istante.
            </p>
          </div>

          {/* Card 2: onKeyDown */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono font-semibold">
                onKeyDown(event)
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/50">
                {counters.onKeyDown} volte
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-slate-900/90 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`function onKeyDown(event) {
  const key = event.key;
  if (key === 'ArrowUp' && direction !== 'DOWN') {
    nextDirection = 'UP';
  }
  // Impedisce inversioni a 180° istantanee
}`}</code>
            </pre>
            <p className="mt-3 text-xs text-slate-400">
              <b className="text-slate-200">Concetto chiave:</b> Riceve il segnale hardware della tastiera e verifica che la mossa sia valida secondo le regole della fisica del gioco.
            </p>
          </div>

          {/* Card 3: step() */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-semibold">
                step()
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/50">
                {counters.step} volte
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-slate-900/90 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`function step() {
  const newHead = getNextCoordinate(head, direction);
  if (collides(newHead)) return gameOver();
  snake.unshift(newHead); // aggiunge testa
  if (!isEatingFood(newHead)) snake.pop(); // toglie coda
}`}</code>
            </pre>
            <p className="mt-3 text-xs text-slate-400">
              <b className="text-slate-200">Concetto chiave:</b> Il "battito cardiaco" (game loop): a intervalli regolari calcola lo stato successivo e ridisegna il mondo a 60 frame al secondo.
            </p>
          </div>

          {/* Card 4: eat() */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                eat()
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                {counters.eat} volte
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-slate-900/90 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`function eat() {
  score += 10;
  playSynthesisBlip(880, 'chime');
  food = spawnRandomPosition(snake);
  // la coda non viene rimossa: il serpente cresce
}`}</code>
            </pre>
            <p className="mt-3 text-xs text-slate-400">
              <b className="text-slate-200">Concetto chiave:</b> Gestisce la collisione premiante: aggiorna il punteggio in memoria e genera nuovo cibo in coordinate libere.
            </p>
          </div>

          {/* Card 5: gameOver() */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-semibold">
                gameOver()
              </span>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/50">
                {counters.gameOver} volte
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-slate-900/90 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`function gameOver() {
  clearInterval(gameLoopTimer);
  showScoreOverlay(score);
  saveHighScore(score);
}`}</code>
            </pre>
            <p className="mt-3 text-xs text-slate-400">
              <b className="text-slate-200">Concetto chiave:</b> Arresta i timer di background per liberare risorse della CPU e mostra la schermata riassuntiva.
            </p>
          </div>
        </div>

        {/* Live Tweak Deck */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 shadow-xl shadow-cyan-950/20">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">
              Ora tocca a te: modifica i parametri del codice in diretta.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">CONFIG.speed</span>
                <span className="text-cyan-400 font-bold">{config.speed} ms</span>
              </div>
              <input
                type="range"
                min="60"
                max="220"
                step="10"
                value={config.speed}
                onChange={handleSpeedChange}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block">
                {config.speed <= 80 ? 'Velocità estrema (difficile)' : config.speed >= 160 ? 'Velocità rilassata' : 'Velocità standard'}
              </span>
            </div>

            {/* Walls Control */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">CONFIG.wallsDeadly</span>
                <span className={config.wallsDeadly ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {config.wallsDeadly ? 'true (Muri Mortali)' : 'false (Teletrasporto)'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleWallToggle(true)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    config.wallsDeadly
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Muri Letali
                </button>
                <button
                  type="button"
                  onClick={() => handleWallToggle(false)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    !config.wallsDeadly
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Aperto (Wrap)
                </button>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">CONFIG.color</span>
                <span className="font-bold text-slate-200">{config.color}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {colorSwatches.map((swatch) => (
                  <button
                    key={swatch.hex}
                    onClick={() => handleColorChange(swatch.hex)}
                    style={{ backgroundColor: swatch.hex }}
                    aria-label={`Colore ${swatch.label}`}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      config.color === swatch.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onReplayWithRules}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rigioca al Capitolo 1 con le tue nuove regole</span>
          </button>
        </div>
      </div>
    </section>
  );
};
