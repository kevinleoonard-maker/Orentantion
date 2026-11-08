import React, { useState } from 'react';
import { Award, Copy, Check, RotateCcw, GraduationCap } from 'lucide-react';
import { sound } from '../utils/sound';

interface SessionRecapProps {
  activityStats: {
    aiGenerations: number;
    cpuSteps: number;
    pathfindRuns: number;
    networkPackets: number;
    visionFilters: number;
  };
  onRestartAll: () => void;
}

export const SessionRecap: React.FC<SessionRecapProps> = ({ activityStats, onRestartAll }) => {
  const [studentName, setStudentName] = useState<string>('Studente Esploratore');
  const [copied, setCopied] = useState<boolean>(false);

  const totalInteractions =
    activityStats.aiGenerations +
    activityStats.cpuSteps +
    activityStats.pathfindRuns +
    activityStats.networkPackets +
    activityStats.visionFilters;

  const handleCopy = () => {
    const text = `🎓 Resoconto Laboratorio Orientamento Informatica · Vallauri:
- Studente: ${studentName}
- Generazioni Neurale AI simulate: ${activityStats.aiGenerations}
- Cicli Macchina CPU eseguiti: ${activityStats.cpuSteps}
- Rotte A* calcolate: ${activityStats.pathfindRuns}
- Pacchetti TCP trasmessi: ${activityStats.networkPackets}
- Filtri Convoluzione Computer Vision: ${activityStats.visionFilters}
- Totale Azioni di Calcolo: ${totalInteractions}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    sound.playSuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="attestato" className="py-16 bg-[#070b14] border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Certificate Card */}
        <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-sky-400 block">
                  Attestato di Partecipazione al Laboratorio
                </span>
                <h3 className="text-xl font-bold text-white">Informatica &amp; Telecomunicazioni · Vallauri</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="student-name-input" className="text-xs text-slate-400 font-mono">Nome:</label>
              <input
                id="student-name-input"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-sky-300 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Metrics Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 block">AI Flappy:</span>
              <span className="text-xl font-mono font-black text-sky-400 tabular-nums">
                {activityStats.aiGenerations} gen
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 block">Cicli CPU:</span>
              <span className="text-xl font-mono font-black text-amber-400 tabular-nums">
                {activityStats.cpuSteps}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 block">Rotte A*:</span>
              <span className="text-xl font-mono font-black text-emerald-400 tabular-nums">
                {activityStats.pathfindRuns}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 block">Pacchetti TCP:</span>
              <span className="text-xl font-mono font-black text-purple-400 tabular-nums">
                {activityStats.networkPackets}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-slate-500 block">Filtri Visione:</span>
              <span className="text-xl font-mono font-black text-rose-400 tabular-nums">
                {activityStats.visionFilters}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            Congratulazioni, <b>{studentName}</b>! Hai esplorato i 5 pilastri della tecnologia moderna: reti neurali, architettura dei processori, algoritmi di grafo, protocolli di comunicazione su fibra ottica e visione artificiale matriciale.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiato!' : 'Copia Risultati negli Appunti'}</span>
            </button>

            <button
              onClick={onRestartAll}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ricomincia Esplorazione</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
