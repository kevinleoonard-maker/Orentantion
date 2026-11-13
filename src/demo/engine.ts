// Motore della demo automatica: scorre la pagina, muove un cursore immaginario e usa i giochi come farebbe una
// persona. Non tocca i componenti: manda gli stessi eventi del browser (clic, input, puntatore) agli elementi veri,
// quindi i giochi reagiscono come se li usasse qualcuno. Gli eventi creati da script hanno isTrusted = false:
// così la demo distingue i propri da quelli veri del visitatore (che la fermano).
//
// Tempo massimo: ogni scena ha un budget (runScene). Se lo supera viene interrotta e si passa alla successiva.
// La somma dei budget è sotto i 5 minuti, quindi la demo non può durare di più, qualunque cosa faccia la simulazione.

export class Cancelled extends Error {}
export class SceneTimeout extends Error {}

export interface CursorApi {
  move(x: number, y: number): void;
  press(): void;
  show(on: boolean): void;
  pos(): { x: number; y: number };
}

export interface EngineOptions {
  /** 1 = normale. Più alto = più veloce (serve per provare la demo senza aspettare 5 minuti). */
  speed: number;
  cursor: CursorApi;
  onCaption: (text: string) => void;
  onScene: (index: number, label: string) => void;
  /** Chiamata una sola volta, quando la demo finisce o viene fermata. */
  onEnd: (reason: 'done' | 'stopped' | 'timeout') => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Spazio in alto occupato dalla barra e in basso dal riquadro della demo: i bersagli restano fuori da entrambi.
const TOP_SAFE = 72 + 36;
const BOTTOM_SAFE = 150;

export class Engine {
  readonly speed: number;
  private cursor: CursorApi;
  private opts: EngineOptions;
  private stopped = false;
  private ended = false;
  private sceneDeadline = Infinity;
  private timers = new Set<{ t: ReturnType<typeof setTimeout>; reject: (e: Error) => void }>();
  private cleanups: Array<() => void> = [];
  private bend = 1;
  private sceneIndex = -1;

  constructor(opts: EngineOptions) {
    this.opts = opts;
    this.cursor = opts.cursor;
    this.speed = Math.max(0.25, opts.speed);
  }

  now() {
    return performance.now();
  }

  /** Lancia l'eccezione giusta se la demo è stata fermata o la scena ha finito il suo tempo. */
  check() {
    if (this.stopped) throw new Cancelled();
    if (this.now() > this.sceneDeadline) throw new SceneTimeout();
  }

  /** Ferma tutto subito: nessuna azione parte dopo questa chiamata. */
  stop(reason: 'stopped' | 'timeout' = 'stopped') {
    this.stopped = true;
    this.timers.forEach(({ t, reject }) => {
      clearTimeout(t);
      reject(new Cancelled());
    });
    this.timers.clear();
    this.runCleanups();
    this.cursor.show(false);
    this.finish(reason);
  }

  finish(reason: 'done' | 'stopped' | 'timeout') {
    if (this.ended) return;
    this.ended = true;
    this.opts.onEnd(reason);
  }

  isStopped() {
    return this.stopped;
  }

  // ───────── tempo ─────────

  /** Pausa di `ms` (accorciata dalla velocità). Si ferma subito se la demo viene fermata. */
  sleep(ms: number) {
    return this.sleepReal(ms / this.speed);
  }

