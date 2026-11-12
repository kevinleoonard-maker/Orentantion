import { useEffect, useState, type RefObject } from 'react';
import { readLanes, routeAt } from '../lib/route';

const ROUTE_QUERY = '(min-width: 1100px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

type Geo = { d: string; w: number; h: number; wps: { x: number; y: number; label: string }[] };

/**
 * Piano di volo tratteggiato sulla pagina (solo desktop). Il drone sta a metà schermo e la sua x dipende dalla quota
 * di pagina sotto di lui (lib/route.js): in coordinate di pagina la sua rotta è proprio la linea x = routeAt(y),
 * e qui la si disegna con la stessa funzione. Un waypoint all'inizio di ogni corsia.
 */
export function FlightPath({ wrapRef }: { wrapRef: RefObject<HTMLElement | null> }) {
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const query = window.matchMedia(ROUTE_QUERY);

    const measure = () => {
      if (!query.matches) return setGeo(null);
      const sy = window.scrollY;
      const lanes = readLanes(wrap.querySelectorAll('[data-drone-lane]'), sy);
      const landing = wrap.querySelector('[data-drone-landing]')?.getBoundingClientRect();
      if (!lanes.length || !landing) return setGeo(null);
      const box = wrap.getBoundingClientRect();
      const ox = box.left;
      const oy = box.top + sy;
      const end = landing.top + sy + landing.height * 0.6;
      const rp = {} as { x: number };
      const pts: string[] = [];
      for (let P = lanes[0].top; P <= end; P += 6) {
        routeAt(P, lanes, rp);
        pts.push(`${(rp.x - ox).toFixed(1)} ${(P - oy).toFixed(1)}`);
      }
      setGeo({
        d: `M${pts.join(' L')}`,
        w: box.width,
        h: box.height,
        wps: lanes.map((l, i) => ({ x: l.x - ox, y: l.top - oy, label: `WP ${String(i + 1).padStart(2, '0')}` })),
      });
    };

    measure();
    // le prove cambiano altezza (rivelazioni, schermi che si aprono): si ridisegna quando cambia il contenitore
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    window.addEventListener('resize', measure);
    query.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      query.removeEventListener('change', measure);
    };
  }, [wrapRef]);

  if (!geo) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg width={geo.w} height={geo.h} className="absolute inset-0 overflow-visible">
        <path d={geo.d} fill="none" stroke="var(--line-btn)" strokeWidth={2} strokeDasharray="8 10" />
      </svg>
      {geo.wps.map((wp) => (
        <span key={wp.label} className="wp" style={{ left: wp.x, top: wp.y }}>
          <span>{wp.label}</span>
        </span>
      ))}
    </div>
  );
}
