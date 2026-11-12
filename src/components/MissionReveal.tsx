import React, { useEffect, useState } from 'react';
import { Lock, Unlock, ArrowRight } from 'lucide-react';
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

  if (revealed) {
    return (
      <div className="mt-8 rounded-[24px] bg-surface-2 p-6 sm:p-8">
        <p className="label">File decifrato · quello che hai appena fatto si chiama</p>
        <ScrambleText
          text={mission.tech}
          active
          className="block mt-3 text-[clamp(34px,4.2vw,60px)] font-semibold leading-none tracking-[-0.045em]"
        />
        <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-muted-soft">{mission.reveal}</p>
        <p className="mt-4 label normal-case tracking-normal text-[13px]">
          La stessa idea è dentro: <span className="text-ink">{mission.where}</span>
        </p>
        <CodePeek code={mission.code} />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mt-8 rounded-[24px] border border-dashed border-line-btn p-5 flex flex-wrap items-center justify-between gap-3">
        <span className="label flex items-center gap-2">
          <Lock className="w-4 h-4" /> File classificato · completa la prova per aprirlo
        </span>
        {dots}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        sound.playSuccess();
        onReveal();
      }}
      className="mt-8 w-full rounded-[24px] bg-ink text-white p-5 sm:px-7 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-muted-soft transition-colors"
    >
      <span className="flex items-center gap-3 text-[17px] font-semibold">
        <Unlock className="w-5 h-5 text-pad" /> Decifra: cosa hai appena fatto davvero?
      </span>
      <span className="flex items-center gap-4">
        {dots}
        <ArrowRight className="w-5 h-5" />
      </span>
    </button>
  );
};
