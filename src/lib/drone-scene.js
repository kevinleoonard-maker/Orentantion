import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  REVISION,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  Box3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { readLanes, routeAt, ease as easeInOut } from './route.js';

// Copiato dal sito di Kevin Saccato (KevinDronePhotography, lib/drone-scene.js): stessi numeri e stesso drone.
// Cambia solo la rotta su desktop: al posto di corridoio destro / cambio di colonna / corridoio sinistro, una corsia
// per ogni prova della missione con una traversata fra l'una e l'altra (lib/route.js).
// quanto si avvicina a chi guarda a metà traversata (frazione della distanza della camera)
const NEAR = 0.14;

// Import nominativi invece di `import * as THREE`: così il bundler scarta le parti di three che non servono.
// Logica e numeri dell'animazione sono quelli di reference/drone-scene.js; cambiano il drone (modello glb),
// i colori della piazzola e il comportamento con prefers-reduced-motion. Con three recente il ramo per la r149
// (ColorManagement.legacyMode, sRGBEncoding) non viene mai eseguito.
const THREE = {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  REVISION,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  Box3,
};

// rotta su desktop: altezza del drone sullo schermo nei corridoi (frazione dell'altezza della finestra)
const ROUTE_Y = 0.5;

// colori della piazzola
const PAD_ORANGE = '#ff6b1a';
const PAD_RIM = 0xd9550f;

/**
 * Legge public/models/drone.glb (già orientato, in scala e con le eliche raggruppate per motore,
 * vedi scripts/prepare-drone-model.mjs) e restituisce la scena del modello.
 */
export function loadDroneModel(buffer) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return loader.parseAsync(buffer, '').then((gltf) => gltf.scene);
}

/**
 * Scena 3D del drone per il sito di Saccato Kevin.
 *
 * Cosa fa:
 * - nello hero il drone sta sulla piazzola con la H, accende le eliche e decolla (vista frontale, in prospettiva);
 * - in volo resta sospeso, oscilla piano e su desktop si inclina verso il mouse;
 * - nella home page (`home`) si può prendere con il mouse o con il dito e spostare: lasciato, scende un po' e resta
 *   lì finché non si scorre. Più in basso, lungo la rotta, non si può prendere;
 * - su desktop (>= 1100px e mouse), scorrendo, lascia la piazzola e segue la rotta tracciata dalla pagina:
 *   corridoio di destra; cambio di colonna, in cui la pagina scivola a sinistra di una schermata e il drone passa
 *   al corridoio di sinistra (sale ad arco, vira col muso nella direzione di volo, passa vicino a chi guarda);
 *   corridoio di sinistra; atterraggio sulla H accanto ai contatti;
 * - su telefono e tablet resta sulla piazzola e scorre via con lo hero;
 * - con prefers-reduced-motion è fermo in volo, senza eliche che girano e senza seguire lo scroll.
 *
 * Uso:
 *   const model = await loadDroneModel(arrayBufferDelFileGlb); // public/models/drone.glb
 *   const destroy = createDroneScene({ canvas, anchor, model });
 *   // model: facoltativo; senza modello si usa il drone disegnato con le primitive di three
 *   // canvas: <canvas> position: fixed; inset: 0; pointer-events: none; z-index sotto la navbar
 *   // anchor: il <div> vuoto nella colonna destra dello hero (larghezza max 420px, altezza 520px)
 *   // route: facoltativo, { lanes, landing }: le corsie libere accanto alle prove ([data-drone-lane]) e la zona
 *   //   della H del debriefing ([data-drone-landing]); elementi vuoti del layout, nascosti su telefono
 *   // home: facoltativo, l'elemento della home page (lo hero): il drone si può prendere solo mentre occupa lo schermo
 *   // onTelemetry: facoltativo, chiamata a ogni fotogramma con lo stato del drone (decollo, quota, rotta, sagoma
 *   //   sullo schermo): la usa la strumentazione di volo (lib/telemetry.ts)
 *   // destroy(): da chiamare allo smontaggio del componente
 */
