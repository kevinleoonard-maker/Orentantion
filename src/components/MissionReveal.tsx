import React, { useEffect, useState } from 'react';
import { Lock, Unlock, ArrowRight, ArrowDown, Check, Code } from 'lucide-react';
import type { Mission } from '../missions';
import { sound } from '../utils/sound';
import { CodePeek } from './CodePeek';

const GLYPHS = '01#%&*<>/{}[]=+ABCDEF';
const scramble = (text: string, keep: number) =>
  text
    .split('')
    .map((ch, i) => (i < keep || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
    .join('');

// Testo coperto da una barra nera (come un documento classificato) finché `active` è false;
// quando diventa true si "decifra" lettera per lettera.
export const ScrambleText: React.FC<{ text: string; active: boolean; className?: string }> = ({
  text,
  active,
  className = '',
}) => {
  const [out, setOut] = useState(() => scramble(text, 0));

  useEffect(() => {
    if (!active) return;
    const total = 20;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setOut(scramble(text, Math.floor((frame / total) * text.length)));
      if (frame >= total) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [active, text]);

  if (!active) {
    return (
      <span aria-label="Classificato" className={`rounded-[3px] bg-ink !text-transparent select-none ${className}`}>
        {text}
      </span>
    );
  }
  return <span className={className}>{out}</span>;
};

interface MissionRevealProps {
  mission: Mission;
  count: number;
  revealed: boolean;
  onReveal: () => void;
}

export const MissionReveal: React.FC<MissionRevealProps> = ({ mission, count, revealed, onReveal }) => {
  const unlocked = count >= mission.threshold;
  const left = Math.max(0, mission.threshold - count);
  const dots = (
    <span className="flex gap-1.5" aria-label={`${Math.min(count, mission.threshold)} su ${mission.threshold}`}>
      {Array.from({ length: mission.threshold }).map((_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i < count ? (unlocked ? 'bg-pad' : 'bg-ink') : 'bg-line-btn'}`}
        />
      ))}
    </span>
  );

  // Decifrata: la scheda con il nome, la spiegazione e il codice. Bordo arancione e pulsante «Guarda il codice»
  // perché è il premio della prova e deve vedersi.
  if (revealed) {
    return (
      <div className="mt-8 rounded-[24px] border-2 border-pad/60 bg-surface-2 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-go" aria-hidden="true">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
            File decifrato · quello che hai appena fatto si chiama
          </p>
          <a
            href={`#codice-${mission.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-[var(--bg)] hover:opacity-85"
          >
            <Code className="h-4 w-4" aria-hidden="true" /> Guarda il codice <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
        <ScrambleText
          text={mission.tech}
          active
          className="block mt-3 text-[clamp(34px,4.2vw,60px)] font-semibold leading-none tracking-[-0.045em]"
        />
        <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-muted-soft">{mission.reveal}</p>
        <p className="mt-4 label normal-case tracking-normal text-[13px]">
          La stessa idea è dentro: <span className="text-ink">{mission.where}</span>
        </p>
        <CodePeek id={`codice-${mission.id}`} code={mission.code} />
      </div>
    );
  }

  // Ancora da completare: dice chiaramente che è un passaggio e quante azioni mancano.
  if (!unlocked) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border-2 border-dashed border-line-btn p-5 sm:px-7">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2"
            aria-hidden="true"
          >
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[17px] font-semibold leading-snug">Passaggio da completare</p>
            <p className="mt-0.5 max-w-xl text-[15px] leading-snug text-muted">
              Gioca la prova qui sopra: ancora <b className="text-ink">{left === 1 ? '1 azione' : `${left} azioni`}</b> e
              si sblocca «Decifra», con la spiegazione e il codice.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] tabular-nums text-muted">
            {count}/{mission.threshold}
          </span>
          {dots}
        </div>
      </div>
    );
  }

  // Completata: il pulsante deve saltare all'occhio (arancione, alone che pulsa).
  return (
    <button
      id={`decifra-${mission.id}`}
      type="button"
      onClick={() => {
        sound.playSuccess();
        onReveal();
      }}
      className="decifra-cta group mt-8 flex w-full scroll-mt-[calc(var(--nav-h)+24px)] flex-wrap items-center justify-between gap-4 rounded-[24px] bg-pad p-5 text-left text-[#111] transition hover:brightness-105 sm:px-7"
    >
      <span className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111] text-white" aria-hidden="true">
          <Unlock className="h-5 w-5" />
        </span>
        <span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111] px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-white">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> Prova completata
          </span>
          <span className="mt-1.5 block text-[clamp(18px,1.6vw,22px)] font-semibold leading-snug">
            Decifra: scopri come funziona e guarda il codice
          </span>
        </span>
      </span>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111] text-white transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        <ArrowRight className="h-5 w-5" />
      </span>
    </button>
  );
};