  /** Pausa in millisecondi veri, senza velocità: per aspettare cose che accadono nel gioco. */
  sleepReal(ms: number) {
    this.check();
    const wait = Math.max(0, Math.min(ms, this.sceneDeadline - this.now()));
    return new Promise<void>((resolve, reject) => {
      const entry = {
        t: setTimeout(() => {
          this.timers.delete(entry);
          try {
            this.check();
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        }, wait),
        reject,
      };
      this.timers.add(entry);
    });
  }

  /** Aspetta che `fn` dia un valore vero. Restituisce null se non succede entro `maxMs` (tempo del gioco). */
  async waitFor<T>(fn: () => T | null | undefined | false, maxMs: number, pollMs = 120): Promise<T | null> {
    const end = this.now() + maxMs;
    for (;;) {
      const v = fn();
      if (v) return v;
      if (this.now() >= end) return null;
      await this.sleepReal(pollMs);
    }
  }

  /** Animazione a fotogrammi: chiama `step(t)` con t da 0 a 1 per `ms` (accorciato dalla velocità). */
  private animate(ms: number, step: (t: number) => void) {
    const duration = Math.max(1, ms / this.speed);
    return new Promise<void>((resolve, reject) => {
      const t0 = this.now();
      const frame = () => {
        try {
          this.check();
        } catch (e) {
          return reject(e as Error);
        }
        const t = clamp((this.now() - t0) / duration, 0, 1);
        step(t);
        if (t >= 1) return resolve();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  // ───────── scene ─────────

  /** Esegue una scena con il suo tempo massimo (in secondi). Se lo supera, passa oltre senza errori. */
  async runScene(label: string, budgetSeconds: number, fn: () => Promise<void>) {
    this.check();
    this.sceneIndex += 1;
    this.opts.onScene(this.sceneIndex, label);
    this.sceneDeadline = this.now() + (budgetSeconds * 1000) / this.speed;
    try {
      await fn();
    } catch (e) {
      if (!(e instanceof SceneTimeout)) throw e;
    } finally {
      this.sceneDeadline = Infinity;
      this.runCleanups();
    }
  }

  /** Da eseguire alla fine della scena anche se viene interrotta (per esempio alzare il dito dal disegno). */
  defer(fn: () => void) {
    this.cleanups.push(fn);
  }

  private runCleanups() {
    const list = this.cleanups;
    this.cleanups = [];
    list.reverse().forEach((fn) => {
      try {
        fn();
      } catch {
        /* pulizia: non deve bloccare niente */
      }
    });
  }

  caption(text: string) {
    this.opts.onCaption(text);
  }

  // ───────── scorrimento ─────────

  async scrollTo(y: number, ms = 1800) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = clamp(Math.round(y), 0, Math.max(0, max));
    const from = window.scrollY;
    if (Math.abs(to - from) < 4) return;
    // behavior 'instant' scavalca scroll-behavior: smooth del CSS: la curva la decide la demo
    await this.animate(ms, (t) => window.scrollTo({ top: from + (to - from) * easeInOut(t), behavior: 'instant' }));
  }

  /** Porta un elemento in vista: in alto sotto la barra, oppure al centro dello schermo se ci sta. */
  async scrollToEl(el: Element, ms = 1800, align: 'start' | 'center' = 'start') {
    const r = el.getBoundingClientRect();
    const usable = window.innerHeight - TOP_SAFE - BOTTOM_SAFE;
    const y =
      align === 'center' && r.height <= usable
        ? r.top + window.scrollY - (window.innerHeight - r.height) / 2 + (TOP_SAFE - BOTTOM_SAFE) / 2
        : r.top + window.scrollY - TOP_SAFE;
    await this.scrollTo(y, ms);
  }

  /** Se l'elemento è fuori vista (o sotto la barra / il riquadro della demo), scorre il minimo per vederlo. */
  async ensureVisible(el: Element) {
    const r = el.getBoundingClientRect();
    if (r.top >= TOP_SAFE && r.bottom <= window.innerHeight - BOTTOM_SAFE) return;
    const target = r.top + window.scrollY + r.height / 2 - window.innerHeight * 0.42;
    await this.scrollTo(target, 900);
  }

  // ───────── cursore ─────────

  private center(el: Element) {
    const r = el.getBoundingClientRect();
    return {
      x: clamp(r.left + r.width / 2, 8, window.innerWidth - 8),
      y: clamp(r.top + r.height / 2, TOP_SAFE - 20, window.innerHeight - 20),
    };
  }

  /** Muove il cursore (curva morbida, parte e arriva piano) verso un punto o verso un elemento che può muoversi. */
  async moveTo(target: { x: number; y: number } | (() => { x: number; y: number }), ms?: number) {
    const get = typeof target === 'function' ? target : () => target;
    const from = this.cursor.pos();
    const end0 = get();
    const dist = Math.hypot(end0.x - from.x, end0.y - from.y);
    const dur = ms ?? clamp(380 + dist * 0.8, 380, 1500);
    const nx = dist ? -(end0.y - from.y) / dist : 0;
    const ny = dist ? (end0.x - from.x) / dist : 0;
    this.bend = -this.bend;
    const bend = Math.min(70, dist * 0.12) * this.bend;
    const cx = (from.x + end0.x) / 2 + nx * bend;
    const cy = (from.y + end0.y) / 2 + ny * bend;
    await this.animate(dur, (t) => {
      const e = easeInOut(t);
      const u = 1 - e;
      const end = get();
      this.cursor.move(u * u * from.x + 2 * u * e * cx + e * e * end.x, u * u * from.y + 2 * u * e * cy + e * e * end.y);
    });
  }

  async moveToEl(el: Element, ms?: number) {
    await this.ensureVisible(el);
    await this.moveTo(() => this.center(el), ms);
  }

  /** Il gesto del clic (cerchio arancione) nel punto in cui si trova il cursore. */
  press() {
    this.cursor.press();
  }

  /** Il cursore va sull'elemento, preme (cerchio arancione) e il clic arriva davvero. false se è disattivato. */
  async click(el: HTMLElement, pauseAfter = 350) {
    await this.moveToEl(el);
    this.cursor.press();
    await this.sleep(150);
    const disabled = (el as HTMLButtonElement).disabled === true;
    if (!disabled) el.click();
    await this.sleep(pauseAfter);
    return !disabled;
  }

  /** Solo il gesto, senza il clic: per i link che portano a un'altra parte della pagina (ci pensa la demo a scorrere). */
  async pressOnly(el: Element, pauseAfter = 300) {
    await this.moveToEl(el);
    this.cursor.press();
    await this.sleep(pauseAfter);
  }

  /** Scrive in un campo di testo una lettera alla volta (come farebbe una tastiera). */
  async type(input: HTMLInputElement, text: string, charMs = 90) {
    await this.moveToEl(input);
    this.cursor.press();
    input.focus({ preventScroll: true });
    for (let i = 1; i <= text.length; i++) {
      setNativeValue(input, text.slice(0, i));
      await this.sleep(charMs);
    }
  }

  /** Svuota un campo di testo con un solo gesto. */
  clear(input: HTMLInputElement) {
    setNativeValue(input, '');
  }

  /** Disegna con il cursore su un canvas: i punti sono frazioni (0-1) della sua larghezza e altezza. */
  async draw(canvas: HTMLElement, points: Array<[number, number]>, segmentMs = 260) {
    const at = ([fx, fy]: [number, number]) => {
      const r = canvas.getBoundingClientRect();
      return { x: r.left + r.width * fx, y: r.top + r.height * fy };
    };
    await this.ensureVisible(canvas);
    await this.moveTo(() => at(points[0]));
    let down = false;
    const up = () => {
      if (!down) return;
      down = false;
      const p = this.cursor.pos();
      firePointer(canvas, 'pointerup', p.x, p.y);
    };
    this.defer(up);
    const p0 = at(points[0]);
    firePointer(canvas, 'pointerdown', p0.x, p0.y);
    down = true;
    this.cursor.press();
    for (const pt of points.slice(1)) {
      await this.moveTo(() => at(pt), segmentMs);
      const p = this.cursor.pos();
      firePointer(canvas, 'pointermove', p.x, p.y);
    }
    up();
    await this.sleep(300);
  }

  /** Prende il drone con il cursore e lo sposta (si può solo nella home page: lo decide la scena 3D). */
  async dragDrone(from: { x: number; y: number }, to: { x: number; y: number }) {
    await this.moveTo(from);
    firePointer(window, 'pointerdown', from.x, from.y);
    this.cursor.press();
    let down = true;
    this.defer(() => {
      if (down) firePointer(window, 'pointerup', to.x, to.y);
    });
    await this.animate(1300, (t) => {
      const e = easeInOut(t);
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e;
      this.cursor.move(x, y);
      firePointer(window, 'pointermove', x, y);
    });
    firePointer(window, 'pointerup', to.x, to.y);
    down = false;
    await this.sleep(500);
  }
}

// ───────── eventi del browser ─────────

/** Cambia il valore di un campo come lo cambierebbe la tastiera, in modo che React se ne accorga. */
export function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const POINTER_ID = 4242;

export function firePointer(target: EventTarget, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId: POINTER_ID,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
    }),
  );
}

// ───────── ricerca di elementi ─────────

export const section = (id: string) => document.getElementById(`prova-${id}`);

/** Il primo pulsante (o link) dentro `root` il cui testo corrisponde. */
export function findButton(root: ParentNode | null, text: RegExp) {
  if (!root) return null;
  const all = Array.from(root.querySelectorAll<HTMLElement>('button, a'));
  return all.find((b) => text.test((b.textContent ?? '').trim())) ?? null;
}
