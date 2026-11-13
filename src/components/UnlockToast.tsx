import React, { useEffect } from 'react';
import { ArrowDown, Check, X } from 'lucide-react';
import type { Mission } from '../missions';

// Avviso che compare quando una prova è completata: il pulsante «Decifra» sta sotto il gioco e su un portatile
// spesso è fuori dallo schermo, quindi senza questo avviso molti non si accorgono che si è sbloccato.
export const UnlockToast: React.FC<{ mission: Mission | null; onClose: () => void }> = ({ mission, onClose }) => {
  useEffect(() => {
    if (!mission) return;
    const t = setTimeout(onClose, 10000);
    return () => clearTimeout(t);
  }, [mission, onClose]);

  if (!mission) return null;

  const go = () => {
    document.getElementById(`decifra-${mission.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onClose();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--nav-h)+12px)] z-[40] flex justify-center px-4">
      <div
        role="status"
        className="unlock-toast pointer-events-auto flex max-w-[620px] items-center gap-3 rounded-[22px] border border-white/10 bg-night py-2.5 pl-3 pr-2.5 text-white shadow-2xl"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-go" aria-hidden="true">
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </span>
        <span className="text-[15px] leading-snug">
          <b>Prova {mission.n} completata!</b> Premi «Decifra» per scoprire come funziona e vedere il codice.
        </span>
        <button
          type="button"
          onClick={go}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-pad px-4 py-2 text-[14px] font-semibold text-[#111] hover:brightness-110"
        >
          Vai <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi l'avviso"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
