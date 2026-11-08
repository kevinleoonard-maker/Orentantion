import React, { useState, useEffect } from 'react';
import { Cloud, Server, AlertTriangle, CheckCircle2, Zap, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/sound';

interface ServerInstance {
  id: number;
  cpu: number;
  status: 'healthy' | 'crashed' | 'scaling';
}

export const CloudLab: React.FC<{ onAction: () => void }> = ({ onAction }) => {
  const [trafficRPS, setTrafficRPS] = useState<number>(450);
  const [architecture, setArchitecture] = useState<'single' | 'cloud'>('cloud');
  const [servers, setServers] = useState<ServerInstance[]>([
    { id: 1, cpu: 45, status: 'healthy' },
    { id: 2, cpu: 40, status: 'healthy' },
  ]);

  // Handle traffic and auto-scaler logic
  useEffect(() => {
    if (architecture === 'single') {
      const load = Math.min(100, Math.round((trafficRPS / 500) * 100));
      setServers([
        {
          id: 1,
          cpu: load,
          status: load >= 100 ? 'crashed' : 'healthy',
        },
      ]);
    } else {
      // Cloud auto-scaling: 1 server handles ~400 RPS comfortably
      const targetInstances = Math.min(8, Math.max(2, Math.ceil(trafficRPS / 450)));
      setServers((prev) => {
        const next: ServerInstance[] = [];
        const perServerLoad = Math.min(95, Math.max(15, Math.round((trafficRPS / targetInstances / 500) * 100)));

        for (let i = 1; i <= targetInstances; i++) {
          const existing = prev.find((s) => s.id === i);
          if (existing && existing.status === 'crashed') {
            next.push(existing);
          } else {
            next.push({
              id: i,
              cpu: perServerLoad + Math.floor(Math.sin(i) * 5),
              status: 'healthy',
            });
          }
        }
        return next;
      });
    }
  }, [trafficRPS, architecture]);

  const triggerSpike = () => {
    setTrafficRPS(3800);
    sound.playBlip(750, 'sawtooth', 0.15);
    onAction();
  };

  const triggerChaosMonkey = () => {
    setServers((prev) => {
      const active = prev.filter((s) => s.status === 'healthy');
      if (active.length === 0) return prev;
      const target = active[Math.floor(Math.random() * active.length)];
      return prev.map((s) => (s.id === target.id ? { ...s, status: 'crashed', cpu: 0 } : s));
    });
    sound.playCrash();
    onAction();
  };

  const resetServers = () => {
    setTrafficRPS(400);
    sound.playSuccess();
    onAction();
  };

  const isSystemDown = servers.every((s) => s.status === 'crashed') || (architecture === 'single' && servers[0]?.cpu >= 100);
  const latencyMs = isSystemDown ? 9999 : Math.round(15 + (trafficRPS / (servers.length * 500)) * 35);
  const errorRate = isSystemDown ? 100 : (latencyMs > 80 ? 5.2 : 0.0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Cloud className="w-4 h-4" />
            <span>Esperimento 4 · Sistemi Distribuiti, Cloud &amp; Scalabilità</span>
          </div>
          <h3 className="text-xl font-bold text-white">Quando Arriva un Milione di Utenti: Auto-Scaling</h3>
          <p className="text-sm text-slate-400">
            Un singolo computer collassa al primo picco di traffico. Nel cloud i carichi si distribuiscono automaticamente tra decine di nodi.
          </p>
        </div>

        {/* Architecture Mode */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => { setArchitecture('single'); sound.playBlip(400, 'sine', 0.05); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              architecture === 'single' ? 'bg-rose-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            1 Solo Server Monolitico
          </button>
          <button
            onClick={() => { setArchitecture('cloud'); sound.playBlip(550, 'sine', 0.05); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              architecture === 'cloud' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud Kubernetes (Auto-Scale)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Server Farm Visualizer */}
        <div className="lg:col-span-7 space-y-5">
          {/* Status HUD */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSystemDown ? (
                <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              )}
              <div>
                <div className="text-sm font-bold text-white">
                  {isSystemDown ? 'SERVER CRASH / OVERLOAD' : 'SISTEMA ONLINE & NOMINALE'}
                </div>
                <div className="text-xs text-slate-400">
                  {architecture === 'single' ? 'Architettura monolitica' : `${servers.length} repliche container attive`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Latenza p99:</span>
                <span className={`font-bold ${latencyMs > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isSystemDown ? 'TIMEOUT' : `${latencyMs}ms`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Error Rate:</span>
                <span className={`font-bold ${errorRate > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {errorRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Grid of Server Nodes */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#090d16] min-h-[160px] flex flex-wrap items-center gap-3">
            {servers.map((srv) => (
              <div
                key={srv.id}
                className={`flex-1 min-w-[130px] p-3.5 rounded-xl border transition-all ${
                  srv.status === 'crashed'
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Node #{srv.id}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${srv.status === 'crashed' ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {srv.status === 'crashed' ? 'OFFLINE' : 'RUNNING'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>CPU Load:</span>
                    <span className="font-bold tabular-nums">{srv.cpu}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        srv.cpu > 85 ? 'bg-rose-500' : srv.cpu > 65 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${srv.cpu}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Traffic Controller Slider */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-semibold">Traffico Richieste Utenti:</span>
              <span className="text-cyan-400 font-bold text-sm tabular-nums">
                {trafficRPS.toLocaleString('it-IT')} req/sec
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={trafficRPS}
              onChange={(e) => { setTrafficRPS(parseInt(e.target.value, 10)); onAction(); }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={triggerSpike}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simula Picco Improvviso (3.800 RPS)</span>
              </button>
              {architecture === 'cloud' && (
                <button
                  onClick={triggerChaosMonkey}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-all"
                >
                  Chaos Monkey (Guasto Nodo)
                </button>
              )}
              <button
                onClick={resetServers}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:text-white transition-all ml-auto"
              >
                Reset Normale
              </button>
            </div>
          </div>
        </div>

        {/* Right: Code & Architecture Logic */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-semibold">
              autoScaler.ts
            </span>
            <span className="text-xs text-slate-400">Algoritmo di Bilanciamento</span>
          </div>

          <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
            <code>{`// Logica del Load Balancer:
const targetRepliche = Math.ceil(richiesteAlSecondo / 450);

if (targetRepliche > cluster.istanzeAttive) {
  // Avvia nuovi container Docker in 1.2 secondi
  await cloudProvider.scaleOut({
    servizio: "api-backend",
    targetCount: targetRepliche
  });
}

// Instradamento Round-Robin con Health Check:
const nodoLibero = cluster.nodi.find(n => n.cpu < 80);
await inoltraRichiesta(nodoLibero, utente);`}</code>
          </pre>

          <p className="text-xs text-slate-400 leading-relaxed">
            Piattaforme come Netflix, Spotify e Amazon usano questa esatta logica per servire centinaia di milioni di persone contemporaneamente senza mai andare offline.
          </p>
        </div>
      </div>
    </div>
  );
};
