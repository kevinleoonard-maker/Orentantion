import React from 'react';
import { Volume2, VolumeX, ArrowRight, Play, Square } from 'lucide-react';
import { MISSIONS, type MissionId } from '../missions';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  active: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  progressPercent: number;
  revealed: Record<MissionId, boolean>;
  demoActive: boolean;
  onToggleDemo: () => void;
}

const SHORT: Record<MissionId, string> = {
  ai: 'Volo',
  path: 'Rotta',
  vision: 'Occhi',
  network: 'Radio',
  crypto: 'Chiave',
  cpu: 'Chip',
};

// Navbar del sito del drone: bianca all'88% con sfocatura, pillola grigia con la voce attiva su fondo bianco.
export const TopBar: React.FC<TopBarProps> = ({
  active,
  soundEnabled,
  onToggleSound,
  progressPercent,
  revealed,
  demoActive,
  onToggleDemo,
}) => {
  const items = [
    ...MISSIONS.map((m) => ({ id: `prova-${m.id}`, n: m.n, label: SHORT[m.id], done: revealed[m.id] })),
    { id: 'debriefing', n: '', label: 'Verità', done: false },
  ];

  return (
    <header className="sticky top-0 z-[20] h-[var(--nav-h)] bg-[var(--nav-bg)] backdrop-blur-md border-b border-line">
      <div className="h-full px-[var(--gutter)] flex items-center justify-between gap-4">
        <a href="#top" className="text-[19px] font-semibold tracking-[-0.025em] whitespace-nowrap">
          Missione KS-01
        </a>

        <nav aria-label="Prove" className="hidden md:flex items-center gap-0.5 p-1 rounded-full bg-surface-nav">
          {items.map((it) => {
            const on = active === it.id;
            return (
              <a
                key={it.id}
                href={`#${it.id}`}
                aria-current={on ? 'true' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors ${
                  on ? 'bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'text-muted-soft hover:text-ink'
                }`}
              >
                {it.n && <span className="font-mono text-[12px] text-muted">{it.n}</span>}
                <span className={it.n ? 'hidden xl:inline' : ''}>{it.label}</span>
                {it.done && <span className="w-1.5 h-1.5 rounded-full bg-go" aria-label="decifrata" />}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* data-demo-control: la demo non si ferma da sola quando si preme questo pulsante, ci pensa il suo clic */}
          <button
            type="button"
            data-demo-control
            onClick={onToggleDemo}
            aria-pressed={demoActive}
            aria-label={demoActive ? 'Ferma la demo automatica' : 'Avvia la demo automatica'}
            title={demoActive ? 'Ferma la demo' : 'Demo automatica: il sito si fa vedere da solo (circa 4 minuti)'}
            className="h-10 shrink-0 rounded-full border border-line-btn px-3 sm:px-4 flex items-center justify-center gap-2 text-[14px] font-semibold hover:border-ink transition-colors"
          >
            {demoActive ? (
              <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            )}
            <span className="hidden lg:inline">{demoActive ? 'Stop' : 'Demo'}</span>
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Disattiva effetti sonori' : 'Attiva effetti sonori'}
            className="w-10 h-10 rounded-full border border-line-btn flex items-center justify-center hover:border-ink transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted" />}
          </button>
          <a href="#prova-ai" className="btn btn-primary !py-2.5 !px-5 !text-[15px] hidden sm:inline-flex">
            Accendi i motori <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="absolute left-0 bottom-[-1px] h-[2px] bg-ink" style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
    </header>
  );
};
