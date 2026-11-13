import { MISSIONS, type MissionId } from '../missions';
import { subscribeTelemetry, type DroneState } from '../lib/telemetry';
import { Engine, findButton, section, setNativeValue } from './engine';

// La demo: una scena per la home, una per ogni prova e una per il finale. Ogni scena ha un tempo massimo (budget,
// in secondi): la somma è 286 s, quindi la demo dura al massimo meno di 5 minuti. Di solito le scene finiscono
// prima del loro budget; quello che avanza semplicemente non si usa.
// Il cursore usa i giochi veri: clic sui pulsanti, caselle, disegno sul canvas, testo nel campo. Quando una prova
// ha raggiunto il numero di azioni, compare il pulsante «Decifra» e il cursore lo preme, come farebbe un ragazzo.

export interface SceneInfo {
  label: string;
  budget: number;
}

const BUDGET: Record<'intro' | MissionId | 'finale', number> = {
  intro: 14,
  ai: 52,
  path: 42,
  vision: 36,
  network: 40,
  crypto: 34,
  cpu: 44,
  finale: 24,
};

export const SCENES: SceneInfo[] = [
  { label: 'Apertura', budget: BUDGET.intro },
  ...MISSIONS.map((m) => ({ label: `Prova ${m.n} · ${m.title}`, budget: BUDGET[m.id] })),
  { label: 'Finale', budget: BUDGET.finale },
];

/** Secondi massimi della demo con velocità 1: la somma dei budget. */
export const MAX_SECONDS = SCENES.reduce((sum, s) => sum + s.budget, 0);

const lab = (id: MissionId) => section(id)?.querySelector<HTMLElement>('.lab') ?? null;

// Il pulsante «Decifra» c'è solo quando la prova è sbloccata e non ancora decifrata.
const decifraButton = (id: MissionId) => findButton(section(id), /Decifra/);

/** Preme «Decifra» e fa vedere la spiegazione con il codice. Se la prova non si è sbloccata, passa oltre. */
async function decifra(e: Engine, id: MissionId) {
  const sec = section(id);
  const btn = decifraButton(id);
  if (!sec || !btn) return;
  e.caption('Si è sbloccato «Decifra»: scopriamo cosa abbiamo fatto davvero.');
  await e.click(btn, 700);
  const pre = await e.waitFor(() => sec.querySelector('pre'), 3000);
  if (!pre?.parentElement) return;
  e.caption("Ecco il codice che c'è dietro, in poche righe.");
  await e.scrollToEl(pre.parentElement, 1500, 'center');
  await e.sleep(4500);
}

/** Aspetta una condizione cambiando la didascalia ogni tanto, così la pagina non sembra ferma. */
async function waitWithCaptions(e: Engine, cond: () => unknown, maxMs: number, lines: string[], everyMs = 6000) {
  const t0 = e.now();
  let shown = 0;
  return e.waitFor(
    () => {
      const spent = e.now() - t0;
      if (shown < lines.length && spent >= shown * everyMs) e.caption(lines[shown++]);
      return cond();
    },
    maxMs,
    250,
  );
}

// ───────── scene ─────────

async function intro(e: Engine) {
  await e.scrollTo(0, 1200);
  e.caption('Questo drone non sa fare niente. In pochi minuti gli insegniamo a volare.');

  let drone: DroneState | null = null;
  const off = subscribeTelemetry((r) => {
    drone = r.drone;
  });
  e.defer(off);
  await e.sleep(2500);

  const d = drone as DroneState | null;
  // il drone si può prendere solo nella home e solo dove la scena 3D lo disegna (non su telefono)
  if (d && d.rx > 0 && !d.still) {
    e.caption('Nella home puoi prendere il drone e spostarlo.');
    const to = {
      x: Math.min(window.innerWidth - 120, Math.max(120, d.x - 150)),
      y: Math.min(window.innerHeight - 200, Math.max(160, d.y + 40)),
    };
    await e.dragDrone({ x: d.x, y: d.y }, to);
    await e.sleep(1200);
  }

  e.caption('Sei prove, una dopo l’altra. Si parte con la prima.');
  const go = findButton(document.getElementById('top'), /Accendi i motori/);
  if (go) await e.pressOnly(go);
}

async function aiScene(e: Engine) {
  const sec = section('ai');
  const box = lab('ai');
  if (!sec || !box) return;
  e.caption('Prova 1 · Venti droni appena accesi: nessuno sa volare.');
  await e.scrollToEl(box, 1800, 'center');
  await e.sleep(1800);

  const fast = findButton(box, /^5x$/);
  if (fast) {
    e.caption('Acceleriamo: ogni schianto insegna qualcosa ai droni dopo.');
    await e.click(fast);
  }
  await waitWithCaptions(e, () => decifraButton('ai'), 30000, [
    'I droni migliori passano il loro cervello a quelli dopo.',
    'Ogni generazione è un po’ più brava della precedente.',
    'Dopo qualche generazione imparano a evitare i palazzi.',
  ]);

  // se i droni non hanno fatto abbastanza generazioni, anche «ricomincia» conta come azione
  const restart = box.querySelector<HTMLElement>('[aria-label="Ricomincia con droni nuovi"]');
  for (let i = 0; i < 3 && restart && !decifraButton('ai'); i++) await e.click(restart, 500);

  await decifra(e, 'ai');
}

