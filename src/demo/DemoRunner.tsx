import React, { useEffect, useRef, useState } from 'react';
import { Engine, type CursorApi } from './engine';
import { MAX_SECONDS, SCENES, runDemo } from './script';

// Demo automatica: il sito si fa vedere da solo. Un cursore immaginario scorre la pagina e usa le prove (script.ts),
// mentre un riquadro in basso racconta cosa succede. Dura al massimo 5 minuti.
//
// Si ferma con «Stop», con Esc, oppure appena il visitatore usa davvero la pagina (rotellina, dito, tastiera, clic):
// gli eventi veri hanno isTrusted = true, quelli della demo no. Il semplice movimento del mouse non la ferma.

interface DemoRunnerProps {
  active: boolean;
  /** 1 = normale. Con ?demo=3 nell'indirizzo la demo va 3 volte più veloce. */
  speed: number;
  onStop: () => void;
  /** A ogni avvio: si riparte da capo, così «Decifra» compare quando deve. */
  onReset: () => void;
  onRestart: () => void;
}

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Ai primi istanti si ignora l'input vero: la rotellina del tocco che ha premuto «Demo» non deve fermarla.
const GRACE_MS = 900;

export const DemoRunner: React.FC<DemoRunnerProps> = ({ active, speed, onStop, onReset, onRestart }) => {
  const cursorEl = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const stopRef = useRef<(() => void) | null>(null);
  const cb = useRef({ onStop, onReset });
  cb.current = { onStop, onReset };

  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [caption, setCaption] = useState('');
  const [scene, setScene] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const sceneStart = useRef(0);

  useEffect(() => {
    if (!active) return;
    const el = cursorEl.current;
    if (!el) return;

    let pressTimer: ReturnType<typeof setTimeout> | undefined;
    const move = (x: number, y: number) => {
      pos.current = { x, y };
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const cursor: CursorApi = {
      move,
      pos: () => pos.current,
      show: (on) => {
        el.dataset.on = String(on);
      },
      press: () => {
        clearTimeout(pressTimer);
        el.dataset.press = 'false';
        void el.offsetWidth; // riparte l'animazione anche se si preme due volte di fila
        el.dataset.press = 'true';
        pressTimer = setTimeout(() => {
          el.dataset.press = 'false';
        }, 480);
      },
    };

    const t0 = performance.now();
    sceneStart.current = t0;
    setPhase('running');
    setCaption('');
    setScene(0);
    setElapsed(0);
    cb.current.onReset();
    move(window.innerWidth * 0.62, window.innerHeight * 0.55);
    cursor.show(true);

    const engine = new Engine({
      speed,
      cursor,
      onCaption: setCaption,
      onScene: (i) => {
        sceneStart.current = performance.now();
        setScene(i);
      },
      onEnd: (reason) => {
        cursor.show(false);
        setPhase(reason === 'done' ? 'done' : 'idle');
        cb.current.onStop();
      },
    });
    stopRef.current = () => engine.stop('stopped');

    // limite assoluto: mai oltre i 5 minuti, anche se qualcosa nelle scene andasse storto
    const hardCap = setTimeout(() => engine.stop('timeout'), (MAX_SECONDS + 14) * 1000 / speed);
    const tick = setInterval(() => setElapsed(performance.now() - t0), 250);

    const armedAt = performance.now() + GRACE_MS;
    const onUser = (ev: Event) => {
      if (!ev.isTrusted || performance.now() < armedAt) return;
      // i controlli della demo (Stop, il pulsante «Demo» in alto) hanno il loro clic
      if (ev.target instanceof Element && ev.target.closest('[data-demo-control]')) return;
      if (ev.type === 'keydown') {
        const k = (ev as KeyboardEvent).key;
        if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta') return;
      }
      engine.stop('stopped');
    };
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    events.forEach((t) => window.addEventListener(t, onUser, { capture: true, passive: true }));

    runDemo(engine)
      .then(() => engine.finish('done'))
      .catch((err) => {
        // Cancelled = l'ha fermata qualcuno: normale. Altri errori: si chiude comunque, senza lasciare il cursore a metà.
        if (!engine.isStopped()) {
          console.error('Demo automatica:', err);
          engine.stop('stopped');
        }
      });

    return () => {
      clearTimeout(hardCap);
      clearTimeout(pressTimer);
      clearInterval(tick);
      events.forEach((t) => window.removeEventListener(t, onUser, { capture: true }));
      stopRef.current = null;
      engine.stop('stopped');
    };
  }, [active, speed]);

  // il riquadro «Demo finita» sparisce da solo
  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(() => setPhase('idle'), 14000);
    return () => clearTimeout(t);
  }, [phase]);

  const budget = SCENES[Math.min(scene, SCENES.length - 1)].budget * 1000;
  const sceneFrac = Math.min(0.95, ((performance.now() - sceneStart.current) * speed) / budget);

  return (
    <>
      <div ref={cursorEl} className="demo-cursor" data-on="false" data-press="false" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24">
          <path d="M3 2l7.5 19 2.6-7.9L21 10.5 3 2z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>

      {phase !== 'idle' && (
        <div data-demo-control className="fixed inset-x-0 bottom-4 z-[65] flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-[640px] rounded-[22px] border border-white/10 bg-night/95 px-5 py-4 text-white shadow-2xl backdrop-blur">
            {phase === 'running' ? (
              <>
                <p role="status" aria-live="polite" className="min-h-[46px] text-[16px] leading-snug">
                  {caption || 'Si parte…'}
                </p>
                <div className="mt-3 flex gap-1" aria-hidden="true">
                  {SCENES.map((s, i) => (
                    <span key={s.label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                      <span
                        className="block h-full bg-pad"
                        style={{ width: i < scene ? '100%' : i === scene ? `${Math.round(sceneFrac * 100)}%` : '0%' }}
                      />
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--rec)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] uppercase tracking-[0.08em] text-white/70">
                    Demo · {SCENES[Math.min(scene, SCENES.length - 1)].label}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-white/70">{mmss(elapsed)}</span>
                  <button
                    type="button"
                    onClick={() => stopRef.current?.()}
                    className="shrink-0 rounded-full bg-white px-4 py-1.5 text-[14px] font-semibold text-[#111] hover:bg-white/85"
                  >
                    Stop
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[16px]">
                  Demo finita <span className="text-white/60">· {mmss(elapsed)}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onRestart}
                    className="rounded-full bg-white px-4 py-1.5 text-[14px] font-semibold text-[#111] hover:bg-white/85"
                  >
                    Rifai la demo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase('idle')}
                    className="rounded-full border border-white/25 px-4 py-1.5 text-[14px] font-semibold hover:border-white/60"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
