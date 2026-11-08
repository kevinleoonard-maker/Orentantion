import React, { useState, useEffect, useRef } from 'react';
import { KERNELS, KernelType, applyConvolution } from '../../utils/convolution';
import { sound } from '../../utils/sound';
import { Eye, Sparkles, RotateCcw, PenTool } from 'lucide-react';

export const VisionLab: React.FC<{ onActivity: () => void }> = ({ onActivity }) => {
  const canvasInputRef = useRef<HTMLCanvasElement | null>(null);
  const canvasOutputRef = useRef<HTMLCanvasElement | null>(null);

  const [activeKernel, setActiveKernel] = useState<KernelType>('sobel');
  const isPaintingRef = useRef<boolean>(false);

  // Initialize input canvas with test pattern (geometric square, circle, line)
  const drawDefaultPattern = () => {
    const canvas = canvasInputRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // High contrast shapes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30, 30, 60, 60);

    ctx.beginPath();
    ctx.arc(150, 60, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(30, 130);
    ctx.lineTo(190, 130);
    ctx.stroke();

    applyFilter();
  };

  const applyFilter = () => {
    const inCanvas = canvasInputRef.current;
    const outCanvas = canvasOutputRef.current;
    if (!inCanvas || !outCanvas) return;

    const inCtx = inCanvas.getContext('2d');
    const outCtx = outCanvas.getContext('2d');
    if (!inCtx || !outCtx) return;

    const w = inCanvas.width;
    const h = inCanvas.height;

    const imgData = inCtx.getImageData(0, 0, w, h);
    const rawPixels: number[][] = [];

    // Convert to grayscale 2D array
    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = imgData.data[idx];
        const g = imgData.data[idx + 1];
        const b = imgData.data[idx + 2];
        row.push(Math.round(0.299 * r + 0.587 * g + 0.114 * b));
      }
      rawPixels.push(row);
    }

    const kernel = KERNELS[activeKernel];
    const filtered = applyConvolution(rawPixels, kernel.matrix, kernel.divisor);

    const outData = outCtx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const val = filtered[y][x];
        outData.data[idx] = val;
        outData.data[idx + 1] = val;
        outData.data[idx + 2] = val;
        outData.data[idx + 3] = 255;
      }
    }

    outCtx.putImageData(outData, 0, 0);
  };

  useEffect(() => {
    drawDefaultPattern();
  }, [activeKernel]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPaintingRef.current = true;
    paintOnCanvas(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) return;
    paintOnCanvas(e);
  };

  const handlePointerUp = () => {
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      applyFilter();
      sound.playBlip(500, 'sine', 0.03);
      onActivity();
    }
  };

  const paintOnCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasInputRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();

    applyFilter();
  };

  const kernelInfo = KERNELS[activeKernel];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      {/* Exhibit Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400 mb-1">
            <Eye className="w-4 h-4 text-rose-400" />
            <span>Esperimento 5 · Computer Vision &amp; Matematica Matriciale</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Come "Vede" una Telecamera Intelligente: Matrici di Convoluzione
          </h3>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
            Disegna a mano libera nel riquadro di sinistra. A destra vedrai la trasformazione in tempo reale calcolata moltiplicando ogni pixel per una matrice 3×3 (il principio alla base della guida autonoma di Tesla).
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(Object.keys(KERNELS) as KernelType[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setActiveKernel(k);
                sound.playBlip(600, 'sine', 0.04);
                onActivity();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeKernel === k
                  ? 'bg-rose-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {KERNELS[k].name.split(' ')[0]}
            </button>
          ))}
          <button
            onClick={drawDefaultPattern}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            title="Ripristina forme geometriche"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dual Canvas Viewports */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input Canvas */}
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-t-xl text-xs font-mono text-slate-300">
              <span>INPUT: DISEGNA QUI</span>
              <PenTool className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="w-full aspect-[4/3] rounded-b-xl border border-slate-800 bg-[#05070c] overflow-hidden">
              <canvas
                ref={canvasInputRef}
                width={220}
                height={165}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full h-full block cursor-crosshair touch-none"
              />
            </div>
          </div>

          {/* Output Canvas */}
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-t-xl text-xs font-mono text-rose-400 font-bold">
              <span>OUTPUT: {kernelInfo.name.toUpperCase()}</span>
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div className="w-full aspect-[4/3] rounded-b-xl border border-slate-800 bg-[#05070c] overflow-hidden shadow-xl">
              <canvas
                ref={canvasOutputRef}
                width={220}
                height={165}
                className="w-full h-full block"
              />
            </div>
          </div>
        </div>

        {/* 3x3 Convolution Matrix Inspector */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-rose-400 font-bold block mb-1">MATRICE DEL KERNEL 3×3</span>
            <h4 className="text-sm font-bold text-white">{kernelInfo.name}</h4>
            <p className="text-xs text-slate-400 mt-1">{kernelInfo.desc}</p>
          </div>

          {/* 3x3 Matrix Grid */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs text-center w-36">
              {kernelInfo.matrix.map((row, rIdx) =>
                row.map((val, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="p-2 rounded bg-slate-900 border border-slate-800 font-bold text-rose-300"
                  >
                    {val}
                  </div>
                ))
              )}
            </div>
            {kernelInfo.divisor > 1 && (
              <span className="text-[10px] font-mono text-slate-500 mt-2">
                Fattore di normalizzazione: ÷ {kernelInfo.divisor}
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <b className="text-slate-200">Applicazione reale:</b> Le reti neurali convoluzionali (CNN) fanno passare migliaia di questi kernel in parallelo per riconoscere volti, cartelli stradali e tumori radiologici.
          </div>
        </div>
      </div>
    </div>
  );
};