export function createDroneScene({ canvas, anchor, model = null, route = null, home = null, onFirstFrame = null, onTelemetry = null }) {
  // Funziona sia con three r149 (usato in reference/) sia con le versioni recenti (r152+).
  const modern = 'SRGBColorSpace' in THREE;
  if (!modern && THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (modern) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false; // due passaggi per fotogramma: piazzole, poi drone (vedi frame)

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 20000);

  // Dalla r155 le intensità delle luci sono fisiche: moltiplicate per PI per avere lo stesso aspetto della r149.
  const L = Number(THREE.REVISION) >= 155 ? Math.PI : 1;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbdbdb8, 1.1 * L));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5 * L);
  sun.position.set(0.5, 1, 0.9);
  scene.add(sun);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.45 * L);
  rimLight.position.set(-1, 0.4, -0.6);
  scene.add(rimLight);

  const props = [];
  const leds = [];
  const { rig: padRig, shadow } = buildPad();
  scene.add(padRig);
  // seconda H, nel footer: lì il drone atterra alla fine della pagina
  const { rig: landRig, shadow: landShadow } = buildPad();
  landRig.visible = false;
  scene.add(landRig);
  const lp = new THREE.Vector3();
  const droneRig = new THREE.Group();
  // manovra nel sistema del drone (virata verso la direzione di volo), sopra l'inclinazione di base
  const stunt = new THREE.Group();
  stunt.add(model ? buildModelDrone(model) : buildDrone());
  droneRig.add(stunt);
  scene.add(droneRig);

  const mouse = { x: 0, y: 0 };
  const onMouse = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  let needsResize = true;
  const onResize = () => { needsResize = true; };
  window.addEventListener('mousemove', onMouse, { passive: true });
  window.addEventListener('resize', onResize);

  const hp = new THREE.Vector3();
  const t0 = performance.now();
  let cur = null;
  let cw = 0, ch = 0, raf = 0, dead = false, cleared = false;
  let lastT = 0; // per muovere il drone alla stessa velocità su schermi a 60 e a 120 Hz
  // condizioni lette a ogni fotogramma: le liste di media query si creano una volta sola
  const desktopQuery = window.matchMedia('(min-width: 1100px) and (pointer: fine)');
  const stillQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Il canvas è alto quanto lo schermo ma largo solo quanto la zona in cui c'è qualcosa da disegnare (drone e
  // piazzole visibili), e la segue di lato: la prospettiva resta quella dello schermo intero (camera.setViewOffset),
  // ma a ogni fotogramma si disegna e si compone meno della metà dello schermo. La larghezza (capW) si sceglie
  // all'avvio con margine e cresce solo se serve: ridimensionare il canvas blocca la pagina per qualche fotogramma.
  let capW = 0, boxX = -1;
  const box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const addBox = (cx, cy, hw, top, bottom) => {
    box.x0 = Math.min(box.x0, cx - hw); box.x1 = Math.max(box.x1, cx + hw);
    box.y0 = Math.min(box.y0, cy - top); box.y1 = Math.max(box.y1, cy + bottom);
  };

  // #region Trascinamento con mouse o dito
  // Trascinamento: il drone si prende con il mouse o con il dito, si sposta e, lasciato, scende un po'
  // e resta sospeso lì. Il canvas non riceve eventi (pointer-events: none): il drone si riconosce dalla
  // sua sagoma sullo schermo, un'ellisse aggiornata a ogni frame. Un clic senza spostamento passa alla pagina.
  const hit = { x: 0, y: 0, rx: 0, ry: 0 };
  const tele = {}; // riusato a ogni fotogramma per onTelemetry
  const rp = {}; // punto della rotta, riusato a ogni fotogramma
  // Si può prendere solo nella home page: finché `home` (lo hero) occupa più di metà schermo. Scorrendo oltre il
  // drone segue la rotta e non si tocca più. Senza `home` si può prendere ovunque.
  const inHome = () => !home || home.getBoundingClientRect().bottom > window.innerHeight * 0.5;
  const onDrone = (x, y) => hit.rx > 0 && inHome() && ((x - hit.x) / hit.rx) ** 2 + ((y - hit.y) / hit.ry) ** 2 <= 1;
  const html = document.documentElement;
  let drag = null;   // { id, ox, oy, sx, sy, px, py, s, moved }
  let placed = null; // { x, y, s, sy, t, sink }: punto in cui è stato lasciato (piano z = 0)
  let settling = false;
  const blockClick = (e) => { e.preventDefault(); e.stopPropagation(); };
  // punto in cui va il drone mentre lo trascini: resta tutto dentro lo schermo
  const clamp = (v, r, size) => (r * 2 >= size ? size / 2 : Math.min(size - r, Math.max(r, v)));
  const dropPoint = () => ({
    x: clamp(drag.px + drag.ox, hit.rx * 1.3, cw) - cw / 2, // i dischi delle eliche sporgono oltre la sagoma
    y: ch / 2 - clamp(drag.py + drag.oy, hit.ry * 1.5, ch),
  });
  const onPointerDown = (e) => {
    if (drag || !cur || (e.pointerType === 'mouse' && e.button !== 0) || !onDrone(e.clientX, e.clientY)) return;
    const f = camera.position.z / (camera.position.z - cur.z);
    drag = { id: e.pointerId, ox: hit.x - e.clientX, oy: hit.y - e.clientY, sx: e.clientX, sy: e.clientY, px: e.clientX, py: e.clientY, s: cur.s * f, moved: false };
    if (e.pointerType === 'mouse') e.preventDefault(); // niente selezione del testo sotto
    html.classList.add('drone-grabbing');
  };
  const onPointerMove = (e) => {
    if (!drag) {
      if (e.pointerType === 'mouse') html.classList.toggle('drone-grab', onDrone(e.clientX, e.clientY));
      return;
    }
    if (e.pointerId !== drag.id) return;
    drag.px = e.clientX; drag.py = e.clientY;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
  };
  const onPointerUp = (e) => {
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.id)) return;
    if (drag.moved) {
      const p = dropPoint();
      const sy = window.scrollY || html.scrollTop;
      placed = { x: p.x, y: p.y, s: drag.s, sy, t: (performance.now() - t0) / 1000, sink: Math.min(56, ch * 0.06) };
      // il clic che il browser genera alla fine del trascinamento non deve aprire il link che c'è sotto
      window.addEventListener('click', blockClick, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', blockClick, { capture: true }), 0);
    }
    drag = null;
    html.classList.remove('drone-grabbing');
  };
  // con il dito sul drone la pagina non scorre (gli altri tocchi restano liberi)
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    if (e.touches.length === 1 && onDrone(touch.clientX, touch.clientY)) e.preventDefault();
  };
  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('blur', onPointerUp);
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  // #endregion

  function buildPad() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    const g = c.getContext('2d');
    g.translate(512, 512);
    // piazzola arancione: tacche scure, anello e H neri, cerchio tratteggiato chiaro
    g.fillStyle = PAD_ORANGE; g.beginPath(); g.arc(0, 0, 508, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 24; k++) {
      g.save(); g.rotate(k * Math.PI / 12);
      g.fillStyle = k % 6 === 0 ? 'rgba(17,17,17,0.55)' : 'rgba(17,17,17,0.22)';
      g.fillRect(-3, -490, 6, k % 6 === 0 ? 46 : 26);
      g.restore();
    }
    g.strokeStyle = '#111111'; g.lineWidth = 18; g.beginPath(); g.arc(0, 0, 400, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 5; g.setLineDash([18, 22]); g.beginPath(); g.arc(0, 0, 350, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#111111'; g.fillRect(-130, -175, 56, 350); g.fillRect(74, -175, 56, 350); g.fillRect(-130, -28, 260, 56);
    const tex = new THREE.CanvasTexture(c);
    if (modern) tex.colorSpace = THREE.SRGBColorSpace;
    else tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 8;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(1, 120), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 }));
    pad.rotation.x = -Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.01, 0.05, 120, 1, true), new THREE.MeshStandardMaterial({ color: PAD_RIM, roughness: 0.85 }));
    rim.position.y = -0.025;

    const sc = document.createElement('canvas');
    sc.width = 256; sc.height = 256;
    const sg = sc.getContext('2d');
    const grd = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(17,17,17,0.6)'); grd.addColorStop(0.5, 'rgba(17,17,17,0.22)'); grd.addColorStop(1, 'rgba(17,17,17,0)');
    sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(sc);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.006;

    const rig = new THREE.Group();
    rig.add(pad, rim, shadow);
    return { rig, shadow };
  }

  // Drone dal file glb: ogni elica è un nodo "prop_*" vuoto che ruota su Y locale (= asse reale del motore,
  // inclinato); le posizioni dei LED di coda sono negli extras del nodo "drone".
  function buildModelDrone(root) {
    root.updateMatrixWorld(true);
    let i = 0;
    let ledPoints = [];
    root.traverse((o) => {
      if (Array.isArray(o.userData.leds)) ledPoints = o.userData.leds;
      if (o.userData.radius === undefined) return;
      // disco sfocato all'altezza delle pale, nel sistema del supporto (non ruota con l'elica)
      const box = new THREE.Box3().setFromObject(o).applyMatrix4(o.parent.matrixWorld.clone().invert());
      const disc = new THREE.Mesh(new THREE.CircleGeometry(o.userData.radius, 48), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = (box.min.y + box.max.y) / 2;
      o.parent.add(disc);
      o.userData.disc = disc;
      o.rotation.y = i++ * 0.7;
      props.push(o);
    });
    ledPoints.forEach(([x, y, z]) => {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), new THREE.MeshBasicMaterial({ color: x > 0 ? 0x1fa971 : 0xff4d3d, transparent: true }));
      led.position.set(x, y, z - 0.03);
      leds.push(led);
      root.add(led);
    });
    return root;
  }

  function buildDrone() {
    const dark = new THREE.MeshStandardMaterial({ color: 0x26272a, roughness: 0.42, metalness: 0.3 });
    const mid = new THREE.MeshStandardMaterial({ color: 0x4a4b4f, roughness: 0.38, metalness: 0.35 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x3a3b3e, roughness: 0.5, metalness: 0.2 });
    const d = new THREE.Group();

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.28, 8, 28), dark);
    body.rotation.x = Math.PI / 2;
    body.scale.set(1.2, 1, 0.72);
    d.add(body);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.3), mid);
    cover.position.y = 0.085;
    d.add(cover);

    const motors = [[0.42, 0.33], [-0.42, 0.33], [0.42, -0.31], [-0.42, -0.31]];
    motors.forEach(([x, z], i) => {
      const len = Math.hypot(x, z);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, len, 14), dark);
      arm.position.set(x / 2, 0.015, z / 2);
      arm.rotation.set(0, -Math.atan2(z, x), Math.PI / 2, 'YXZ');
      d.add(arm);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.075, 24), mid);
      motor.position.set(x, 0.045, z);
      d.add(motor);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.13, 10), dark);
      leg.position.set(x, -0.055, z);
      d.add(leg);

      const prop = new THREE.Group();
      prop.position.set(x, 0.09, z);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.008, 0.042), bladeMat);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 14), mid);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.24, 48), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      disc.rotation.x = -Math.PI / 2;
      prop.add(blade, hub, disc);
      prop.userData = { dir: (i === 0 || i === 3) ? 1 : -1, disc };
      prop.rotation.y = i * 0.7;
      props.push(prop);
      d.add(prop);

      if (z < 0) {
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), new THREE.MeshBasicMaterial({ color: x > 0 ? 0x1fa971 : 0xff4d3d, transparent: true }));
        led.position.set(x, 0, z - 0.06);
        leds.push(led);
        d.add(led);
      }
    });

    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.068, 28, 20), mid);
    gimbal.position.set(0, -0.06, 0.3);
    d.add(gimbal);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 24), new THREE.MeshStandardMaterial({ color: 0x14243a, roughness: 0.1, metalness: 0.7 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.06, 0.365);
    d.add(lens);
    return d;
  }

  function frame() {
    const doc = document.documentElement;
    // larghezza della pagina (senza barra di scorrimento): il canvas non deve mai allargarla
    const vw = doc.clientWidth || window.innerWidth, vh = window.innerHeight;
    const range = doc.scrollHeight - vh;
    const scrollable = range > 80 && vh < 2000;
    const h = scrollable ? vh : Math.min(vh, 1400);

    if (needsResize || cw !== vw || ch !== h) {
      cw = vw; ch = h; needsResize = false;
      canvas.style.position = scrollable ? 'fixed' : 'absolute';
      capW = 0; // il canvas si ridimensiona sotto, sulla zona da disegnare
      camera.aspect = vw / ch;
      const dist = (ch / 2) / Math.tan(camera.fov * Math.PI / 360); // 1 unità del mondo = 1 px sul piano z = 0
      camera.position.set(0, 0, dist);
      camera.near = dist / 20; camera.far = dist * 5;
      camera.updateProjectionMatrix();
    }

    const sy = scrollable ? (window.scrollY || doc.scrollTop) : 0;
    const desktop = desktopQuery.matches;
    const still = stillQuery.matches;
    const t = (performance.now() - t0) / 1000;
    // passi pensati per 60 fotogrammi al secondo, adattati al tempo vero fra un fotogramma e l'altro
    const dt = lastT ? Math.min(0.1, Math.max(0, t - lastT)) : 1 / 60;
    lastT = t;
    const per = (k) => (k >= 1 ? 1 : 1 - Math.pow(1 - k, dt * 60));

    // piazzola agganciata al div vuoto dello hero
    let ax = vw * 0.75, at = ch * 0.62 - 416, aw = 420, ah = 520;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      ax = r.left + r.width / 2; at = r.top; aw = r.width; ah = r.height;
    }
    // zona alta come nel riferimento (420 × 520 px): misura dalla larghezza, piazzola all'80% dell'altezza.
    // Zona bassa (hero su telefono, schermi in orizzontale o bassi): misura dall'altezza e disegno centrato.
    // Il disegno va da 1,55 unità sopra il centro della piazzola (drone in volo) a 0,68 sotto (bordo della piazzola).
    const tall = ah >= aw * 1.22;
    const unit = tall ? aw / 2.3 : Math.min(aw / 2.3, ah / 2.4);
    const ay = tall ? at + ah * 0.8 : at + (ah - 2.23 * unit) / 2 + 1.55 * unit;
    padRig.position.set(ax - vw / 2, ch / 2 - ay, 0);
    padRig.scale.setScalar(unit);
    padRig.rotation.set(0.42, -0.12, 0);
    padRig.updateMatrixWorld();

    // #region Decollo
    // decollo: parte dopo 0,8 s e dura 2,6 s; eliche in accelerazione da 0,6 s
    const tk = still ? 1 : Math.min(1, Math.max(0, (t - 0.8) / 2.6));
    const ease = tk < 0.5 ? 4 * tk * tk * tk : 1 - Math.pow(-2 * tk + 2, 3) / 2;
    const alt = ease + (still ? 0 : Math.sin(t * 1.6) * 0.035 * ease);
    const spin = still ? 0 : (t < 0.6 ? 0 : 8 + 64 * Math.min(1, (t - 0.6) / 1.2));
    // #endregion

    // #region Rotta: corridoi, cambio di colonna e atterraggio
    // rotta (solo desktop): lascia la piazzola nel primo 60% di schermo scrollato, poi resta a metà schermo e
    // grande come nello hero mentre la pagina gli scorre accanto: corridoio di destra, cambio di colonna, corridoio di
    // sinistra. Nell'ultimo 60% di schermo atterra sulla H accanto ai contatti.
    let lanes = null, fr = null;
    if (desktop && scrollable && !still && route) {
      lanes = readLanes(route.lanes, sy);
      fr = route.landing?.getBoundingClientRect();
    }
    const onRoute = !!(lanes && lanes.length && fr && fr.width > 0 && fr.height > 0);
    let w = 0, sideX = 0, sideY = 0, land = 0, near = 0, yaw = 0, crossing = 0, climb = 0, laneS = Infinity;
    if (onRoute) {
      // il drone sta a metà schermo; la quota di pagina sotto di lui decide corsia o traversata
      const D = vh * ROUTE_Y;
      const r = routeAt(sy + D, lanes, rp);
      const c = r.c;
      crossing = c;
      sideX = r.x;
      sideY = D + Math.sin(t * 1.6) * 4;
      // in traversata si avvicina a chi guarda a metà strada e vira col muso nella direzione di volo
      near = NEAR * Math.sin(Math.PI * c);
      const turn = c <= 0 ? 0 : c < 0.15 ? easeInOut(c / 0.15) : c > 0.85 ? easeInOut((1 - c) / 0.15) : 1;
      yaw = -r.dir * Math.PI / 2 * turn;
      // nella corsia ci sta tutto, dischi delle eliche compresi (mezza larghezza = 0,78 della scala)
      laneS = (r.w / 2 - 8) / 0.78;
      const l = Math.min(1, sy / (vh * 0.6)); // lascia la piazzola nei primi 60% di schermo scrollati
      w = l * l * (3 - 2 * l);
      const e = Math.min(1, Math.max(0, (sy - (range - vh * 0.6)) / (vh * 0.6)));
      land = e * e * (3 - 2 * e);
      // seconda H, nella corsia del debriefing in fondo alla pagina
      landRig.position.set((fr.left + fr.right) / 2 - vw / 2, ch / 2 - (fr.top + fr.height * 0.6), 0);
      // un po' più piccola della corsia: in prospettiva la piazzola è più larga del suo raggio
      landRig.scale.setScalar(Math.min(unit, fr.width / 2 - 28));
      landRig.rotation.set(0.42, -0.12, 0);
      landRig.updateMatrixWorld();
    }
    landRig.visible = onRoute;
    // #endregion

    hp.set(0, 0.07 + alt, 0);
    padRig.localToWorld(hp);
    // a metà passaggio il drone si avvicina alla camera (z > 0): x e y si riportano sul piano z = 0
    // perché sullo schermo resti esattamente sulla rotta
    const dz = camera.position.z * near;
    const pf = (camera.position.z - dz) / camera.position.z;
    const sx = (sideX - vw / 2) * pf, syw = (ch / 2 - sideY) * pf;
    const path = {
      x: hp.x + (sx - hp.x) * w,
      y: hp.y + (syw - hp.y) * w,
      z: hp.z * (1 - w) + dz * w,
      s: unit * 1.15 + (Math.min(unit * 1.15, laneS) - unit * 1.15) * w
    };
    if (land > 0) {
      // discesa sulla H del footer: la quota passa da 1 a 0 mentre si arriva in fondo alla pagina
      lp.set(0, 0.07 + (1 - land), 0);
      landRig.localToWorld(lp);
      path.x += (lp.x - path.x) * land;
      path.y += (lp.y - path.y) * land;
      path.z += (lp.z - path.z) * land;
    }

    // spostato dall'utente: mentre lo trascini segue il puntatore; lasciato, scende un po' in 1,4 s e resta lì.
    // Scorrendo la pagina riparte da quel punto e, entro il 60% di uno schermo, torna al suo percorso.
    let pw = 0, ux = 0, uy = 0, us = 0;
    if (drag) {
      const p = dropPoint();
      pw = 1; ux = p.x; uy = p.y; us = drag.s;
    } else if (placed) {
      const u = Math.min(1, Math.abs(sy - placed.sy) / (vh * 0.6));
      const d = still ? 1 : Math.min(1, (t - placed.t) / 1.4);
      pw = 1 - u * u * (3 - 2 * u);
      ux = placed.x;
      uy = placed.y - placed.sink * (1 - Math.pow(1 - d, 3)) + (still ? 0 : Math.sin(t * 1.6) * 4 * d);
      us = placed.s;
      if (u >= 1) { placed = null; settling = true; }
    }
    const target = {
      x: path.x + (ux - path.x) * pw,
      y: path.y + (uy - path.y) * pw,
      z: path.z * (1 - pw),
      s: path.s + (us - path.s) * pw
    };
    if (!cur) cur = { ...target, rz: 0, rx: 0, yaw: 0 };
    let k = w > 0.001 || pw > 0.001 || settling ? 0.12 : 1;
    // nel cambio di colonna il drone resta più vicino al piano di volo tratteggiato
    if (crossing > 0 && crossing < 1 && k < 1) k = 0.2;
    if (drag) k = 0.25;
    if (still) k = 1;
    k = per(k);
    const dx = target.x - cur.x, dy = target.y - cur.y;
    cur.x += dx * k; cur.y += dy * k; cur.z += (target.z - cur.z) * k; cur.s += (target.s - cur.s) * k;
    if (settling && Math.hypot(target.x - cur.x, target.y - cur.y) < 0.5) settling = false;
    const away = Math.max(w, pw); // quanto il drone è lontano dalla piazzola dello hero (rotta o posizione scelta)
    const we = away * (1 - land); // atterrato sulla H del footer torna orientato come su una piazzola

    // #region Inclinazione verso il mouse e in curva
    const mx = desktop && !still ? mouse.x : 0, my = desktop && !still ? mouse.y : 0;
    // inclinazione in curva: dallo spostamento per fotogramma, riportato a 60 fotogrammi al secondo
    const v60 = dt > 0 ? 1 / (dt * 60) : 1;
    const bank = Math.max(-0.55, Math.min(0.55, -dx * v60 * 0.004));
    const look = ease * (1 - land); // atterrato non guarda più il mouse
    const kt = per(0.1);
    cur.rz += (bank - mx * 0.09 * look - cur.rz) * kt;
    cur.rx += (Math.max(-0.4, Math.min(0.4, -dy * v60 * 0.003)) + my * 0.06 * look - cur.rx) * kt;

    droneRig.position.set(cur.x, cur.y, cur.z);
    droneRig.scale.setScalar(cur.s);
    // con prefers-reduced-motion niente oscillazione: il drone resta fermo
    const sway = still ? 0 : Math.sin(t * 0.5) * 0.1 * ease;
    // inclinazione in avanti un po' ridotta rispetto al riferimento (0,38 / 0,3): il drone sta più dritto
    droneRig.rotation.set(0.27 * (1 - we) + 0.22 * we + cur.rx, -0.12 * (1 - we) + sway, cur.rz);
    // virata del cambio di colonna (spenta se lo si sta spostando a mano)
    const stuntOn = (1 - pw) * w;
    cur.yaw += (yaw * stuntOn - cur.yaw) * (still ? 1 : per(0.15));
    stunt.rotation.set(0, cur.yaw, 0);
    // #endregion

    // sagoma del drone sullo schermo, per prenderlo con mouse o dito
    const f = camera.position.z / (camera.position.z - cur.z);
    hit.x = vw / 2 + cur.x * f;
    hit.y = ch / 2 - (cur.y + cur.s * 0.12) * f;
    hit.rx = cur.s * 0.62 * f;
    hit.ry = cur.s * 0.34 * f;

    // #region Eliche che girano
    const spinNow = spin * (1 - land); // dopo l'atterraggio le eliche si fermano
    const step = spinNow * dt;
    props.forEach((pr) => {
      pr.rotation.y += pr.userData.dir * step;
      pr.userData.disc.material.opacity = Math.min(0.13, spinNow / 520);
    });
    // #endregion

    // #region Ombra sulla piazzola
    const dock = Math.max(0, 1 - away * 2.5);
    shadow.scale.setScalar(1 - 0.45 * ease);
    shadow.material.opacity = (0.8 - 0.5 * ease) * dock;
    // ombra sulla H del footer: compare e si allarga mentre il drone scende
    landShadow.scale.setScalar(1 - 0.45 * (1 - land));
    landShadow.material.opacity = (0.3 + 0.5 * land) * land;
    // #endregion

    const blink = still || (t % 1.2) < 0.9 ? 1 : 0.15;
    leds.forEach((m) => { m.material.opacity = blink; });

    // strumentazione di volo (lib/telemetry.ts): stato del drone, anche quando non si disegna
    if (onTelemetry) {
      tele.t = t; tele.takeoff = tk; tele.hover = ease; tele.motors = spinNow > 0;
      tele.away = away; tele.land = land; tele.crossing = crossing; tele.climb = climb;
      tele.manual = !!drag || !!placed; tele.route = onRoute; tele.still = still;
      tele.scroll = sy; tele.range = range;
      tele.x = hit.x; tele.y = hit.y; tele.rx = hit.rx; tele.ry = hit.ry;
      onTelemetry(tele);
    }

    // niente render quando piazzola e drone sono fuori schermo
    const padGone = anchor ? anchor.getBoundingClientRect().bottom < -50 : false;
    if (padGone && away < 0.001 && !settling) {
      hit.rx = 0; // non disegnato: non si può prendere
      // dopo un salto istantaneo (link, tasto Fine) l'ultimo fotogramma resterebbe sul canvas fisso: si pulisce
      if (!cleared) { renderer.clear(); cleared = true; }
      return;
    }
    cleared = false;
    // #region Canvas che segue il drone
    // zona da disegnare: drone (con i dischi delle eliche e le inclinazioni) e piazzole che si vedono
    const fd = camera.position.z / (camera.position.z - cur.z);
    const ds = cur.s * fd;
    box.x0 = Infinity; box.y0 = Infinity; box.x1 = -Infinity; box.y1 = -Infinity;
    addBox(vw / 2 + cur.x * fd, ch / 2 - cur.y * fd, ds * 0.95, ds * 0.8, ds * 0.6);
    if (ay + unit > 0 && ay - unit * 2 < ch) addBox(ax, ay, unit * 1.3, unit * 0.9, unit * 0.9);
    if (landRig.visible) {
      const ls = landRig.scale.x, ly = ch / 2 - landRig.position.y;
      if (ly + ls > 0 && ly - ls < ch) addBox(landRig.position.x + vw / 2, ly, ls * 1.3, ls * 0.9, ls * 0.9);
    }
    const m = 12;
    const bx0 = Math.max(0, Math.floor(box.x0 - m));
    const bw = Math.max(1, Math.min(cw, Math.ceil(box.x1 + m)) - bx0);
    // larghezza a passi di 64px: all'avvio quanto piazzola e drone vicini (3 unità), poi cresce solo se serve
    const fit = (v) => Math.min(cw, Math.ceil(v / 64) * 64);
    let resize = false;
    if (!capW || bw > capW) {
      capW = fit(Math.max(bw * (capW ? 1.15 : 1), unit * 3 + 2 * m, capW));
      renderer.setSize(capW, ch, false);
      canvas.style.width = capW + 'px';
      canvas.style.height = ch + 'px';
      resize = true;
    }
    // zona centrata nel canvas, sempre dentro lo schermo
    const x = Math.round(Math.min(Math.max(0, bx0 - (capW - bw) / 2), cw - capW));
    if (x !== boxX || resize) {
      boxX = x;
      canvas.style.transform = `translate3d(${x}px, 0, 0)`;
      camera.setViewOffset(cw, ch, x, 0, capW, ch);
    }
    // #endregion

    // #region Due passaggi di render
    // Due passaggi: prima le piazzole, poi il drone con la profondità azzerata. Quando la pagina fa scorrere
    // una H dietro il drone (la piazzola dello hero che sale), il drone la sorvola invece di passarci in mezzo.
    renderer.clear();
    droneRig.visible = false;
    renderer.render(scene, camera);
    droneRig.visible = true;
    const landShown = landRig.visible;
    padRig.visible = false;
    landRig.visible = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    padRig.visible = true;
    landRig.visible = landShown;
    // #endregion
    // primo fotogramma disegnato: la pagina può togliere l'immagine statica della piazzola
    if (onFirstFrame) {
      const cb = onFirstFrame;
      onFirstFrame = null;
      cb();
    }
  }

  const loop = () => {
    if (dead) return;
    frame();
    raf = requestAnimationFrame(loop);
  };
  loop();

  return function destroy() {
    dead = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('mousemove', onMouse);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('blur', onPointerUp);
    window.removeEventListener('touchstart', onTouchStart);
    html.classList.remove('drone-grab', 'drone-grabbing');
    renderer.dispose();
  };
}
