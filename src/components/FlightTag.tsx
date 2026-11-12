import { useEffect, useRef } from 'react';
import { telemetry } from '../missions';
import { formatAlt, formatDist, formatRec, formatVel, subscribeTelemetry, type Status } from '../lib/telemetry';
import styles from './FlightTag.module.css';

const DESKTOP_QUERY = '(min-width: 1100px) and (pointer: fine)';
const GAP = 18; // distanza fra etichetta e drone, occupata dalla linea che li collega

/**
 * Etichetta di volo agganciata al drone su desktop, come il cartellino di un aereo sul radar: stato, tempo di
 * registrazione, quota, velocità, distanza dal decollo e batteria. Compare quando il drone lascia la piazzola e lo
 * segue nei corridoi fino all'atterraggio accanto ai contatti. Solo da vedere: aria-hidden, nessun clic.
 * Posizione a ogni fotogramma (solo transform), testi dieci volte al secondo.
 */
export default function FlightTag() {
  const ref = useRef<HTMLDivElement>(null);
  const leaderRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const recRef = useRef<HTMLSpanElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const battRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const leader = leaderRef.current;
    if (!el || !leader) return;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    let w = 0;
    let h = 0;
    let vw = 0;
    let navH = 0;
    let visible = false;
    let next = 0;
    let shown: Status | null = null;

    // misure lette solo quando l'etichetta compare e quando cambia la finestra, mai a ogni fotogramma
    const measure = () => {
      w = el.offsetWidth;
      h = el.offsetHeight;
      vw = document.documentElement.clientWidth;
      navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
    };
    const onResize = () => {
      if (visible) measure();
    };
    window.addEventListener('resize', onResize);

    const unsubscribe = subscribeTelemetry((r) => {
      const o = desktop.matches ? r.tag : 0;
      if (o < 0.01) {
        if (visible) {
          visible = false;
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
        }
        return;
      }
      if (!visible) {
        visible = true;
        el.style.visibility = 'visible';
        measure();
      }

      // sopra il drone; sotto se in alto finirebbe sotto la navbar
      const { x, y, ry } = r.drone;
      let top = y - ry - GAP - h;
      const below = top < navH + 8;
      if (below) top = y + ry + GAP;
      const left = Math.min(vw - w - 8, Math.max(8, x - w / 2));
      el.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      el.style.opacity = o.toFixed(3);
      leader.style.transform = `translate3d(${(x - left).toFixed(1)}px, ${below ? -GAP : h}px, 0)`;

      if (r.status === shown && r.drone.t < next) return;
      next = r.drone.t + 0.1;
      if (r.status !== shown) {
        shown = r.status;
        if (statusRef.current) statusRef.current.textContent = telemetry.status[r.status];
        el.dataset.state = r.status;
      }
      if (recRef.current) recRef.current.textContent = formatRec(r.rec);
      if (altRef.current) altRef.current.textContent = formatAlt(r.alt);
      if (velRef.current) velRef.current.textContent = formatVel(r.vel);
      if (distRef.current) distRef.current.textContent = formatDist(r.dist);
      if (battRef.current) battRef.current.textContent = `${r.batt}%`;
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={ref} className={styles.tag} aria-hidden="true">
      <span ref={leaderRef} className={styles.leader} />
      <div className={styles.head}>
        <span className={styles.drone}>{telemetry.drone}</span>
        <span className={styles.rec}>
          <span className={styles.recDot} />
          REC <span ref={recRef}>00:00</span>
        </span>
      </div>
      <span ref={statusRef} className={styles.state}>
        {telemetry.status.flight}
      </span>
      <div className={styles.grid}>
        <span className={styles.key}>ALT</span>
        <span ref={altRef} className={styles.value}>
          0.0 m
        </span>
        <span className={styles.key}>VEL</span>
        <span ref={velRef} className={styles.value}>
          0.0 m/s
        </span>
        <span className={styles.key}>DIST</span>
        <span ref={distRef} className={styles.value}>
          0 m
        </span>
        <span className={styles.key}>BATT</span>
        <span ref={battRef} className={styles.value}>
          100%
        </span>
      </div>
    </div>
  );
}
