import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { MISSIONS, type Mission } from '../missions';
import { APERTURA, COME_FUNZIONA, FINALE, NOTES } from '../speakerNotes';
import { CodeBlock } from '../components/CodePeek';

// Pagina per chi presenta (speaker.html, indirizzo /speaker). Una scheda per ogni schermata del sito: cosa fa, cosa
// fanno i ragazzi, cosa dire, il codice. In alto a destra di ogni scheda c'è com'è la schermata sul sito
// (public/speaker/*.jpg: sono foto scattate, se cambi l'aspetto del sito vanno rifatte).
// Tutto quello che esiste già (titoli, tecnologia, codice, azioni per Decifra) arriva da missions.ts.

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="label">{children}</p>;

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[17px] leading-[1.55] text-muted-soft marker:text-faint">
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

const Para: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-2 text-[17px] leading-[1.55] text-muted-soft">{children}</p>
);

interface CardProps {
  id: string;
  kicker: string;
  title: string;
  tag?: string;
  dot?: string;
  img: string;
  siteHref: string;
  children: React.ReactNode;
}

// Titolo a sinistra, com'è sul sito nell'angolino a destra, poi il testo. Su telefono: titolo, immagine, testo.
const Card: React.FC<CardProps> = ({ id, kicker, title, tag, dot, img, siteHref, children }) => (
  <section
    id={id}
    className="scroll-mt-[88px] rounded-[24px] bg-surface-2 p-6 sm:p-8 grid gap-x-8 gap-y-5 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_300px]"
  >
    <header className="md:col-start-1 md:row-start-1">
      <p className="label flex items-center gap-2.5">
        {dot && <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />}
        {kicker}
      </p>
      <h2 className="mt-3 text-[clamp(28px,3.4vw,44px)] font-semibold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
        {title}
      </h2>
      {tag && (
        <p className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-[14px] text-muted-soft">
          Tecnologia: <b className="text-ink">{tag}</b>
        </p>
      )}
    </header>

    <figure className="md:col-start-2 md:row-start-1 md:row-span-2 self-start">
      <a href={img} target="_blank" rel="noreferrer" aria-label={`Ingrandisci com'è la sezione «${title}» sul sito`}>
        <img
          src={img}
          alt={`Come appare sul sito la sezione «${title}»`}
          loading="lazy"
          className="w-full h-auto rounded-[14px] border border-line-btn bg-white"
        />
      </a>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12.5px] text-muted">
        <span>Come appare sul sito · clic per ingrandire</span>
        <a href={siteHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink hover:underline">
          Apri sul sito <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </figcaption>
    </figure>

    <div className="md:col-start-1 md:row-start-2 space-y-6">{children}</div>
  </section>
);

const MissionCard: React.FC<{ m: Mission; index: number }> = ({ m, index }) => {
  const note = NOTES[m.id];
  return (
    <Card
      id={`sezione-${index + 1}`}
      kicker={`Sezione ${index + 1} · Prova ${m.n}`}
      title={m.title}
      tag={m.tech}
      dot={m.dot}
      img={`/speaker/${m.id}.jpg`}
      siteHref={`/#prova-${m.id}`}
    >
      <div>
        <Label>Cosa fa</Label>
        <Para>{note.cosaFa}</Para>
      </div>
      <div>
        <Label>Cosa fanno i ragazzi</Label>
        <Bullets items={note.ragazzi} />
      </div>
      <div>
        <Label>Come compare «Decifra»</Label>
        <Para>
          Servono <b className="text-ink">{m.threshold} azioni</b>. {note.azioni}
        </Para>
      </div>
      <div>
        <Label>Cosa puoi dire</Label>
        <Para>{note.daDire}</Para>
        <Para>
          <span className="text-faint">Lo trovi in:</span> {m.where}.
        </Para>
      </div>
      <div>
        <Label>Il codice in tre frasi</Label>
        <Bullets items={note.codice} />
        <details className="mt-4">
          <summary className="label cursor-pointer select-none hover:text-ink">Mostra il codice</summary>
          <CodeBlock code={m.code} className="mt-3" />
        </details>
      </div>
    </Card>
  );
};

const EdgeCard: React.FC<{
  id: string;
  data: typeof APERTURA;
  img: string;
  siteHref: string;
}> = ({ id, data, img, siteHref }) => (
  <Card id={id} kicker={data.titolo} title={data.sottotitolo} img={img} siteHref={siteHref}>
    <div>
      <Label>Cosa fa</Label>
      <Para>{data.cosaFa}</Para>
    </div>
    <div>
      <Label>Cosa fanno i ragazzi</Label>
      <Bullets items={data.ragazzi} />
    </div>
    <div>
      <Label>Cosa puoi dire</Label>
      <Para>{data.daDire}</Para>
    </div>
  </Card>
);

export default function SpeakerPage() {
  const nav = [
    { href: '#apertura', label: 'Apertura' },
    ...MISSIONS.map((m, i) => ({ href: `#sezione-${i + 1}`, label: String(i + 1) })),
    { href: '#finale', label: 'Finale' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-[var(--nav-bg)] px-[var(--gutter)] py-3 backdrop-blur">
        <span className="font-semibold tracking-[-0.025em]">Missione KS-01 · Guida per chi presenta</span>
        <a href="/" className="btn btn-secondary !py-2 !px-4 !text-[14px] shrink-0 whitespace-nowrap">
          Apri il sito
        </a>
      </header>

      <main className="mx-auto max-w-[1100px] px-[var(--gutter)] py-[clamp(32px,6vh,64px)]">
        <p className="label">Open Day · Istituto Vallauri · Fossano</p>
        <h1 className="mt-4 text-[clamp(40px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.045em] [text-wrap:balance]">
          Come presentare il sito
        </h1>
        <p className="mt-5 max-w-2xl text-[clamp(17px,1.4vw,20px)] leading-[1.5] text-muted">
          Una pagina sola, da tenere aperta mentre presenti. Per ogni sezione trovi cosa fa, cosa fanno i ragazzi, cosa
          puoi dire e il codice spiegato in parole semplici. In alto a destra vedi com'è la sezione sul sito.
        </p>

        <section className="mt-10 rounded-[24px] border border-dashed border-line-btn p-6 sm:p-8">
          <Label>Il sito in breve</Label>
          <Bullets items={COME_FUNZIONA} />
        </section>

        <nav aria-label="Sezioni" className="mt-8 flex flex-wrap items-center gap-2">
          <span className="label mr-1">Vai a</span>
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="btn btn-secondary !py-2 !px-4 !text-[14px]">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-6">
          <EdgeCard id="apertura" data={APERTURA} img="/speaker/home.jpg" siteHref="/" />
          {MISSIONS.map((m, i) => (
            <MissionCard key={m.id} m={m} index={i} />
          ))}
          <EdgeCard id="finale" data={FINALE} img="/speaker/finale.jpg" siteHref="/#debriefing" />
        </div>

        <p className="mt-12 text-[13px] text-muted">
          Questa pagina è per chi presenta e non è collegata dal sito: si apre solo da questo indirizzo.
        </p>
      </main>
    </div>
  );
}
