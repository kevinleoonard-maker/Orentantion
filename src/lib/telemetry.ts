import { telemetry } from '../missions';

/** Stato del drone a ogni fotogramma, passato dalla scena 3D (lib/drone-scene.js, opzione onTelemetry). */
export type DroneState = {
  t: number; // secondi dall'avvio della scena
  takeoff: number; // decollo, da 0 a 1
  hover: number; // quota sopra la piazzola dello hero, da 0 a 1
  motors: boolean; // eliche che girano
  away: number; // quanto è lontano dalla piazzola dello hero (rotta o posizione scelta a mano), da 0 a 1
  land: number; // discesa sulla seconda H accanto ai contatti, da 0 a 1
  crossing: number; // avanzamento nel passaggio centrale, da 0 a 1
  climb: number; // salita ad arco del passaggio centrale, da 0 a 1
  manual: boolean; // preso o lasciato a mano
  route: boolean; // segue la rotta della pagina (desktop)
  still: boolean; // prefers-reduced-motion
  scroll: number;
  range: number; // scorrimento massimo della pagina
  x: number; // sagoma del drone sullo schermo: centro e raggi in px
  y: number;
  rx: number;
  ry: number;
};

export type Status = keyof typeof telemetry.status;

/** Letture della strumentazione, calcolate una volta per fotogramma e condivise da riga dello hero ed etichetta. */
export type Readings = {
  status: Status;
  alt: number; // m
  vel: number; // m/s
  dist: number; // m dal punto di decollo
  batt: number; // %
  rec: number; // secondi di volo
  tag: number; // visibilità dell'etichetta che segue il drone, da 0 a 1
  drone: DroneState;
};

type Listener = (r: Readings) => void;
const listeners = new Set<Listener>();
// fotogramma precedente (solo i valori che servono, senza allocare a ogni fotogramma)
let last: { t: number; scroll: number; land: number } | null = null;
let vel = 0;
let maxProgress = 0;
let rec = 0;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

const readings = {} as Readings; // riusato a ogni fotogramma

function read(d: DroneState): Readings {
  const dt = last ? clamp(d.t - last.t, 0, 0.1) : 0;
  const p = d.range > 0 ? clamp(d.scroll / d.range, 0, 1) : 0;
  const flying = !d.still && d.takeoff > 0 && d.land < 0.97;

  // quota: 30 m sopra la piazzola, poi sale con la pagina e nella traversata, sempre sotto i 120 m della
  // categoria Open; scende a 0 sulla seconda H
  const wobble = d.still ? 0 : Math.sin(d.t * 1.6) * 0.4;
  const cruise = 30 + 50 * p + 25 * d.climb;
  const alt = Math.max(0, (30 * d.hover + d.away * (cruise - 30) + wobble * d.hover) * (1 - d.land));

  // velocità orizzontale: dallo scorrimento mentre il drone segue la pagina (900 px/s ≈ 10 m/s, al massimo 16 m/s)
  const speed = last && dt > 0 ? Math.abs(d.scroll - last.scroll) / dt : 0;
  const target = d.route && flying ? Math.min(16, speed / 90) * d.away : 0;
  vel += (target - vel) * Math.min(1, dt * 5);

  if (d.route && flying) maxProgress = Math.max(maxProgress, p);
  if (flying && d.motors) rec += dt;

  let status: Status;
  if (d.still) status = 'flight';
  // motori accesi finché il drone non si stacca davvero dalla piazzola (sotto mezzo metro)
  else if (d.takeoff < 1 && d.hover < 0.02) status = d.motors ? 'armed' : 'off';
  else if (d.takeoff < 1) status = 'takeoff';
  else if (d.manual) status = 'manual';
  else if (d.land >= 0.97) status = 'landed';
  else if (d.land > 0.02) status = last && d.land < last.land - 1e-4 ? 'takeoff' : 'landing';
  else if (d.crossing > 0 && d.crossing < 1) status = 'crossing';
  else status = 'flight';

  if (last) {
    last.t = d.t;
    last.scroll = d.scroll;
    last.land = d.land;
  } else {
    last = { t: d.t, scroll: d.scroll, land: d.land };
  }
  readings.status = status;
  readings.alt = alt;
  readings.vel = vel < 0.05 ? 0 : vel;
  readings.dist = d.away * p * 1250;
  // la batteria non si ricarica tornando su: scende con la strada fatta e con il tempo di volo
  readings.batt = clamp(Math.round(100 - 24 * maxProgress - rec / 45), 12, 100);
  readings.rec = rec;
  readings.tag = d.route ? smooth(clamp(Math.max(d.away, d.manual ? 1 : 0), 0, 1)) : 0;
  readings.drone = d;
  return readings;
}

/** Chiamata dalla scena 3D a ogni fotogramma. */
export function publishTelemetry(d: DroneState) {
  if (!listeners.size) return;
  const r = read(d);
  listeners.forEach((l) => l(r));
}

export function subscribeTelemetry(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const formatAlt = (m: number) => `${m.toFixed(1)} m`;
export const formatVel = (v: number) => `${v.toFixed(1)} m/s`;
export const formatDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
export const formatRec = (s: number) => {
  const t = Math.floor(s);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
