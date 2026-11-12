import { Brain, Compass, Eye, Network, KeyRound, Cpu } from 'lucide-react';
import { CODE } from './missionCode';

export type MissionId = 'ai' | 'path' | 'vision' | 'network' | 'crypto' | 'cpu';

// Unica fonte per hero, barra, schede e rivelazione finale.
// `tech` è sempre visibile nelle schede di "Una rotta, sei tappe"; solo nel debriefing resta coperto finché il
// visitatore non decifra la prova (count >= threshold).
// `reveal` e `code` si vedono solo dopo "Decifra": scritti per ragazzi di terza media (frasi corte, niente gergo
// senza spiegazione). `code` è un riassunto in Python di come funziona la prova, in missionCode.ts.
export const MISSIONS = [
  {
    id: 'ai',
    n: '01',
    title: 'Insegnagli a volare',
    teaser: 'Venti droni appena accesi. Nessuno sa volare. Guardali schiantarsi... e poi smettere di farlo.',
    tech: 'Intelligenza Artificiale',
    reveal:
      'Nessuno ha spiegato ai droni come si vola. Ognuno ha un piccolo cervello digitale che decide quando saltare. All\'inizio sbagliano tutti. I più bravi passano il loro cervello ai droni dopo di loro, con un piccolo cambiamento a caso: proprio come l\'evoluzione degli animali. Dopo poche generazioni volano da soli. Il nome tecnico è neuroevoluzione.',
    code: CODE.ai,
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
      'Il drone non va a tentativi. Per ogni quadretto fa un conto: quanta strada ha già fatto, più quanta ne manca (a occhio) per arrivare. Prova sempre prima il quadretto con il totale più basso, e così trova la strada più corta. Si chiama A* (si legge "A star") ed è stato inventato nel 1968 per far muovere da solo un robot.',
    code: CODE.path,
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
      'Per il computer una foto è solo una tabella di numeri: ogni numero dice quanto è chiaro un puntino. Una piccola griglia 3×3 scorre sulla foto e confronta ogni puntino con i suoi vicini. Dove i numeri cambiano di colpo, c\'è il bordo di un oggetto. È il primo passo per riconoscere facce, cartelli e ostacoli. Il nome del trucco è convoluzione.',
    code: CODE.vision,
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
      'Un messaggio non viaggia tutto intero: viene tagliato in tanti pacchetti numerati, che possono arrivare in disordine. Se un numero manca, chi riceve se ne accorge e lo richiede. Alla fine i pezzi si rimettono in ordine. Questo sistema si chiama TCP e fa funzionare tutto Internet.',
    code: CODE.network,
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
      'Un sito serio non salva mai la tua password: salva la sua impronta (SHA-256), un codice che sembra scritto a caso. Se cambi anche una sola lettera, l\'impronta cambia tutta. Per scoprire la chiave un pirata deve provarle tutte: ogni carattere in più moltiplica il tempo, fino a milioni di anni.',
    code: CODE.crypto,
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
      'Dentro ogni chip c\'è un ciclo che si ripete miliardi di volte al secondo: prende un\'istruzione dalla memoria, capisce cosa vuol dire, la esegue. Poi passa alla successiva. Quello che hai appena scritto si chiama Assembly: è il linguaggio più vicino al chip.',
    code: CODE.cpu,
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
