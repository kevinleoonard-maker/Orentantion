import { Brain, Compass, Eye, Network, KeyRound, Cpu } from 'lucide-react';

export type MissionId = 'ai' | 'path' | 'vision' | 'network' | 'crypto' | 'cpu';

// Unica fonte per hero, barra, schede e rivelazione finale.
// `tech` resta censurato finché il visitatore non completa la prova (count >= threshold).
export const MISSIONS = [
  {
    id: 'ai',
    n: '01',
    title: 'Insegnagli a volare',
    teaser: 'Venti droni appena accesi. Nessuno sa volare. Guardali schiantarsi... e poi smettere di farlo.',
    tech: 'Intelligenza Artificiale',
    reveal:
      'Nessuno ha scritto le istruzioni per volare. Ogni drone ha una piccola rete neurale: i migliori sopravvivono e passano il loro "cervello" alla generazione dopo, con qualche mutazione. Si chiama neuroevoluzione.',
    where: 'ChatGPT, auto a guida autonoma, i consigli di TikTok e Netflix',
    icon: Brain,
    dot: 'bg-sky-400',
    threshold: 3,
  },
  {
    id: 'path',
    n: '02',
    title: 'Trovagli la strada',
    teaser: 'Palazzi, zone vietate e una piazzola di atterraggio. Tu costruisci gli ostacoli, lui trova la via.',
    tech: 'Algoritmi',
    reveal:
      'Il drone non va a tentativi: esplora la mappa con la formula f = g + h e trova sempre la rotta più corta. È l\'algoritmo A*, uno dei più famosi della teoria dei grafi.',
    where: 'Google Maps, i nemici nei videogiochi, i robot nei magazzini Amazon',
    icon: Compass,
    dot: 'bg-emerald-400',
    threshold: 2,
  },
  {
    id: 'vision',
    n: '03',
    title: 'Dagli gli occhi',
    teaser: 'La sua telecamera vede solo numeri. Disegna qualcosa e scopri cosa ci capisce.',
    tech: 'Computer Vision',
    reveal:
      'Un\'immagine per il computer è una tabella di numeri. Facendola scorrere sotto una griglia 3×3 (una convoluzione) il drone trova i bordi degli oggetti. È il primo passo per riconoscere facce, cartelli e ostacoli.',
    where: 'Face ID, Tesla, i filtri di Instagram, la diagnosi medica',
    icon: Eye,
    dot: 'bg-rose-400',
    threshold: 2,
  },
  {
    id: 'network',
    n: '04',
    title: 'Fallo parlare con la base',
    teaser: 'Il segnale arriva a pezzi. Prova a sabotarlo: vediamo se il messaggio sopravvive.',
    tech: 'Reti e Internet',
    reveal:
      'I dati non viaggiano interi: vengono spezzati in pacchetti numerati. Se uno si perde, il protocollo TCP se ne accorge e lo rispedisce. È così che funziona tutto Internet.',
    where: 'WhatsApp, Fortnite online, le videochiamate, lo streaming',
    icon: Network,
    dot: 'bg-purple-400',
    threshold: 2,
  },
  {
    id: 'crypto',
    n: '05',
    title: 'Proteggilo dai pirati',
    teaser: 'Qualcuno vuole rubare il drone. Scegli la chiave del telecomando e scopri quanto resisterebbe.',
    tech: 'Cybersecurity',
    reveal:
      'La chiave non viene mai salvata così com\'è: diventa un\'impronta SHA-256 e basta cambiare una lettera per stravolgerla. Più è lunga, più anni servono a un attaccante per indovinarla.',
    where: 'Le password dei tuoi account, l\'home banking, le criptovalute',
    icon: KeyRound,
    dot: 'bg-cyan-400',
    threshold: 3,
  },
  {
    id: 'cpu',
    n: '06',
    title: 'Aprigli il cervello',
    teaser: 'Dentro c\'è un chip che sa fare solo somme. Miliardi al secondo. Rallentalo e guarda.',
    tech: 'Architettura dei Calcolatori',
    reveal:
      'Ogni processore ripete all\'infinito tre passi: preleva un\'istruzione, la decodifica, la esegue. Hai appena programmato in Assembly, la lingua più vicina al silicio.',
    where: 'Ogni smartphone, PC, console e... ogni drone',
    icon: Cpu,
    dot: 'bg-amber-400',
    threshold: 3,
  },
] as const satisfies readonly {
  id: MissionId;
  [k: string]: unknown;
}[];

export type Mission = (typeof MISSIONS)[number];

// Strumentazione di volo (lib/telemetry.ts, FlightTag, FlightStatus): testi dal sito del drone di Kevin Saccato.
export const telemetry = {
  drone: 'KS-01',
  status: {
    off: 'Motori spenti',
    armed: 'Motori accesi',
    takeoff: 'Decollo',
    flight: 'In volo',
    crossing: 'Traversata',
    manual: 'Manuale',
    landing: 'Atterraggio',
    landed: 'Atterrato',
  },
} as const;

export const hero = {
  takeoff: 'Decollo · Istituto Vallauri · 44.55°N 7.72°E',
  coords: 'Fossano 44.55°N 7.72°E',
};
