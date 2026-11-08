import React, { useState } from 'react';
import { Award, RotateCcw, Copy, Check, Sparkles, ChevronRight } from 'lucide-react';
import { TelemetryCounters } from './ArcadeChapter';
import { sound } from '../utils/sound';

interface RecapChapterProps {
  counters: TelemetryCounters;
  bitsFlipped: number;
  labActionsCount: number;
  highestScore: number;
  onRestart: () => void;
}

export const RecapChapter: React.FC<RecapChapterProps> = ({
  counters,
  bitsFlipped,
  labActionsCount,
  highestScore,
  onRestart,
}) => {
  const [copied, setCopied] = useState(false);

  const totalFunctionCalls = counters.onKeyDown + counters.step + counters.eat + counters.gameOver;

  const handleCopySummary = () => {
    const text = `🎓 Il mio resoconto di 10 Minuti di Informatica · Vallauri:
- Punteggio Snake: ${highestScore} punti
- Chiamate a funzione CPU eseguite: ${totalFunctionCalls}
- Bit modificati nell'hardware lab: ${bitsFlipped}
- Interazioni nei laboratori avanzati: ${labActionsCount}
- Profilo conseguito: Esploratore di Sistemi Digitali`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    sound.playSuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="finale" className="py-24 bg-slate-950 border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Section Header */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Capitolo 5 · Il Tuo Percorso</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Dietro ogni pixel c'era del codice.
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-12">
          Hai giocato, invertito bit nei transistor, osservato la fisica particellare, allenato un neurone artificiale, cifrato password con SHA-256 e scalato un cluster cloud.
        </p>

        {/* Personalized Diploma / Certificate Card */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-10 shadow-2xl shadow-cyan-950/30 text-left mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block">
                  Attestato di Esplorazione
                </span>
                <h3 className="text-xl font-bold text-white">Informatica &amp; Telecomunicazioni · Vallauri</h3>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              ID Sessione: #VALL-{Math.floor(1000 + Math.random() * 9000)}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Record Snake:</span>
              <span className="text-2xl font-mono font-black text-cyan-400 tabular-nums">
                {highestScore}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Chiamate CPU:</span>
              <span className="text-2xl font-mono font-black text-amber-400 tabular-nums">
                {totalFunctionCalls}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Bit Hardware:</span>
              <span className="text-2xl font-mono font-black text-emerald-400 tabular-nums">
                {bitsFlipped}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Esperimenti:</span>
              <span className="text-2xl font-mono font-black text-purple-400 tabular-nums">
                {labActionsCount}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p className="mb-2">
              <b className="text-white">All'Istituto Vallauri non impari solo a usare il computer:</b>
            </p>
            <p className="text-slate-400">
              Impari a costruire videogiochi, progettare architetture software scalabili, proteggere reti da hacker, addestrare modelli di intelligenza artificiale e creare prodotti digitali che cambiano il mondo reale.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-semibold transition-all shadow"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copiato negli appunti!' : 'Copia il tuo Resoconto'}</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ricomincia dall'Inizio</span>
          </button>
        </div>
      </div>
    </section>
  );
};
