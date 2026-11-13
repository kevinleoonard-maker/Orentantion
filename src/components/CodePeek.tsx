import React from 'react';

// Blocco di codice scuro in mono. I commenti (dal primo #) sono più chiari: sono quelli che spiegano cosa fa ogni
// pezzo. Il # non compare mai dentro una stringa (vedi missionCode.ts). Su telefono scorre di lato.
export const CodeBlock: React.FC<{ code: string; className?: string }> = ({ code, className = '' }) => {
  const lines = code.split('\n');
  return (
    <pre
      tabIndex={0}
      aria-label="Codice Python semplificato"
      className={`overflow-x-auto rounded-[16px] border border-white/10 bg-night p-4 sm:p-5 font-mono text-[13px] sm:text-sm leading-[1.75] text-white ${className}`}
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

// Il codice della prova in poche righe, con titolo e nota: è la parte "Sotto il cofano" della rivelazione.
export const CodePeek: React.FC<{ code: string }> = ({ code }) => (
  <div className="mt-7">
    <p className="label">Sotto il cofano · la prova in poche righe</p>
    <CodeBlock code={code} className="mt-3" />
    <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">
      È Python semplificato: non è identico al codice di questo sito, ma l'idea è la stessa. Prova a leggerlo: i
      commenti in grigio, quelli che iniziano con #, ti spiegano cosa fa ogni pezzo.
    </p>
  </div>
);