async function pathScene(e: Engine) {
  const box = lab('path');
  if (!box) return;
  e.caption('Prova 2 · Costruiamo dei palazzi: il drone deve trovare la strada più corta.');
  await e.scrollToEl(box, 1800, 'center');
  await e.sleep(1000);

  // la mappa: una casella per pulsante, con aria-label «Cella riga,colonna»
  const cells = Array.from(box.querySelectorAll<HTMLElement>('button[aria-label^="Cella "]'));
  const pos = (b: HTMLElement) => {
    const m = /Cella (\d+),(\d+)/.exec(b.getAttribute('aria-label') ?? '');
    return m ? { r: Number(m[1]), c: Number(m[2]) } : { r: 0, c: 0 };
  };
  const byPos = new Map(cells.map((b) => [`${pos(b).r},${pos(b).c}`, b]));
  const rows = Math.max(...cells.map((b) => pos(b).r)) + 1;
  const start = cells.find((b) => b.querySelector('svg'));
  const end = cells.find((b) => (b.textContent ?? '').trim() === 'H');
  const launch = findButton(box, /Lancia il drone/);
  if (!start || !end || !launch) return;

  const s = pos(start);
  const t = pos(end);
  const wallCol = Math.round((s.c + t.c) / 2);
  const top = Math.max(0, s.r - 3);
  const bottom = Math.min(rows - 1, s.r + 2);
  const wall: HTMLElement[] = [];
  for (let r = top; r <= bottom; r++) {
    const b = byPos.get(`${r},${wallCol}`);
    if (b) wall.push(b);
  }
  const gap = byPos.get(`${bottom + 1},${wallCol}`) ?? byPos.get(`${top - 1},${wallCol}`);

  for (const b of wall) await e.click(b, 120);

  const explored = () => /Lunghezza rotta/.test(box.textContent ?? '');
  const idle = async () => {
    await e.sleepReal(500);
    await e.waitFor(() => !(launch as HTMLButtonElement).disabled, 15000);
  };

  e.caption('Il drone esplora i quadretti e trova la strada più corta.');
  await e.click(launch, 300);
  await e.waitFor(explored, 15000);
  await idle();
  await e.sleep(2200);

  if (gap) {
    e.caption('Proviamo a chiudergli la strada…');
    await e.click(gap, 300);
    await e.click(launch, 300);
    await idle();
    e.caption('Se c’è un’altra via la trova, anche più lunga.');
    await e.sleep(3000);
  }
  await decifra(e, 'path');
}

async function visionScene(e: Engine) {
  const box = lab('vision');
  const canvas = box?.querySelector<HTMLElement>('canvas');
  if (!box || !canvas) return;
  e.caption('Prova 3 · Per il drone una foto è solo una tabella di numeri.');
  await e.scrollToEl(box, 1800, 'center');
  await e.sleep(1200);

  e.caption('Disegniamo sulla ripresa: il drone la guarda pixel per pixel.');
  await e.draw(canvas, [
    [0.2, 0.82],
    [0.2, 0.46],
    [0.5, 0.2],
    [0.8, 0.46],
    [0.8, 0.82],
    [0.2, 0.82],
  ]);
  await e.draw(canvas, [
    [0.42, 0.82],
    [0.42, 0.6],
    [0.58, 0.6],
    [0.58, 0.82],
  ]);
  await e.sleep(1500);

  e.caption('Con una griglia 3×3 il drone cambia il modo di vedere la stessa immagine.');
  for (const name of [/^Sfocatura$/, /^Nitidezza$/, /^Rilievo$/]) {
    const b = findButton(box, name);
    if (b) await e.click(b, 1600);
  }
  await decifra(e, 'vision');
}

