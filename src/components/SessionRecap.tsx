import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Eye, Lock, Unlock, ArrowRight } from 'lucide-react';
import { MISSIONS, type MissionId } from '../missions';
import { ScrambleText } from './MissionReveal';
import { sound } from '../utils/sound';

interface SessionRecapProps {
  counts: Record<MissionId, number>;
  revealed: Record<MissionId, boolean>;
  onRevealAll: () => void;
  onRestartAll: () => void;
}

// Debriefing: ultima tappa della rotta. Il drone atterra sulla H nella corsia accanto.
export const SessionRecap: React.FC<SessionRecapProps> = ({ counts, revealed, onRevealAll, onRestartAll }) => {
  const [pilotName, setPilotName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const doneCount = MISSIONS.filter((m) => revealed[m.id]).length;
  const allRevealed = doneCount === MISSIONS.length;
  const totalActions = MISSIONS.reduce((sum, m) => sum + counts[m.id], 0);
  const name = pilotName.trim() || 'Pilota KS-01';

  const handleCopy = () => {
    const lines = MISSIONS.map((m) => `- ${m.title} → ${revealed[m.id] ? m.tech : '[classificato]'}`);
    navigator.clipboard.writeText(
      `Missione KS-01 · Open Day Vallauri\nPilota: ${name}\nProve completate: ${doneCount}/${MISSIONS.length}\n${lines.join('\n')}\nNome in codice di tutto questo: Informatica.`,
    );
    setCopied(true);
    sound.playSuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="debriefing" className="scroll-mt-[var(--nav-h)] py-[clamp(48px,9vh,96px)] pb-[clamp(80px,14vh,140px)]">
      <p className="label">Debriefing · WP 07</p>
      <h2 className="mt-4 text-[clamp(48px,6vw,88px)] font-semibold leading-[0.98] tracking-[-0.045em] [text-wrap:balance]">
        Ok, ti dobbiamo <span className="text-faint">una confessione.</span>
      </h2>
      <p className="mt-5 max-w-2xl text-[clamp(17px,1.4vw,20px)] leading-[1.5] text-muted">
        Il drone era una scusa. In questi dieci minuti hai fatto tutt'altro, e ogni prova ha un nome vero.
      </p>

      {/* I sei passaggi: ognuno è una prova da giocare. Il nome vero compare solo dopo «Decifra». */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <p className="label">
          I tuoi passaggi · {doneCount} su {MISSIONS.length} decifrati
        </p>
        <div className="flex w-48 gap-1" aria-hidden="true">
          {MISSIONS.map((m) => (
            <span
              key={m.id}
              className={`h-1.5 flex-1 rounded-full ${
                revealed[m.id] ? 'bg-go' : counts[m.id] >= m.threshold ? 'bg-pad' : 'bg-line-btn'
              }`}
            />
          ))}
        </div>
      </div>
      <ol className="mt-4 border-t border-line">
        {MISSIONS.map((m) => {
          const ready = !revealed[m.id] && counts[m.id] >= m.threshold;
          const left = Math.max(0, m.threshold - counts[m.id]);
          return (
            <li
              key={m.id}
              className="py-5 border-b border-line grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center sm:gap-8"
            >
              <span className="flex items-baseline gap-3 text-[17px] text-muted">
                <span className="font-mono text-[12px]">{m.n}</span>
                {m.title}
              </span>

              {revealed[m.id] ? (
                <span>
                  <ScrambleText
                    text={m.tech}
                    active
                    className="text-[clamp(24px,2.4vw,34px)] font-semibold leading-tight tracking-[-0.025em]"
                  />
                  <span className="mt-1 flex items-center gap-1.5 text-[14px] text-muted">
                    <Check className="h-4 w-4 shrink-0 text-go" aria-hidden="true" /> Decifrata · {m.where}
                  </span>
                </span>
              ) : ready ? (
                <a
                  href={`#decifra-${m.id}`}
                  className="group flex items-center justify-between gap-3 rounded-[16px] border-2 border-pad bg-pad/10 px-4 py-3 hover:bg-pad/20 transition-colors"
                >
                  <span>
                    <span className="flex items-center gap-2 text-[16px] font-semibold">
                      <Unlock className="h-4 w-4 text-pad" aria-hidden="true" /> Prova completata
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-muted-soft">
                      Premi «Decifra» sotto la prova per scoprire il nome e vedere il codice.
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              ) : (
                <a
                  href={`#prova-${m.id}`}
                  className="group flex items-center justify-between gap-3 rounded-[16px] border-2 border-dashed border-line-btn px-4 py-3 hover:border-ink transition-colors"
                >
                  <span>
                    <span className="flex items-center gap-2 text-[16px] font-semibold">
                      <Lock className="h-4 w-4 text-muted" aria-hidden="true" /> Passaggio da completare
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-muted">
                      Gioca la prova {m.n}: ancora {left === 1 ? '1 azione' : `${left} azioni`} per scoprire come si chiama.
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-semibold">
                    Vai alla prova
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </a>
              )}
            </li>
          );
        })}
      </ol>

      {!allRevealed ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-dashed border-line-btn p-5 sm:px-7">
          <p className="text-[16px] text-muted">
            Hai decifrato <b className="text-ink">{doneCount}</b> file su {MISSIONS.length}. Non hai tempo per tutte le
            prove?
          </p>
          <button
            type="button"
            onClick={() => {
              sound.playSuccess();
              onRevealAll();
            }}
            className="btn btn-primary"
          >
            <Eye className="w-[18px] h-[18px]" /> Rivela tutto
          </button>
        </div>
      ) : (
        <div className="mt-14">
          <p className="text-[clamp(19px,1.8vw,24px)] text-muted">Tutte queste cose messe insieme si chiamano</p>
          <ScrambleText
            text="Informatica."
            active
            className="block mt-2 text-[clamp(64px,11vw,180px)] font-semibold leading-[0.9] tracking-[-0.05em]"
          />
          <p className="mt-6 max-w-xl text-[clamp(17px,1.4vw,20px)] leading-[1.5] text-muted">
            Ed è quello che facciamo ogni giorno, qui, in laboratorio. Il prossimo drone lo programmi tu.
          </p>
          <p className="mt-3 label">Indirizzo Informatica e Telecomunicazioni · Istituto Vallauri, Fossano</p>
        </div>
      )}

      <div className="mt-12 rounded-[24px] bg-surface-2 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Patentino di volo</p>
            <h3 className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.025em]">{name}</h3>
          </div>
          <label className="flex items-center gap-3 label normal-case tracking-normal text-[14px]">
            Il tuo nome
            <input
              type="text"
              value={pilotName}
              placeholder="Pilota KS-01"
              onChange={(e) => setPilotName(e.target.value)}
              className="w-44 px-4 py-2 rounded-full bg-paper border border-line-btn text-[15px] text-ink focus:outline-none focus:border-ink"
            />
          </label>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 font-mono">
          <div className="rounded-[18px] bg-paper p-4">
            <dt className="label">Prove completate</dt>
            <dd className="mt-1 text-[28px] font-semibold tabular-nums">
              {doneCount}/{MISSIONS.length}
            </dd>
          </div>
          <div className="rounded-[18px] bg-paper p-4">
            <dt className="label">Comandi dati al drone</dt>
            <dd className="mt-1 text-[28px] font-semibold tabular-nums">{totalActions}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={handleCopy} className="btn btn-secondary !py-3 !px-5 !text-[15px]">
            {copied ? <Check className="w-4 h-4 text-go" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiato' : 'Copia il patentino'}
          </button>
          <button type="button" onClick={onRestartAll} className="flex items-center gap-1.5 label hover:text-ink">
            <RotateCcw className="w-3.5 h-3.5" /> Nuovo pilota
          </button>
        </div>
      </div>
    </section>
  );
};
