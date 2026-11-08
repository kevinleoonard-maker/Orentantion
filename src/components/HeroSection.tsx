import React from 'react';
import { Brain, Cpu, Compass, Network, Eye, ArrowDown } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeroSectionProps {
  onSelectExhibit: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectExhibit }) => {
  const exhibits = [
    {
      id: 'ai',
      icon: Brain,
      title: '01. Neuroevoluzione AI',
      desc: '20 creature con rete neurale imparano a giocare a Flappy Bird da sole con algoritmi genetici.',
      color: 'text-sky-400 border-sky-500/30 hover:border-sky-400',
    },
    {
      id: 'cpu',
      icon: Cpu,
      title: '02. Architettura CPU',
      desc: 'Segui il ciclo macchina FETCH-DECODE-EXECUTE dentro un microprocessore a 8 bit.',
      color: 'text-amber-400 border-amber-500/30 hover:border-amber-400',
    },
    {
      id: 'path',
      icon: Compass,
      title: '03. Navigatore A*',
      desc: 'Disegna muri in un labirinto e scopri come Google Maps trova la rotta minima garantita.',
      color: 'text-emerald-400 border-emerald-500/30 hover:border-emerald-400',
    },
    {
      id: 'network',
      icon: Network,
      title: '04. Pacchetti TCP/IP',
      desc: 'Taglia messaggi in pacchetti, distruggili in volo e osserva il protocollo TCP riparare la rete.',
      color: 'text-purple-400 border-purple-500/30 hover:border-purple-400',
    },
    {
      id: 'vision',
      icon: Eye,
      title: '05. Computer Vision',
      desc: 'Disegna forme e osserva le matrici 3x3 estrarre i contorni come le telecamere di Tesla.',
      color: 'text-rose-400 border-rose-500/30 hover:border-rose-400',
    },
  ];

  const handleCardClick = (id: string) => {
    sound.playBlip(600, 'sine', 0.08);
    onSelectExhibit(id);
    const el = document.getElementById('exhibits-deck');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="inizio" className="relative bg-[#070b14] border-b border-slate-800 py-16 sm:py-20">
      {/* Precision Blueprint Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Editorial Subtitle */}
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-400 mb-3">
          <span>Dipartimento di Informatica · Istituto Giancarlo Vallauri</span>
          <span className="text-slate-600">·</span>
          <span>Fossano</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12] mb-6 [text-wrap:balance]">
          L'Informatica non si studia a memoria. <span className="text-sky-400">Si sperimenta.</span>
        </h1>

        {/* Lead */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-10">
          Nessuna slide teorica: interagisci direttamente con simulatori reali di <b>intelligenza artificiale autonoma</b>, <b>architettura dei microchip</b>, <b>algoritmi di percorso GPS</b>, <b>pacchetti di rete mondiali</b> e <b>visione artificiale</b>.
        </p>

        {/* 5 Exhibit Quick Launch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {exhibits.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCardClick(item.id)}
                className={`p-4 rounded-xl border bg-slate-900/60 hover:bg-slate-900 text-left transition-all group flex flex-col justify-between ${item.color}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">
                    {item.desc}
                  </p>
                </div>
                <span className="text-[10px] font-mono mt-3 opacity-60 group-hover:opacity-100 flex items-center gap-1">
                  <span>Esplora simulatore</span>
                  <span>→</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
