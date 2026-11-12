import React, { useState, useEffect } from 'react';
import { CPUState, createInitialCPU, stepCPU, Instruction } from '../../utils/cpuSimulator';
import { sound } from '../../utils/sound';
import { Cpu, Play, Pause, StepForward, RotateCcw, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const CPULab: React.FC<{ onActivity: () => void }> = ({ onActivity }) => {
  // Demo Programs
  const programSum: { name: string; ram: number[]; instrs: Instruction[]; desc: string } = {
    name: 'Quota: 15 m + 25 m',
    ram: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 15, 25, 0, 0, 0, 0, // RAM[10]=15, RAM[11]=25
    ],
    instrs: [
      { op: 'LDA', operand: 10 }, // ACC = RAM[10] (15)
      { op: 'ADD', operand: 11 }, // ACC += RAM[11] (25) -> 40
      { op: 'STA', operand: 12 }, // RAM[12] = ACC (40)
      { op: 'HLT', operand: 0 },
    ],
    desc: 'Il drone è a 15 metri e deve salire di altri 25. Il chip carica 15, somma 25 e scrive la nuova quota (40) nella cella 12.',
  };

  const programSub: { name: string; ram: number[]; instrs: Instruction[]; desc: string } = {
    name: 'Batteria: 100% − 45%',
    ram: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 100, 45, 0, 0, 0, 0,
    ],
    instrs: [
      { op: 'LDA', operand: 10 },
      { op: 'SUB', operand: 11 },
      { op: 'STA', operand: 13 },
      { op: 'HLT', operand: 0 },
    ],
    desc: 'Batteria piena, il volo ne ha consumato il 45%. Il chip sottrae e salva quanto resta (55) nella cella 13.',
  };

  const [activeProg, setActiveProg] = useState(programSum);
  const [cpu, setCpu] = useState<CPUState>(() => createInitialCPU(programSum.ram));
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Auto-runner interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCpu((prev) => {
        if (prev.stage === 'HALTED') {
          setIsRunning(false);
          sound.playSuccess();
          return prev;
        }
        const next = stepCPU(prev, activeProg.instrs);
        sound.playBlip(350 + next.stepCount * 25, 'sine', 0.04);
        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isRunning, activeProg]);

  const handleStep = () => {
    if (cpu.stage === 'HALTED') return;
    const next = stepCPU(cpu, activeProg.instrs);
    setCpu(next);
    sound.playBlip(420, 'triangle', 0.04);
    onActivity();
  };

  const handleReset = () => {
    setIsRunning(false);
    setCpu(createInitialCPU(activeProg.ram));
    sound.playBlip(300, 'sine', 0.06);
    onActivity();
  };

  const handleSelectProgram = (prog: typeof programSum) => {
    setIsRunning(false);
    setActiveProg(prog);
    setCpu(createInitialCPU(prog.ram));
    sound.playSuccess();
    onActivity();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      {/* Exhibit Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 mb-1">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Prova 06 · Il chip di bordo</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Rallenta il cervello del drone
          </h3>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
            Il chip fa miliardi di passi al secondo. Qui va al rallentatore: premi <b>Passo singolo</b> e guarda i numeri viaggiare dalla memoria al calcolo e ritorno. Sempre gli stessi tre passi: <b>FETCH</b>, <b>DECODE</b>, <b>EXECUTE</b>.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectProgram(programSum)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              activeProg.name === programSum.name
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Quota +25 m
          </button>
          <button
            onClick={() => handleSelectProgram(programSub)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              activeProg.name === programSub.name
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Batteria −45%
          </button>

          <button
            onClick={() => {
              setIsRunning(!isRunning);
              onActivity();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
              isRunning ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Stop' : 'Avvia'}</span>
          </button>

          <button
            onClick={handleStep}
            disabled={isRunning || cpu.stage === 'HALTED'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold hover:text-white disabled:opacity-40"
          >
            <StepForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Passo singolo</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Resetta CPU"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Micro-CPU Visual Architecture */}
        <div className="lg:col-span-8 p-5 rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-inner space-y-6">
          {/* Phase Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">FASE CICLO CLOCK:</span>
              <span className={`px-2.5 py-0.5 rounded font-bold ${
                cpu.stage === 'FETCH' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50' :
                cpu.stage === 'DECODE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                cpu.stage === 'EXECUTE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                'bg-rose-500/20 text-rose-400 border border-rose-500/50'
              }`}>
                {cpu.stage}
              </span>
            </div>

            <div className="text-slate-400">
              Passo totale: <b className="text-white tabular-nums">{cpu.stepCount}</b>
            </div>
          </div>

          {/* Central Bus & Registers Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Control Unit & Program Counter */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
              <div className="text-xs font-mono font-bold text-sky-400 flex items-center justify-between">
                <span>CONTROL UNIT</span>
                <span className="text-[10px] text-slate-500">Unità di Controllo</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">PC (Program Counter):</span>
                <span className="text-base font-bold text-sky-300 tabular-nums">{cpu.pc}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">IR (Istruzione):</span>
                <span className="font-bold text-amber-400">
                  {cpu.ir ? `${cpu.ir.op} [${cpu.ir.operand}]` : 'VUOTO'}
                </span>
              </div>
            </div>

            {/* Arithmetic Logic Unit (ALU) & Accumulator */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-between">
                <span>ALU &amp; REGISTRI</span>
                <span className="text-[10px] text-slate-500">Calcolo Aritmetico</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">ACC (Accumulatore):</span>
                <span className="text-lg font-black text-emerald-300 tabular-nums">{cpu.acc}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                <span>Operazione ALU: </span>
                <b className="text-slate-200">
                  {cpu.ir?.op === 'ADD' ? 'Somma binaria a 8 bit' :
                   cpu.ir?.op === 'SUB' ? 'Complemento a due' :
                   cpu.ir?.op === 'LDA' ? 'Trasferimento dati' : 'In attesa'}
                </b>
              </div>
            </div>

            {/* Live Data Bus State */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
              <div className="text-xs font-mono font-bold text-amber-400 flex items-center justify-between">
                <span>DATA BUS (Fili di Rame)</span>
                <span className="text-[10px] text-slate-500">Bus di Sistema</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 flex flex-col justify-center items-center text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Segnale sul Bus</span>
                <span className="text-2xl font-mono font-black text-amber-400 tabular-nums my-0.5">
                  {cpu.busValue !== null ? cpu.busValue : '0'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {cpu.busSource ? `${cpu.busSource} ➔ ${cpu.busTarget}` : 'Trasparente'}
                </span>
              </div>
            </div>
          </div>

          {/* 16 RAM Memory Cells */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-slate-300 font-bold">MEMORIA RAM (16 INDIRIZZI FISICI):</span>
              <span className="text-slate-500">Cella attiva: RAM[{cpu.pc}]</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 font-mono text-xs">
              {cpu.ram.map((val, idx) => {
                const isPC = cpu.pc === idx;
                const isModified = (activeProg.instrs[0]?.operand === idx || activeProg.instrs[1]?.operand === idx || activeProg.instrs[2]?.operand === idx);
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      isPC
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold shadow-md shadow-sky-500/20'
                        : isModified
                        ? 'bg-slate-900 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[9px] text-slate-500 block">#{idx}</span>
                    <span className="text-sm font-bold tabular-nums text-white">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assembly Code Program */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-1">PROGRAMMA ASSEMBLY</span>
            <h4 className="text-sm font-bold text-white">{activeProg.name}</h4>
            <p className="text-xs text-slate-400 mt-1">{activeProg.desc}</p>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {activeProg.instrs.map((inst, idx) => {
              const isExecuting = cpu.pc === idx;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                    isExecuting
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold pl-3 shadow'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">[{idx}]</span>
                    <span>{inst.op}</span>
                    <span className="text-slate-300">#{inst.operand}</span>
                  </div>
                  {isExecuting && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                      IN CORSO
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <b className="text-slate-200">A velocità reale:</b> il chip di un drone ripete questi tre passi centinaia di milioni di volte al secondo, per tenerlo dritto anche col vento.
          </div>
        </div>
      </div>
    </div>
  );
};
