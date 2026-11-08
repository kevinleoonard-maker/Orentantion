import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Flame, Orbit, Zap } from 'lucide-react';
import { sound } from '../../utils/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

export const PhysicsLab: React.FC<{ onAction: () => void }> = ({ onAction }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [preset, setPreset] = useState<'gravity' | 'plasma' | 'vortex' | 'fire'>('gravity');
  const [gravity, setGravity] = useState<number>(0.12);
  const [spread, setSpread] = useState<number>(4);
  const [maxLife, setMaxLife] = useState<number>(80);
  const [hue, setHue] = useState<number>(190);
  const [particleCount, setParticleCount] = useState<number>(0);

  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; isDown: boolean }>({
    x: 320,
    y: 180,
    active: false,
    isDown: false,
  });

  const applyPreset = (type: 'gravity' | 'plasma' | 'vortex' | 'fire') => {
    setPreset(type);
    if (type === 'gravity') {
      setGravity(0.15);
      setSpread(3);
      setMaxLife(90);
      setHue(195);
    } else if (type === 'plasma') {
      setGravity(0);
      setSpread(6);
      setMaxLife(60);
      setHue(280);
    } else if (type === 'vortex') {
      setGravity(-0.05);
      setSpread(5);
      setMaxLife(100);
      setHue(160);
    } else if (type === 'fire') {
      setGravity(-0.18);
      setSpread(2.5);
      setMaxLife(50);
      setHue(25);
    }
    sound.playBlip(600, 'sine', 0.06);
    onAction();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(9, 13, 22, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      // Spawn particles
      const spawnX = mouse.active ? mouse.x : canvas.width / 2;
      const spawnY = mouse.active ? mouse.y : canvas.height / 2;

      for (let i = 0; i < (mouse.isDown ? 8 : 3); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * spread;
        particlesRef.current.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: maxLife + (Math.random() * 20 - 10),
          hue: (hue + (Math.random() * 40 - 20)) % 360,
          size: Math.random() * 3 + 1.5,
        });
      }

      // Update and draw particles
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life++;

        // Physics: Verlet velocity update
        p.vy += gravity;

        if (preset === 'vortex') {
          // Circular vortex force around center
          const dx = p.x - canvas.width / 2;
          const dy = p.y - canvas.height / 2;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx += (-dy / dist) * 0.25 - (dx / dist) * 0.05;
          p.vy += (dx / dist) * 0.25 - (dy / dist) * 0.05;
        }

        // Mouse attraction when held down
        if (mouse.isDown) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            p.vx += (dx / dist) * 0.35;
            p.vy += (dy / dist) * 0.35;
          }
        }

        // Apply friction
        p.vx *= 0.985;
        p.vy *= 0.985;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0 || p.x > canvas.width) p.vx *= -0.7;
        if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -0.6;
        }

        if (p.life < p.maxLife) {
          alive.push(p);

          const alpha = 1 - p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
          ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${alpha * 0.8})`;
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      particlesRef.current = alive;
      setParticleCount(alive.length);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [gravity, spread, maxLife, hue, preset]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Orbit className="w-4 h-4" />
            <span>Esperimento 1 · Grafica &amp; Fisica Computazionale</span>
          </div>
          <h3 className="text-xl font-bold text-white">Disegna con le Forze dell'Universo</h3>
          <p className="text-sm text-slate-400">
            Muovi il cursore per emettere materia. Tieni premuto per attivare un campo di attrazione gravitazionale.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => applyPreset('gravity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              preset === 'gravity' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gravità
          </button>
          <button
            onClick={() => applyPreset('vortex')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              preset === 'vortex' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vortice
          </button>
          <button
            onClick={() => applyPreset('plasma')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              preset === 'plasma' ? 'bg-purple-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Plasma
          </button>
          <button
            onClick={() => applyPreset('fire')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              preset === 'fire' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fuoco
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Sandbox */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 640;
                mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * 360;
                mouseRef.current.active = true;
              }}
              onMouseEnter={() => { mouseRef.current.active = true; }}
              onMouseLeave={() => { mouseRef.current.active = false; mouseRef.current.isDown = false; }}
              onMouseDown={() => { mouseRef.current.isDown = true; }}
              onMouseUp={() => { mouseRef.current.isDown = false; }}
              className="w-full h-full block cursor-crosshair touch-none"
            />
            <div className="absolute bottom-2 left-3 text-[11px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-md backdrop-blur border border-slate-800/80">
              Particelle attive: <b className="text-cyan-400 tabular-nums">{particleCount}</b>
            </div>
          </div>

          {/* Sliders */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block mb-1">Gravità: {gravity.toFixed(2)}</span>
              <input
                type="range"
                min="-0.2"
                max="0.4"
                step="0.02"
                value={gravity}
                onChange={(e) => { setGravity(parseFloat(e.target.value)); onAction(); }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Dispersione: {spread.toFixed(1)}</span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={spread}
                onChange={(e) => { setSpread(parseFloat(e.target.value)); onAction(); }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Durata: {maxLife}</span>
              <input
                type="range"
                min="30"
                max="140"
                step="5"
                value={maxLife}
                onChange={(e) => { setMaxLife(parseInt(e.target.value, 10)); onAction(); }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Tonalità: {hue}°</span>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={hue}
                onChange={(e) => { setHue(parseInt(e.target.value, 10)); onAction(); }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Code Explanation */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-semibold">
              physicsEngine.ts
            </span>
            <span className="text-xs text-slate-400">Integrazione di Eulero</span>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed mb-3">
            <code>{`// A ogni frame (60 volte al secondo):
particle.vy += ${gravity.toFixed(2)}; // accelerazione gravitazionale

if (mouseAttractorActive) {
  const dx = mouse.x - particle.x;
  const dy = mouse.y - particle.y;
  const dist = Math.hypot(dx, dy);
  particle.vx += (dx / dist) * 0.35; // vettore forza
  particle.vy += (dy / dist) * 0.35;
}

// Aggiorna posizione con velocità e attrito
particle.vx *= 0.985;
particle.x += particle.vx;
particle.y += particle.vy;`}</code>
          </pre>
          <p className="text-xs text-slate-400 leading-relaxed">
            I motori dei videogiochi (come Unreal Engine e Unity) o gli effetti speciali dei film Pixar usano esattamente queste equazioni differenziali per simulare fumo, acqua, galassie ed esplosioni.
          </p>
        </div>
      </div>
    </div>
  );
};
