import React from 'react';
import { Code } from 'lucide-react';

// Blocco di codice scuro in mono. I commenti (dal primo #) sono più chiari: sono quelli che spiegano cosa fa ogni
// pezzo. Il # non compare mai dentro una stringa (vedi missionCode.ts). Su telefono scorre di lato.
export const CodeBlock: React.FC<{ code: string; className?: string }> = ({ code, className = '' }) => {
  const lines = code.split('\n');
  return (
    <pre
      tabIndex={0}
      aria-label="Codice Python semplificato"
      className={`overflow-x-auto rounded-[16px] border border-white/10 bg-night p-4 sm:p-5 font-mono text-[13px] sm:text-[15px] leading-[1.75] text-white ${className}`}
    >
      <code>
        {lines.map((line, i) => {
          const at = line.indexOf('#');
          return (
            <React.Fragment key={i}>
              {at < 0 ? line : line.slice(0, at)}
              {at >= 0 && <span className="text-white/60">{line.slice(at)}</span>}
              {i < lines.length - 1 && '\n'}
            </React.Fragment>
          );
        })}
      </code>
    </pre>
  );
};

// Il codice della prova in poche righe: è il premio di «Decifra», quindi ha un titolo grande, un'etichetta con il
// linguaggio e un riquadro che si stacca dalla scheda. L'id serve al pulsante «Guarda il codice» in cima alla scheda.
export const CodePeek: React.FC<{ code: string; id?: string }> = ({ code, id }) => (
  <div id={id} className="mt-8 scroll-mt-[calc(var(--nav-h)+16px)] rounded-[20px] border border-pad/40 bg-paper p-4 sm:p-5">
    <p className="flex items-center gap-3 text-[clamp(18px,1.7vw,22px)] font-semibold leading-snug tracking-[-0.015em]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pad text-[#111]" aria-hidden="true">
        <Code className="h-5 w-5" />
      </span>
      Ecco il codice che c'è dietro
    </p>
    <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-soft">
      La prova che hai appena fatto, raccontata in poche righe di Python. Leggi i commenti in grigio, quelli che iniziano
      con #: ti spiegano cosa fa ogni pezzo.
    </p>
    <div className="mt-4 overflow-hidden rounded-[16px] border border-white/10 bg-night">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-white/70">
        <span>Python · versione semplificata</span>
        <span>{code.split('\n').length} righe</span>
      </div>
      <CodeBlock code={code} className="!rounded-none !border-0" />
    </div>
    <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">
      Non è identico al codice di questo sito, ma l'idea è la stessa.
    </p>
  </div>
);
