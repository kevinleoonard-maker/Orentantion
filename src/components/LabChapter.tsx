import React, { useState } from 'react';
import { PhysicsLab } from './labs/PhysicsLab';
import { AILab } from './labs/AILab';
import { CryptoLab } from './labs/CryptoLab';
import { CloudLab } from './labs/CloudLab';
import { SortingLab } from './labs/SortingLab';
import { Orbit, Brain, KeyRound, Cloud, BarChart3 } from 'lucide-react';
import { sound } from '../utils/sound';

interface LabChapterProps {
  onLabActivity: () => void;
}

export const LabChapter: React.FC<LabChapterProps> = ({ onLabActivity }) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'ai' | 'crypto' | 'cloud' | 'sorting'>('physics');

  const tabs = [
    { id: 'physics', label: '1. Fisica Computazionale', icon: Orbit },
    { id: 'ai', label: '2. Intelligenza Artificiale', icon: Brain },
    { id: 'crypto', label: '3. Crittografia SHA-256', icon: KeyRound },
    { id: 'cloud', label: '4. Cloud & Scalabilità', icon: Cloud },
    { id: 'sorting', label: '5. Algoritmi & Big-O', icon: BarChart3 },
  ] as const;

  const handleTabSwitch = (id: typeof activeTab) => {
    setActiveTab(id);
    sound.playBlip(550, 'sine', 0.04);
    onLabActivity();
  };

  return (
    <section id="lab" className="py-20 bg-slate-900/40 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
            <span>Capitolo 4</span>
            <span className="text-slate-600">·</span>
            <span>Il Laboratorio Sperimentale</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Cinque esperimenti avanzati. Il codice prende vita.
          </h2>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Dalla fisica newtoniana all'apprendimento automatico, dalla sicurezza delle reti alla gestione del cloud globale. Tocca con mano i campi fondamentali dell'informatica moderna.
          </p>
        </div>

        {/* Experiment Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap border transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Experiment Render */}
        <div className="transition-all duration-200">
          {activeTab === 'physics' && <PhysicsLab onAction={onLabActivity} />}
          {activeTab === 'ai' && <AILab onAction={onLabActivity} />}
          {activeTab === 'crypto' && <CryptoLab onAction={onLabActivity} />}
          {activeTab === 'cloud' && <CloudLab onAction={onLabActivity} />}
          {activeTab === 'sorting' && <SortingLab onAction={onLabActivity} />}
        </div>
      </div>
    </section>
  );
};
