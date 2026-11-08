import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Brain, RotateCcw, Sparkles } from 'lucide-react';
import { DataPoint, trainLinearClassifier, predictKNN } from '../../utils/aiLogic';
import { sound } from '../../utils/sound';

export const AILab: React.FC<{ onAction: () => void }> = ({ onAction }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeCategory, setActiveCategory] = useState<0 | 1>(0);
  const [modelType, setModelType] = useState<'linear' | 'knn'>('linear');
  const [points, setPoints] = useState<DataPoint[]>([
    { id: '1', x: 0.25, y: 0.3, category: 0 },
    { id: '2', x: 0.3, y: 0.45, category: 0 },
    { id: '3', x: 0.4, y: 0.25, category: 0 },
    { id: '4', x: 0.7, y: 0.75, category: 1 },
    { id: '5', x: 0.8, y: 0.6, category: 1 },
    { id: '6', x: 0.65, y: 0.85, category: 1 },
  ]);

  const modelWeights = useMemo(() => {
    return trainLinearClassifier(points, 120, 0.2);
  }, [points]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const newPoint: DataPoint = {
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      category: activeCategory,
    };

    setPoints((prev) => [...prev, newPoint]);
    sound.playBlip(activeCategory === 0 ? 580 : 380, 'sine', 0.08);
    onAction();
  };

  const loadPreset = (presetType: 'linear' | 'clusters' | 'complex') => {
    if (presetType === 'linear') {
      setPoints([
        { id: '1', x: 0.2, y: 0.25, category: 0 },
        { id: '2', x: 0.3, y: 0.35, category: 0 },
        { id: '3', x: 0.15, y: 0.45, category: 0 },
        { id: '4', x: 0.4, y: 0.2, category: 0 },
        { id: '5', x: 0.75, y: 0.8, category: 1 },
        { id: '6', x: 0.85, y: 0.65, category: 1 },
        { id: '7', x: 0.65, y: 0.9, category: 1 },
        { id: '8', x: 0.9, y: 0.85, category: 1 },
      ]);
      setModelType('linear');
    } else if (presetType === 'clusters') {
      setPoints([
        { id: '1', x: 0.2, y: 0.8, category: 0 },
        { id: '2', x: 0.3, y: 0.7, category: 0 },
        { id: '3', x: 0.8, y: 0.2, category: 0 },
        { id: '4', x: 0.7, y: 0.3, category: 0 },
        { id: '5', x: 0.5, y: 0.5, category: 1 },
        { id: '6', x: 0.45, y: 0.55, category: 1 },
        { id: '7', x: 0.55, y: 0.45, category: 1 },
      ]);
      setModelType('knn');
    }
    sound.playSuccess();
    onAction();
  };

  const clearPoints = () => {
    setPoints([]);
    sound.playBlip(300, 'sine', 0.05);
  };

  // Render Decision Boundary Heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw decision boundary grid
    const resolution = 20; // 20px step for smooth performance
    for (let x = 0; x < width; x += resolution) {
      for (let y = 0; y < height; y += resolution) {
        const normX = x / width;
        const normY = y / height;

        let category = 0;
        let confidence = 0.5;

        if (modelType === 'linear') {
          const z = modelWeights.w1 * normX + modelWeights.w2 * normY + modelWeights.bias;
          const prob = 1 / (1 + Math.exp(-z));
          category = prob >= 0.5 ? 1 : 0;
          confidence = prob >= 0.5 ? prob : (1 - prob);
        } else {
          const pred = predictKNN(normX, normY, points, 3);
          category = pred.category;
          confidence = pred.confidence;
        }

        const alpha = Math.min(0.35, Math.max(0.08, (confidence - 0.5) * 0.7));
        ctx.fillStyle = category === 0
          ? `rgba(6, 182, 212, ${alpha})` // Cyan team
          : `rgba(245, 158, 11, ${alpha})`; // Amber team

        ctx.fillRect(x, y, resolution, resolution);
      }
    }

    // Grid coordinate lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j <= height; j += 60) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // Draw training data points
    points.forEach((p) => {
      const px = p.x * width;
      const py = p.y * height;

      ctx.shadowColor = p.category === 0 ? '#06b6d4' : '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.category === 0 ? '#06b6d4' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      // Outer white ring
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
  }, [points, modelType, modelWeights]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Brain className="w-4 h-4" />
            <span>Esperimento 2 · Machine Learning &amp; Reti Neurali</span>
          </div>
          <h3 className="text-xl font-bold text-white">Insegna alla Macchina a Riconoscere i Dati</h3>
          <p className="text-sm text-slate-400">
            Nessun programmatore ha scritto regole fisse: l'AI impara osservando i tuoi punti ed elabora da sola una frontiera di decisione.
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => { setModelType('linear'); sound.playBlip(500, 'sine', 0.05); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              modelType === 'linear' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Perceptron (1 Neurone)
          </button>
          <button
            onClick={() => { setModelType('knn'); sound.playBlip(600, 'sine', 0.05); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              modelType === 'knn' ? 'bg-indigo-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            KNN Non-Lineare
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Plane */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Active Class Switcher */}
          <div className="w-full flex items-center justify-between gap-3 mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Inserisci punto:</span>
              <button
                onClick={() => setActiveCategory(0)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  activeCategory === 0
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Squadra Cyan (0)</span>
              </button>
              <button
                onClick={() => setActiveCategory(1)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  activeCategory === 1
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Squadra Ambra (1)</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => loadPreset('linear')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800"
              >
                Esempio Lineare
              </button>
              <button
                onClick={() => loadPreset('clusters')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800"
              >
                Cluster
              </button>
              <button
                onClick={clearPoints}
                className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-rose-400 text-[11px] border border-slate-800"
              >
                Pulisci
              </button>
            </div>
          </div>

          <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-inner">
            <canvas
              ref={canvasRef}
              width={480}
              height={300}
              onClick={handleCanvasClick}
              className="w-full h-full block cursor-pointer"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block text-center">
            Clicca sul piano per inserire nuovi punti di addestramento. L'algoritmo ricalcola la frontiera in tempo reale!
          </span>
        </div>

        {/* Math & Weights Dashboard */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-semibold">
              neuralWeights.ts
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Accuratezza:</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {modelWeights.accuracy}%
              </span>
            </div>
          </div>

          <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed mb-3">
            <code>{`// Equazione della frontiera decisionale:
// z = w1 * x + w2 * y + bias

const w1   = ${modelWeights.w1.toFixed(3)};
const w2   = ${modelWeights.w2.toFixed(3)};
const bias = ${modelWeights.bias.toFixed(3)};

// Funzione di attivazione Sigmoide:
const probabilità = 1 / (1 + Math.exp(-z));
const classe = probabilità >= 0.5 ? "Ambra" : "Cyan";`}</code>
          </pre>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Punti di addestramento:</span>
              <span className="font-mono font-bold text-cyan-400">{points.length} campioni</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Modello matematico:</span>
              <span className="font-mono text-slate-200">
                {modelType === 'linear' ? 'Regressione Logistica / Perceptron' : 'K-Nearest Neighbors (k=3)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              Così funzionano i filtri anti-spam di Gmail, i sistemi di diagnosi medica e le reti neurali profonde di guida autonoma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
