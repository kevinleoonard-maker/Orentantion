import { useEffect, useRef, useState } from 'react';
import { publishTelemetry } from '../lib/telemetry';
import FlightTag from './FlightTag';
import styles from './DroneScene.module.css';

// Dal sito di Kevin Saccato (components/DroneScene.tsx), senza Next.js: stesso modello, stessa scena, stessi tempi.
const MODEL_URL = '/models/drone.glb';
// stessa condizione di lib/drone-scene.js per il drone che segue lo scroll
const DESKTOP_QUERY = '(min-width: 1100px) and (pointer: fine)';
// WebGL disegnato dal processore (nessuna GPU): ogni fotogramma bloccherebbe la pagina
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function softwareRenderer(gl: WebGL2RenderingContext) {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
  return SOFTWARE_GL.test(name);
}

/**
 * Piazzola e drone 3D: il <canvas> fisso (sotto la navbar, senza clic) e il <div> dello hero a cui la scena aggancia
 * la piazzola. Su desktop il drone segue la rotta delle prove ([data-drone-lane]) e atterra sulla H del debriefing
 * ([data-drone-landing]); su telefono e tablet resta sulla piazzola. Senza WebGL resta l'immagine statica del drone.
 */
export default function DroneScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const anchor = anchorRef.current;
    if (!canvas || !anchor) return;

    let cancelled = false;
    let destroy: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let observer: IntersectionObserver | undefined;
    const desktop = window.matchMedia(DESKTOP_QUERY).matches;

    const start = () => {
      if (cancelled) return;
      let gl: WebGL2RenderingContext | null = null;
      try {
        gl = canvas.getContext('webgl2', desktop ? undefined : { failIfMajorPerformanceCaveat: true });
      } catch {
        gl = null;
      }
      if (!gl || (!desktop && softwareRenderer(gl))) {
        setFallback(true);
        return;
      }
      // il modello e three si scaricano solo adesso, dopo il primo disegno della pagina
      const data = fetch(MODEL_URL)
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .catch(() => null);
      import('../lib/drone-scene')
        .then(async ({ createDroneScene, loadDroneModel }) => {
          const buffer = await data;
          // senza modello la scena usa il drone disegnato con le primitive di three
          const model = buffer ? await loadDroneModel(buffer).catch(() => null) : null;
          timer = setTimeout(() => {
            if (cancelled) return;
            destroy = createDroneScene({
              canvas,
              anchor,
              model,
              route: {
                lanes: document.querySelectorAll('[data-drone-lane]'),
                landing: document.querySelector('[data-drone-landing]'),
              },
              // il drone si prende e si sposta solo nella home page (lo hero), non lungo la rotta
              home: anchor.closest('#top'),
              onTelemetry: publishTelemetry,
            });
          }, 0);
        })
        .catch(() => {
          if (!cancelled) setFallback(true);
        });
    };

    if (desktop) {
      timer = setTimeout(start, 120);
    } else {
      // telefono e tablet: la scena parte quando la piazzola sta per entrare nello schermo
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          observer?.disconnect();
          start();
        },
        { rootMargin: '0px 0px 120px 0px' },
      );
      observer.observe(anchor);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      clearTimeout(timer);
      destroy?.();
    };
  }, []);

  return (
    <>
      {!fallback && <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />}
      {!fallback && <FlightTag />}
      <div ref={anchorRef} className={styles.anchor} aria-hidden="true">
        {fallback && <img src="/ks-01/drone-fallback.png" alt="" width={460} height={600} className={styles.fallback} />}
      </div>
    </>
  );
}
