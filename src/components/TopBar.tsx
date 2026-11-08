import React from 'react';
import { Volume2, VolumeX, Sparkles, Terminal } from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  progressPercent: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  progressPercent,
}) => {
  const navTabs = [
    { id: 'ai', label: '1. AI Flappy Bird' },
    { id: 'cpu', label: '2. Micro-CPU' },
    { id: 'path', label: '3. Navigatore A*' },
    { id: 'network', label: '4. Pacchetti TCP' },
    { id: 'vision', label: '5. Computer Vision' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#inizio"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:text-sky-400 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 font-mono text-sm font-black shadow-inner">
              &lt;/&gt;
            </span>
            <span className="text-sm sm:text-base">
              Vallauri <span className="text-slate-400 font-normal">· Laboratorio Interattivo</span>
            </span>
          </a>
        </div>

        {/* Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-mono">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Disattiva effetti sonori' : 'Attiva effetti sonori'}
            className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="w-full h-1 bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
    </header>
  );
};
