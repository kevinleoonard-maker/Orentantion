import React, { useEffect, useRef, useState } from 'react';
import { Pause, Timer } from 'lucide-react';

// Conto alla rovescia di 10 minuti nella barra: ogni gruppo ha 10 minuti per presentare e arriva ogni 10 minuti.
// Parte da solo quando si apre la pagina, quindi ricaricando la pagina si riparte da 10:00 (di proposito non si
// salva niente nel browser). Un clic lo mette in pausa e lo fa ripartire. Finito il tempo continua in rosso con
// il ritardo (+0:23), così chi presenta vede di quanto sta sforando.

const TOTAL_MS = 10 * 60 * 1000;
const WARN_MS = 2 * 60 * 1000;
const ALERT_MS = 60 * 1000;

const mmss = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;

type Level = 'ok' | 'warn' | 'alert' | 'over';

function levelOf(remainingMs: number): Level {
  if (remainingMs <= 0) return 'over';
  if (remainingMs <= ALERT_MS) return 'alert';
  if (remainingMs <= WARN_MS) return 'warn';
  return 'ok';
}

const STYLE: Record<Level, string> = {
  ok: 'border-line-btn text-ink',
  warn: 'border-[var(--warn)] text-[var(--warn)]',
  alert: 'border-[var(--alert)] text-[var(--alert)]',
  over: 'border-[#c7282d] bg-[#c7282d] text-white motion-safe:animate-pulse',
};

const ANNOUNCE: Record<Level, string> = {
  ok: '',
  warn: 'Restano meno di 2 minuti.',
  alert: 'Resta meno di 1 minuto.',
  over: 'Il tempo è scaduto.',
};

export const PresentationTimer: React.FC = () => {
  const [remaining, setRemaining] = useState(TOTAL_MS);
  const [running, setRunning] = useState(true);
  // Si conta con l'orologio (non con i battiti del timer), così il tempo resta giusto anche se il browser
  // rallenta la pagina quando è in secondo piano. `left` è il tempo che mancava quando si è messo in pausa.
  const endAt = useRef(0);
  const left = useRef(TOTAL_MS);

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left.current;
    const tick = () => setRemaining(endAt.current - Date.now());
    const id = setInterval(tick, 250);
    return () => {
      left.current = endAt.current - Date.now();
      clearInterval(id);
    };
  }, [running]);

  const level = levelOf(remaining);
  const over = remaining <= 0;
  // Mancano: si arrotonda per eccesso (10:00 all'inizio, 0:00 solo a tempo finito). Dopo: +m:ss di ritardo.
  const shown = over
    ? Math.floor(-remaining / 1000) === 0
      ? '0:00'
      : `+${mmss(Math.floor(-remaining / 1000))}`
    : mmss(Math.ceil(remaining / 1000));

  return (
    <>
      {/* data-demo-control: premere il timer non deve fermare la demo */}
      <button
        type="button"
        data-demo-control
        role="timer"
        onClick={() => setRunning((r) => !r)}
        aria-label={`Tempo per presentare: ${shown}${running ? '' : ', in pausa'}. Premi per ${running ? 'mettere in pausa' : 'far ripartire'}.`}
        title={running ? 'Tempo per presentare (10 minuti). Clicca per mettere in pausa.' : 'In pausa. Clicca per far ripartire.'}
        className={`h-10 shrink-0 rounded-full border px-3 sm:px-3.5 flex items-center gap-1.5 font-mono text-[14px] font-semibold tabular-nums transition-colors hover:border-ink ${STYLE[level]} ${running ? '' : 'opacity-60'}`}
      >
        {running ? (
          <Timer className="hidden sm:block w-4 h-4" aria-hidden="true" />
        ) : (
          <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
        )}
        <span>{shown}</span>
      </button>
      {/* chi usa uno screen reader sente solo i momenti importanti, non ogni secondo */}
      <span className="sr-only" role="status" aria-live="polite">
        {ANNOUNCE[level]}
      </span>
    </>
  );
};