async function networkScene(e: Engine) {
  const box = lab('network');
  const input = box?.querySelector<HTMLInputElement>('#net-msg-input');
  const send = findButton(box, /Trasmetti/);
  if (!box || !input || !send) return;
  e.caption('Prova 4 · Il messaggio viaggia a pezzi numerati.');
  await e.scrollToEl(box, 1800, 'center');
  await e.sleep(1000);

  e.clear(input);
  await e.type(input, 'CIAO BASE', 80);
  await e.sleep(500);

  e.caption('Il cursore prova a sabotare il segnale: distrugge qualche pezzo.');
  await e.click(send, 100);
  for (let i = 0; i < 2; i++) {
    const flying = box.querySelectorAll<HTMLElement>('button[title^="Clicca per distruggere"]');
    const target = flying[flying.length - 1];
    if (!target) break;
    await e.click(target, 200);
  }

  e.caption('La base se ne accorge e chiede di rimandare i pezzi mancanti. Così arriva tutto.');
  await e.sleepReal(600);
  await e.waitFor(() => {
    const b = findButton(box, /Trasmetti/) as HTMLButtonElement | null;
    return b && !b.disabled;
  }, 20000);
  await e.sleep(2500);
  await decifra(e, 'network');
}

async function cryptoScene(e: Engine) {
  const box = lab('crypto');
  const input = box?.querySelector<HTMLInputElement>('#crypto-pw-input');
  if (!box || !input) return;
  e.caption('Prova 5 · Scegli la chiave: il pirata prova tutte le combinazioni.');
  await e.scrollToEl(box, 1800, 'center');
  await e.sleep(1000);

  e.clear(input);
  await e.type(input, 'ciao', 130);
  e.caption('Una chiave corta si scopre subito.');
  await e.sleep(2500);

  const weak = findButton(box, /^password$/);
  if (weak) await e.click(weak, 2200);

  e.caption('Una chiave lunga e strana: servono secoli per indovinarla.');
  const strong = findButton(box, /^c4vallo-batteria-luna-42$/);
  if (strong) await e.click(strong, 2800);

  e.caption('Cambia UNA sola lettera: l’impronta cambia quasi tutta.');
  await e.moveToEl(input);
  e.press();
  const v = input.value;
  setNativeValue(input, v.slice(0, -1));
  await e.sleep(500);
  setNativeValue(input, `${v.slice(0, -1)}3`);
  await e.sleep(3000);
  await decifra(e, 'crypto');
}

async function cpuScene(e: Engine) {
  const box = lab('cpu');
  const step = findButton(box, /Passo singolo/);
  if (!box || !step) return;
  e.caption('Prova 6 · Il chip del drone, al rallentatore.');
  await e.scrollToEl(box, 1800, 'center');
  await e.sleep(1200);

  const stages = [
    'FETCH: il chip preleva un’istruzione dalla memoria.',
    'DECODE: capisce cosa deve fare.',
    'EXECUTE: la esegue. Poi si ricomincia.',
  ];
  for (let i = 0; i < 6; i++) {
    e.caption(stages[i % 3]);
    await e.click(step, 1000);
  }

  const run = findButton(box, /^Avvia$/);
  if (run) {
    e.caption('Ora lo lasciamo andare da solo.');
    await e.click(run, 300);
    await e.waitFor(() => findButton(box, /^Avvia$/), 9000);
    const stop = findButton(box, /^Stop$/);
    if (stop) await e.click(stop, 300);
  }

  const other = findButton(box, /Batteria/);
  if (other) {
    e.caption('Un altro programma: stavolta una sottrazione.');
    await e.click(other, 800);
    for (let i = 0; i < 3; i++) await e.click(step, 900);
  }
  await decifra(e, 'cpu');
}

async function finale(e: Engine) {
  const deb = document.getElementById('debriefing');
  if (!deb) return;
  e.caption('Ok, ti dobbiamo una confessione: ogni prova ha un nome vero.');
  await e.scrollToEl(deb, 2000, 'start');
  await e.sleep(3500);

  const all = findButton(deb, /Rivela tutto/);
  if (all) {
    e.caption('Anche quelle che non abbiamo decifrato si aprono.');
    await e.click(all, 600);
  }
  await e.waitFor(() => (deb.textContent ?? '').includes('Informatica.'), 4000);
  e.caption('Tutto insieme si chiama Informatica.');
  await e.sleep(3800);

  e.caption('Il drone atterra. Il prossimo lo programmi tu.');
  await e.scrollTo(document.documentElement.scrollHeight, 4500);
  await e.sleep(2500);
}

// ───────── la demo intera ─────────

/** Esegue tutte le scene in ordine. Dura al massimo MAX_SECONDS (con velocità 1). */
export async function runDemo(e: Engine) {
  await e.runScene(SCENES[0].label, SCENES[0].budget, () => intro(e));
  const byId: Record<MissionId, (e: Engine) => Promise<void>> = {
    ai: aiScene,
    path: pathScene,
    vision: visionScene,
    network: networkScene,
    crypto: cryptoScene,
    cpu: cpuScene,
  };
  for (let i = 0; i < MISSIONS.length; i++) {
    const id = MISSIONS[i].id;
    await e.runScene(SCENES[i + 1].label, SCENES[i + 1].budget, () => byId[id](e));
  }
  const last = SCENES[SCENES.length - 1];
  await e.runScene(last.label, last.budget, () => finale(e));
}
