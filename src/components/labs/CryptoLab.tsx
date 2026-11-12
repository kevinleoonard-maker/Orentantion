import React, { useState, useMemo } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Cpu, Smartphone, Server, Sparkles } from 'lucide-react';
import { sha256, analyzePassword } from '../../utils/crypto';
import { sound } from '../../utils/sound';

export const CryptoLab: React.FC<{ onAction: () => void }> = ({ onAction }) => {
  const [password, setPassword] = useState<string>('KS-01drone!');
  const [referencePassword, setReferencePassword] = useState<string>('KS-01drone');

  const analysis = useMemo(() => analyzePassword(password), [password]);
  const currentHash = useMemo(() => sha256(password), [password]);
  const referenceHash = useMemo(() => sha256(referencePassword), [referencePassword]);

  // Compute differing characters between hashes to demonstrate avalanche effect
  const hashComparison = useMemo(() => {
    let diffCount = 0;
    const items = [];
    for (let i = 0; i < currentHash.length; i++) {
      const isDiff = currentHash[i] !== referenceHash[i];
      if (isDiff) diffCount++;
      items.push({ char: currentHash[i], isDiff });
    }
    return { items, diffPercent: Math.round((diffCount / 64) * 100) };
  }, [currentHash, referenceHash]);

  const handlePasswordChange = (val: string) => {
    setReferencePassword(password);
    setPassword(val);
    sound.playBlip(500, 'sine', 0.03);
    onAction();
  };

  const setPreset = (pw: string) => {
    setReferencePassword(password);
    setPassword(pw);
    sound.playSuccess();
    onAction();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
          <KeyRound className="w-4 h-4" />
          <span>Prova 05 · Antifurto</span>
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">
          Scegli la chiave del telecomando
        </h3>
        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
          Un pirata vuole prendersi il drone provando tutte le chiavi possibili, una dopo l'altra. Scrivi la tua e guarda quanto ci metterebbe. Poi cambia una sola lettera e osserva cosa succede all'impronta.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input & Avalanche Effect */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="crypto-pw-input" className="font-semibold uppercase tracking-wider text-slate-300">
                Chiave del drone (non esce da questa pagina):
              </label>
              <span className="text-slate-500 font-mono">{password.length} caratteri</span>
            </div>
            <input
              id="crypto-pw-input"
              type="text"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-base font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Digita una password di prova..."
              spellCheck={false}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Prova:</span>
            <button
              onClick={() => setPreset('123456')}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-rose-400 hover:border-rose-500/50"
            >
              123456
            </button>
            <button
              onClick={() => setPreset('password')}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-rose-400 hover:border-rose-500/50"
            >
              password
            </button>
            <button
              onClick={() => setPreset('Vallauri2026!')}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-cyan-400 hover:border-cyan-500/50"
            >
              Vallauri2026!
            </button>
            <button
              onClick={() => setPreset('c4vallo-batteria-luna-42')}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-emerald-400 hover:border-emerald-500/50"
            >
              c4vallo-batteria-luna-42
            </button>
          </div>

          {/* SHA-256 Hash Display with Avalanche Highlights */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-semibold">Impronta SHA-256 (64 caratteri esadecimali):</span>
              <span className="text-slate-400">256 bit di stato</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs break-all leading-relaxed">
              {hashComparison.items.map((item, idx) => (
                <span
                  key={idx}
                  className={item.isDiff ? 'text-amber-400 font-bold bg-amber-950/40 px-0.5 rounded' : 'text-slate-300'}
                >
                  {item.char}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <b className="text-amber-400">Effetto Valanga:</b> Cambiare anche una sola virgola rimescola completamente tutti i 256 bit. È matematicamente impossibile risalire alla password dall'impronta (funzione a senso unico).
              </span>
            </p>
          </div>
        </div>

        {/* Right: Hardware Attack Time Simulator & Entropy */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {analysis.score === 'weak' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-sm font-bold text-white">Quanto ci mette il pirata?</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
              {analysis.entropyBits} bit di entropia
            </span>
          </div>

          {/* Crack Times Table */}
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span>Smartphone (100k test/s):</span>
              </div>
              <span className="font-mono font-bold text-slate-100">{analysis.crackTimes.mobile}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>PC Gaming RTX 4090 (1 mld/s):</span>
              </div>
              <span className="font-mono font-bold text-slate-100">{analysis.crackTimes.gpuGaming}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Server className="w-4 h-4 text-rose-400" />
                <span>Supercomputer Cluster (10k mld/s):</span>
              </div>
              <span className="font-mono font-bold text-slate-100">{analysis.crackTimes.gpuCluster}</span>
            </div>
          </div>

          {/* Password Hygiene Checklist */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className={`flex items-center gap-1.5 ${password.length >= 12 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span>{password.length >= 12 ? '✓' : '✗'} 12+ caratteri</span>
            </div>
            <div className={`flex items-center gap-1.5 ${analysis.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span>{analysis.hasUpper ? '✓' : '✗'} Maiuscole</span>
            </div>
            <div className={`flex items-center gap-1.5 ${analysis.hasDigits ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span>{analysis.hasDigits ? '✓' : '✗'} Numeri</span>
            </div>
            <div className={`flex items-center gap-1.5 ${analysis.hasSymbols ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span>{analysis.hasSymbols ? '✓' : '✗'} Simboli speciali</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
