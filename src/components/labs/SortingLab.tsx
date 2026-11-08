import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Play, Pause, RotateCcw, FastForward, CheckCircle2 } from 'lucide-react';
import { generateBubbleSortSteps, SortStep } from '../../utils/sortingLogic';
import { sound } from '../../utils/sound';

export const SortingLab: React.FC<{ onAction: () => void }> = ({ onAction }) => {
  const [initialArray, setInitialArray] = useState<number[]>([42, 18, 85, 33, 9, 64, 52, 27, 76, 12, 91, 5]);
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize steps when array changes
  useEffect(() => {
    const generated = generateBubbleSortSteps(initialArray);
    setSteps(generated);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [initialArray]);

  // Animation player
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev + 1 >= steps.length) {
          setIsPlaying(false);
          sound.playSuccess();
          return prev;
        }
        const nextIdx = prev + 1;
        const cur = steps[nextIdx];
        if (cur.swappedIndices) {
          sound.playBlip(300 + cur.array[cur.swappedIndices[0]] * 5, 'triangle', 0.03);
        }
        return nextIdx;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isPlaying, steps]);

  const shuffleArray = () => {
    const shuffled = Array.from({ length: 12 }, () => Math.floor(Math.random() * 85) + 10);
    setInitialArray(shuffled);
    sound.playBlip(400, 'sine', 0.05);
    onAction();
  };

  const handleStepForward = () => {
    if (currentStepIdx + 1 < steps.length) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      const cur = steps[nextIdx];
      if (cur.swappedIndices) {
        sound.playBlip(400 + cur.array[cur.swappedIndices[0]] * 5, 'triangle', 0.04);
      }
      onAction();
    }
  };

  const currentStep = steps[currentStepIdx] || {
    array: initialArray,
    comparingIndices: null,
    swappedIndices: null,
    sortedIndices: [],
    comparisons: 0,
    swaps: 0,
  };

  const isCompleted = currentStepIdx >= steps.length - 1 && steps.length > 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Esperimento 5 · Algoritmi &amp; Complessità Temporale Big-O</span>
          </div>
          <h3 className="text-xl font-bold text-white">L'Arte dell'Efficienza: Bubble Sort vs Quick Sort</h3>
          <p className="text-sm text-slate-400">
            Un algoritmo mal progettato blocca un computer per ore. Un buon algoritmo risolve lo stesso problema in frazioni di secondo.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsPlaying(!isPlaying); onAction(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pausa' : 'Avvia Ordinamento'}</span>
          </button>
          <button
            onClick={handleStepForward}
            disabled={isPlaying || isCompleted}
            aria-label="Passo successivo"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
          >
            <FastForward className="w-4 h-4" />
          </button>
          <button
            onClick={shuffleArray}
            aria-label="Rimescola numeri"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Bars Canvas Visualizer */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Operations HUD */}
          <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-t-xl text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Confronti:</span>
              <span className="font-bold text-amber-400 tabular-nums">{currentStep.comparisons}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Scambi:</span>
              <span className="font-bold text-cyan-400 tabular-nums">{currentStep.swaps}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Progresso:</span>
              <span className="font-bold text-slate-200 tabular-nums">
                {Math.round((currentStepIdx / Math.max(1, steps.length - 1)) * 100)}%
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="w-full h-56 rounded-b-xl border border-t-0 border-slate-800 bg-[#090d16] p-4 flex items-end justify-between gap-1.5 shadow-inner">
            {currentStep.array.map((val, idx) => {
              const isComparing = currentStep.comparingIndices?.includes(idx);
              const isSwapped = currentStep.swappedIndices?.includes(idx);
              const isSorted = currentStep.sortedIndices.includes(idx);

              let barColor = 'bg-slate-700 text-slate-400';
              if (isSorted) barColor = 'bg-emerald-500 text-slate-950';
              else if (isSwapped) barColor = 'bg-rose-500 text-white';
              else if (isComparing) barColor = 'bg-amber-400 text-slate-950';

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono font-bold text-slate-400 tabular-nums">
                    {val}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-75 ${barColor} shadow-sm`}
                    style={{ height: `${(val / 100) * 160}px` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Confronto in corso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Scambio di posizione
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Ordinato correttamente
            </span>
          </div>
        </div>

        {/* Big-O Complexity Lesson */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-semibold">
              computationalComplexity.ts
            </span>
            <span className="text-xs text-slate-400">Teoria degli Algoritmi</span>
          </div>

          <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
            <code>{`// Bubble Sort: O(n²) operazioni
// Per 12 elementi: ~70 operazioni
// Per 1.000.000 elementi: 1.000.000.000.000 op. (11 GIORNI!)

// Quick Sort: O(n log n) operazioni
// Per 1.000.000 elementi: ~20.000.000 op. (0.02 SECONDI!)`}</code>
          </pre>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Perché è fondamentale per un informatico?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Google cerca tra miliardi di siti web in 0.15 secondi grazie alla corretta progettazione degli algoritmi. All'Istituto Vallauri impari a padroneggiare la logica computazionale che fa la differenza tra un software lento e uno scalabile a livello mondiale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
