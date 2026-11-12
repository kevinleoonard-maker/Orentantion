// Rotta del drone su desktop. La usano la scena 3D (lib/drone-scene.js) e il piano di volo disegnato sulla pagina
// (components/FlightPath.tsx): stessa formula, così il drone vola esattamente sulla linea tratteggiata.
//
// La pagina ha una corsia libera accanto a ogni prova ([data-drone-lane], a destra o a sinistra). Il drone sta a
// metà schermo al centro della corsia; fra una corsia e la successiva (la striscia di traversata) attraversa lo
// schermo con partenza e arrivo morbidi.

export const ease = (c) => c * c * (3 - 2 * c);

/** Corsie visibili in coordinate di pagina, in ordine dall'alto: { x, top, bottom, w } (x = centro della corsia). */
export function readLanes(els, scrollY) {
  const lanes = [];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    lanes.push({ x: (r.left + r.right) / 2, top: r.top + scrollY, bottom: r.bottom + scrollY, w: r.width });
  }
  return lanes;
}

/**
 * Punto della rotta alla quota di pagina P.
 * x: centro orizzontale (px dello schermo); c: avanzamento della traversata, 0 fuori dalle traversate;
 * dir: verso della traversata (+1 verso destra, -1 verso sinistra); w: larghezza della corsia più stretta.
 */
export function routeAt(P, lanes, out = {}) {
  out.c = 0;
  out.dir = 0;
  let i = 0;
  while (i < lanes.length - 1 && P > lanes[i].bottom) {
    const a = lanes[i];
    const b = lanes[i + 1];
    if (P < b.top) {
      const c = (P - a.bottom) / (b.top - a.bottom);
      out.x = a.x + (b.x - a.x) * ease(c);
      out.c = c;
      out.dir = Math.sign(b.x - a.x);
      out.w = Math.min(a.w, b.w);
      return out;
    }
    i++;
  }
  out.x = lanes[i].x;
  out.w = lanes[i].w;
  return out;
}

// controllo minimo della formula: `node src/lib/route.js`
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('route.js')) {
  const lanes = [
    { x: 1200, top: 0, bottom: 1000, w: 300 },
    { x: 200, top: 1500, bottom: 2500, w: 300 },
  ];
  const at = (P) => routeAt(P, lanes, {});
  console.assert(at(500).x === 1200 && at(500).c === 0, 'nella prima corsia');
  console.assert(at(1250).x === 700 && at(1250).c === 0.5 && at(1250).dir === -1, 'a metà traversata');
  console.assert(at(2000).x === 200 && at(2000).c === 0, 'nella seconda corsia');
  console.assert(at(9000).x === 200, 'dopo l\'ultima corsia');
  console.log('route ok');
}
