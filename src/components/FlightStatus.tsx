import { useEffect, useRef, useState } from 'react';
import { hero, telemetry } from '../missions';
import { formatAlt, subscribeTelemetry, type Status } from '../lib/telemetry';
import styles from './FlightStatus.module.css';

// pallino: spento, motori accesi (lampeggia), in volo (onda), a terra dopo l'atterraggio
const DOT: Record<Status, string> = {
  off: 'off',
  armed: 'armed',
  takeoff: 'flight',
  flight: 'flight',
  crossing: 'flight',
  manual: 'flight',
  landing: 'flight',
  landed: 'landed',
};

/**
 * Riga sotto la piazzola dello hero. Finché la scena 3D non parte (o se non può partire) mostra il testo fisso del
 * decollo; poi segue il drone: motori accesi, decollo con la quota che sale, in volo. Per i lettori di schermo resta
 * il testo fisso: i numeri che cambiano sono solo da vedere.
 */
export default function FlightStatus() {
  // prima lettura: da qui in poi i testi si aggiornano direttamente, senza rendere di nuovo il componente
  const [first, setFirst] = useState<{ status: Status; alt: number } | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let started = false;
    let next = 0;
    let shown: Status | null = null;
    return subscribeTelemetry((r) => {
      if (!started) {
        started = true;
        setFirst({ status: r.status, alt: r.alt });
      }
      // numeri aggiornati dieci volte al secondo, così si leggono; lo stato cambia subito
      if (r.status === shown && r.drone.t < next) return;
      next = r.drone.t + 0.1;
      if (r.status !== shown && statusRef.current && rootRef.current) {
        shown = r.status;
        statusRef.current.textContent = telemetry.status[r.status];
        rootRef.current.dataset.state = DOT[r.status];
      }
      if (altRef.current) altRef.current.textContent = formatAlt(r.alt);
    });
  }, []);

  return (
    <span
      ref={rootRef}
      className={styles.status}
      data-state={first ? DOT[first.status] : 'flight'}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className="sr-only">{hero.takeoff}</span>
      {first ? (
        <span aria-hidden="true">
          <span ref={statusRef} className={styles.part}>
            {telemetry.status[first.status]}
          </span>
          {' · '}
          <span className={styles.part}>
            {'ALT '}
            <span ref={altRef} className={styles.num}>
              {formatAlt(first.alt)}
            </span>
          </span>
          {' · '}
          <span className={styles.part}>{hero.coords}</span>
        </span>
      ) : (
        <span aria-hidden="true">{hero.takeoff}</span>
      )}
    </span>
  );
}
