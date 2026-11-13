import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { DemoRunner } from './demo/DemoRunner';
import { UnlockToast } from './components/UnlockToast';
import { HeroSection } from './components/HeroSection';
import { FlappyAILab } from './components/exhibits/FlappyAILab';
import { CPULab } from './components/exhibits/CPULab';
import { PathfindingLab } from './components/exhibits/PathfindingLab';
import { NetworkLab } from './components/exhibits/NetworkLab';
import { VisionLab } from './components/exhibits/VisionLab';
import { CryptoLab } from './components/labs/CryptoLab';
import { MissionReveal } from './components/MissionReveal';
import { SessionRecap } from './components/SessionRecap';
import { FlightPath } from './components/FlightPath';
import { MISSIONS, type Mission, type MissionId } from './missions';
import { sound } from './utils/sound';
import { ArrowDown } from 'lucide-react';

const zero = () => Object.fromEntries(MISSIONS.map((m) => [m.id, 0])) as Record<MissionId, number>;
const none = () => Object.fromEntries(MISSIONS.map((m) => [m.id, false])) as Record<MissionId, boolean>;
const all = () => Object.fromEntries(MISSIONS.map((m) => [m.id, true])) as Record<MissionId, boolean>;

// La corsia del drone cambia lato a ogni prova: il drone parte dalla piazzola dello hero (a destra).
const sideOf = (i: number) => (i % 2 === 0 ? 'right' : 'left');

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [active, setActive] = useState<string>('top');
  const [counts, setCounts] = useState(zero);
  const [revealed, setRevealed] = useState(none);
  const routeRef = useRef<HTMLDivElement>(null);

  // Callback stabili: FlappyAILab riavvia il game loop se onActivity cambia identità.
  const onActivity = useMemo(
    () =>
      Object.fromEntries(
        MISSIONS.map((m) => [m.id, () => setCounts((c) => ({ ...c, [m.id]: c[m.id] + 1 }))]),
      ) as Record<MissionId, () => void>,
    [],
  );

  const handleToggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
  };

  // Demo automatica (demo/): il sito si fa vedere da solo, al massimo in 5 minuti.
  // Con ?demo nell'indirizzo parte da sola; ?demo=3 la fa andare 3 volte più veloce (utile per provarla).
  const [demo, setDemo] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(1);
  const startDemo = useCallback((speed = 1) => {
    setDemoSpeed(speed);
    setDemo(true);
  }, []);
  const stopDemo = useCallback(() => setDemo(false), []);
  const resetProgress = useCallback(() => {
    setCounts(zero());
    setRevealed(none());
  }, []);

  // Prova completata (raggiunte le azioni) ma non ancora decifrata: il menu la segna e compare un avviso.
  const ready = useMemo(
    () => Object.fromEntries(MISSIONS.map((m) => [m.id, counts[m.id] >= m.threshold && !revealed[m.id]])) as Record<MissionId, boolean>,
    [counts, revealed],
  );
  const [toast, setToast] = useState<Mission | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const prevCounts = useRef(counts);
  useEffect(() => {
    const before = prevCounts.current;
    prevCounts.current = counts;
    if (demo) {
      setToast(null); // durante la demo ci pensa il riquadro in basso
      return;
    }
    const justDone = MISSIONS.find((m) => before[m.id] < m.threshold && counts[m.id] >= m.threshold && !revealed[m.id]);
    if (justDone) setToast(justDone);
  }, [counts, revealed, demo]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('demo')) return;
    const n = Number(q.get('demo'));
    const speed = Number.isFinite(n) && n >= 1 ? Math.min(n, 8) : 1;
    // un attimo di pausa: si vede il drone che decolla prima che parta la demo
    const t = setTimeout(() => startDemo(speed), 1800);
    return () => clearTimeout(t);
  }, [startDemo]);

  useEffect(() => {
    const ids = ['top', ...MISSIONS.map((m) => `prova-${m.id}`), 'debriefing'];
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgressPercent(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
      // voce attiva della navbar: l'ultima sezione che ha superato il 40% dello schermo
      let current = 'top';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = id;
      }
      setActive(current);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const labs: Record<MissionId, React.ReactNode> = {
    ai: <FlappyAILab onActivity={onActivity.ai} />,
    path: <PathfindingLab onActivity={onActivity.path} />,
    vision: <VisionLab onActivity={onActivity.vision} />,
    network: <NetworkLab onActivity={onActivity.network} />,
    crypto: <CryptoLab onAction={onActivity.crypto} />,
    cpu: <CPULab onActivity={onActivity.cpu} />,
  };

  const missionSection = (m: Mission, i: number) => (
    <section id={`prova-${m.id}`} className="scroll-mt-[var(--nav-h)] py-[clamp(48px,9vh,96px)]">
      <p className="label flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ${m.dot}`} aria-hidden="true" />
        Prova {m.n} · WP {String(i + 1).padStart(2, '0')}
      </p>
      <h2 className="mt-4 text-[clamp(44px,5.6vw,84px)] font-semibold leading-[0.98] tracking-[-0.045em] [text-wrap:balance]">
        {m.title}
      </h2>
      <p className="mt-4 max-w-2xl text-[clamp(17px,1.4vw,20px)] leading-[1.5] text-muted">{m.teaser}</p>
      <div className="lab mt-10">{labs[m.id]}</div>
      <MissionReveal
        mission={m}
        count={counts[m.id]}
        revealed={revealed[m.id]}
        onReveal={() => setRevealed((r) => ({ ...r, [m.id]: true }))}
      />
    </section>
  );

  const transit = (to: string) => (
    <div className="transit" aria-hidden="true">
      <span className="label bg-[var(--bg)] px-3 py-1 rounded-full">Traversata · verso {to}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#prova-ai"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-paper focus:px-4 focus:py-2 focus:rounded-full"
      >
        Salta alla prima prova
      </a>
      <TopBar
        active={active}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        progressPercent={progressPercent}
        revealed={revealed}
        ready={ready}
        demoActive={demo}
        onToggleDemo={() => (demo ? stopDemo() : startDemo())}
      />
      <UnlockToast mission={toast} onClose={closeToast} />
      <DemoRunner active={demo} speed={demoSpeed} onStop={stopDemo} onReset={resetProgress} onRestart={() => startDemo(demoSpeed)} />

      <main className="flex-1">
        <HeroSection />

        <div ref={routeRef} className="relative">
          <FlightPath wrapRef={routeRef} />

          {MISSIONS.map((m, i) => (
            <React.Fragment key={m.id}>
              {i > 0 && transit(`prova ${m.n}`)}
              <div className="route-row relative" data-side={sideOf(i)}>
                <div>
                  {i === 0 && (
                    <section id="prove" className="scroll-mt-[var(--nav-h)] pt-[clamp(48px,9vh,96px)]">
                      <p className="label">Le sei prove</p>
                      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                        <h2 className="text-[clamp(44px,5.6vw,84px)] font-semibold leading-[0.98] tracking-[-0.045em] max-w-[14ch]">
                          Una rotta, sei tappe.
                        </h2>
                        <p className="max-w-sm text-[17px] text-muted">
                          Il drone ti segue lungo la pagina. In ogni prova usi una tecnologia vera: il nome è scritto
                          sulla scheda, e a fine prova scopri come funziona.
                        </p>
                      </div>
                      <div className="mt-10 grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                        {MISSIONS.map((c) => (
                          <a
                            key={c.id}
                            href={`#prova-${c.id}`}
                            className="group rounded-[24px] bg-surface-2 p-6 flex flex-col gap-3 hover:bg-surface transition-colors"
                          >
                            <span className="label flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} aria-hidden="true" />
                              {c.n}
                            </span>
                            <span className="text-[24px] font-semibold leading-tight tracking-[-0.025em]">{c.title}</span>
                            <span className="text-[15px] leading-relaxed text-muted">{c.teaser}</span>
                            <span className="label mt-auto pt-2 normal-case tracking-normal">
                              Tecnologia: <span className="text-ink">{c.tech}</span>
                            </span>
                          </a>
                        ))}
                      </div>
                      <a href="#prova-ai" className="mt-10 inline-flex items-center gap-2 label hover:text-ink">
                        <ArrowDown className="w-4 h-4" /> Si parte
                      </a>
                    </section>
                  )}
                  {missionSection(m, i)}
                </div>
                <aside className="lane" data-drone-lane="" aria-hidden="true" />
              </div>
            </React.Fragment>
          ))}

          {transit('il debriefing')}
          <div className="route-row relative" data-side={sideOf(MISSIONS.length)}>
            <SessionRecap
              counts={counts}
              revealed={revealed}
              onRevealAll={() => setRevealed(all())}
              onRestartAll={() => {
                setCounts(zero());
                setRevealed(none());
                window.scrollTo({ top: 0, behavior: 'smooth' });
                sound.playSuccess();
              }}
            />
            <aside className="lane" data-drone-lane="" aria-hidden="true">
              {/* seconda H: il drone ci atterra in fondo alla pagina */}
              <div data-drone-landing="" className="absolute inset-x-0 bottom-[6vh] h-[320px]" />
            </aside>
          </div>
        </div>
      </main>

      <footer className="bg-night text-white border-t border-white/10">
        <div className="px-[var(--gutter)] py-12 grid gap-8 md:grid-cols-[1fr_auto_1fr] items-center">
          <div className="text-sm text-white/60">
            <p className="font-semibold text-white text-base tracking-[-0.025em]">Missione KS-01</p>
            <p>Open Day · Istituto Vallauri · Fossano (CN)</p>
            <p className="mt-2">
              Crediti: <span className="text-white">4C Informatica</span> ·{' '}
              <span className="text-white">Kevin Saccato</span> ·{' '}
              <span className="text-white">Emanuel Andru</span>
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">Drone e scena 3D di</span>
            <video
              src="/ks-01/kevin-saccato.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-label="Kevin Saccato"
              className="w-72 h-auto mix-blend-screen contrast-125"
            />
            {/* il nome di Kevin è un video animato; quello di Emanuel è testo con un riflesso cromato simile */}
            <p className="-mt-1 flex items-baseline gap-2.5 font-bold uppercase leading-none tracking-[0.04em]">
              <span className="font-mono text-[12px] font-medium text-white/50" aria-hidden="true">
                &amp;
              </span>
              <span className="bg-linear-to-b from-white via-[#d5dae3] to-[#7b8493] bg-clip-text text-[26px] text-transparent">
                Emanuel Andru
              </span>
            </p>
          </div>
          <div className="text-sm text-white/60 md:text-right">
            <p>Lo stesso drone del sito di Kevin Saccato · three.js</p>
            <a href="#top" className="text-white hover:underline">
              Torna su ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
