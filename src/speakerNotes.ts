import type { MissionId } from './missions';

// Testi della pagina per chi presenta (speaker.html). Frasi corte e parole di tutti i giorni: lo speaker deve poter
// leggere e spiegare al volo. Nome della prova, tecnologia, codice e numero di azioni per "Decifra" si leggono
// da missions.ts (così non restano indietro); qui c'è solo quello che serve allo speaker.
// Se cambi una prova (pulsanti, testi), aggiorna anche queste note.

export interface SpeakerNote {
  /** Cosa fa la prova, in una o due frasi. */
  cosaFa: string;
  /** Cosa fanno i ragazzi: i pulsanti hanno il nome che si vede sul sito. */
  ragazzi: string[];
  /** Cosa conta come "azione" per far comparire il pulsante Decifra. */
  azioni: string;
  /** Cosa può dire lo speaker, in parole semplici. */
  daDire: string;
  /** Il codice in poche frasi, nello stesso ordine dei commenti numerati nel codice. */
  codice: string[];
}

export const NOTES: Record<MissionId, SpeakerNote> = {
  ai: {
    cosaFa:
      'Venti droni provano a volare tra i palazzi. All\'inizio non sanno farlo e cadono quasi subito. Dopo ogni tentativo il gioco tiene il drone arrivato più lontano e ne fa dei nuovi con lo stesso cervello, cambiato un pochino. Dopo 3-6 generazioni volano bene.',
    ragazzi: [
      'Guardano i droni cadere e migliorare. In alto c\'è il numero della generazione.',
      'Possono pilotare loro: premono «Pilota tu contro i droni» e saltano con la barra spaziale o la freccia in su.',
      'Possono cambiare la velocità, mettere in pausa o ricominciare con droni nuovi (il pulsante con la freccia che gira).',
    ],
    azioni:
      'Ogni nuova generazione conta: parte da sola quando tutti i droni sono caduti, quindi basta aspettare. Contano anche i salti di chi pilota e il pulsante per ricominciare.',
    daDire:
      'Nessuno ha insegnato ai droni a volare: imparano da soli, come fa l\'evoluzione con gli animali. È un esempio di Intelligenza Artificiale, la stessa famiglia di ChatGPT e delle auto che si guidano da sole.',
    codice: [
      'All\'inizio ci sono 20 droni, ognuno con un cervello scelto a caso.',
      'Punto 1: tutti volano finché si schiantano. Più restano in aria, più punti fanno.',
      'Punti 2 e 3: restano i due migliori. La nuova generazione prende i loro cervelli e li cambia un pochino a caso (le mutazioni). Poi si ricomincia da capo.',
    ],
  },

  path: {
    cosaFa:
      'Una mappa a quadretti con la base, la piazzola di atterraggio e dei palazzi. Il drone esplora i quadretti e trova sempre la strada più corta.',
    ragazzi: [
      'Cliccano sulle caselle per costruire o demolire palazzi.',
      'Premono «Lancia il drone» e guardano come esplora la mappa.',
      'Provano a chiudergli la strada. Con «Città casuale» il gioco costruisce i palazzi da solo; c\'è anche un pulsante per svuotare la mappa.',
    ],
    azioni:
      'Contano ogni clic su una casella, ogni «Lancia il drone», ogni «Città casuale» e lo svuotamento della mappa.',
    daDire:
      'Il drone non va a tentativi: per ogni quadretto fa un piccolo conto (strada già fatta più strada che manca) e prova per primo quello che promette meglio. È come il navigatore del telefono. Il metodo si chiama A*, del 1968.',
    codice: [
      'Parte dal via e si segna quanti passi ha fatto per arrivare a ogni quadretto.',
      'Sceglie sempre il quadretto con il totale più basso: passi già fatti più distanza stimata dall\'arrivo.',
      'Se è arrivato, ha trovato la strada più corta. Altrimenti guarda i quadretti vicini, saltando i palazzi.',
    ],
  },

  vision: {
    cosaFa:
      'A sinistra c\'è la ripresa dall\'alto, dove si può disegnare. A destra c\'è quello che «vede» il drone: per lui l\'immagine è una tabella di numeri. Una griglia 3×3 scorre sull\'immagine e fa risaltare i bordi.',
    ragazzi: [
      'Disegnano sull\'immagine a sinistra, con il mouse o con il dito.',
      'Cambiano filtro con i pulsanti in alto: bordi, sfocatura, nitidezza, rilievo.',
      'Guardano a destra come cambia quello che vede il drone.',
    ],
    azioni: 'Contano ogni disegno finito (quando si alza il dito o il mouse) e ogni cambio di filtro.',
    daDire:
      'Per un computer una foto è solo una tabella di numeri. Con una piccola griglia il drone confronta ogni puntino con i vicini: dove i numeri cambiano di colpo, c\'è il bordo di un oggetto. È il primo passo per riconoscere facce, cartelli e ostacoli.',
    codice: [
      'La foto è una tabella di numeri: 0 è nero, 255 è bianco.',
      'La griglia 3×3 (il «filtro») viene appoggiata su ogni puntino e sui suoi 8 vicini.',
      'Si moltiplica e si somma: se il risultato è alto, lì c\'è un bordo.',
    ],
  },

  network: {
    cosaFa:
      'Il drone scrive un messaggio alla base (massimo 16 caratteri). Il messaggio viene spezzato in pacchetti numerati che volano uno per uno. Se un pacchetto si perde, viene rispedito.',
    ragazzi: [
      'Scrivono un messaggio e premono «Trasmetti».',
      'Mentre i pezzi volano, cliccano su un pezzo per distruggerlo e provano a rovinare il messaggio.',
      'Guardano che la base lo riceve lo stesso: c\'è il contatore dei pezzi «Rispediti».',
    ],
    azioni: 'Contano ogni «Trasmetti» e ogni pacchetto distrutto con un clic.',
    daDire:
      'Su Internet nessun messaggio viaggia intero: viene tagliato in pacchetti numerati. Se ne manca uno, chi riceve lo richiede. Alla fine i pezzi si rimettono in ordine. Questo sistema si chiama TCP e fa funzionare tutto Internet.',
    codice: [
      'Il messaggio diventa una lista di pacchetti, ognuno con il suo numero.',
      'Si spedisce tutto. Ogni tanto un pacchetto si perde: finché manca un numero, lo si rimanda.',
      'La base usa i numeri per rimettere i pacchetti in ordine e ricostruire il messaggio.',
    ],
  },

  crypto: {
    cosaFa:
      'I ragazzi scrivono la chiave del telecomando del drone e vedono due cose: la sua «impronta» (un codice lungo che sembra casuale) e quanto tempo servirebbe a un pirata per indovinarla provandole tutte.',
    ragazzi: [
      'Scrivono una chiave e guardano l\'impronta.',
      'Cambiano UNA sola lettera: l\'impronta cambia quasi tutta.',
      'Provano i quattro esempi pronti (123456, password, Vallauri2026!, c4vallo-batteria-luna-42) per vedere la differenza tra una chiave debole e una forte.',
    ],
    azioni: 'Conta ogni modifica alla chiave, anche una sola lettera, e ogni esempio pronto.',
    daDire:
      'Un sito serio non salva mai la tua password: salva la sua impronta. Se cambi una lettera, l\'impronta cambia tutta. E ogni carattere in più moltiplica il tempo che serve a un pirata: si passa da pochi secondi ad anni.',
    codice: [
      'L\'impronta (SHA-256) si calcola dalla chiave: la chiave in sé non si salva mai.',
      'Si contano i caratteri diversi che si possono usare: a-z, A-Z, 0-9 e i simboli.',
      'Le combinazioni sono i simboli elevati alla lunghezza. Divise per i tentativi al secondo danno i secondi, e poi gli anni.',
    ],
  },

  cpu: {
    cosaFa:
      'Il chip del drone al rallentatore. Si vedono i numeri viaggiare tra memoria e calcolo, sempre con gli stessi tre passi: FETCH (preleva), DECODE (capisce) ed EXECUTE (esegue).',
    ragazzi: [
      'Premono «Passo singolo» e guardano cosa si accende a ogni passo.',
      'Scelgono uno dei due programmi: «Quota +25 m» (una somma) o «Batteria −45%» (una sottrazione).',
      'Possono premere «Avvia» per farlo andare da solo, e il pulsante con la freccia che gira per ricominciare.',
    ],
    azioni: 'Contano ogni «Passo singolo», ogni cambio di programma, «Avvia» e «Stop», e il reset.',
    daDire:
      'Dentro ogni chip c\'è un ciclo che si ripete miliardi di volte al secondo: prende un\'istruzione, capisce cosa vuol dire, la esegue. Quello che vedono si chiama Assembly, il linguaggio più vicino al chip. Quello di un drone fa questi passi centinaia di milioni di volte al secondo per tenerlo dritto anche col vento.',
    codice: [
      'La memoria (ram) contiene i numeri; il programma è una lista di istruzioni.',
      'FETCH: prende l\'istruzione a cui punta il contatore (pc) e passa alla prossima.',
      'DECODE ed EXECUTE: capisce cos\'è (LDA carica, ADD somma, STA salva, HLT ferma) e la esegue. Alla fine in ram[2] c\'è 8.',
    ],
  },
};

// Le due schermate fuori dalle sei prove: l'apertura (home) e il debriefing finale.
export const APERTURA = {
  titolo: 'Apertura',
  sottotitolo: 'La home page',
  cosaFa:
    'Si apre con la scritta «Questo drone non sa fare niente.» e un drone 3D fermo sulla piazzola arancione. Il drone decolla da solo. Più giù c\'è l\'elenco delle sei prove, ognuna con il nome della tecnologia che si usa.',
  ragazzi: [
    'Possono prendere il drone con il mouse (o con il dito) e spostarlo. Succede solo in questa schermata: più giù non si può.',
    'Premono «Accendi i motori» per partire con la prima prova, oppure «Le sei prove» per vedere l\'elenco.',
    'Su uno schermo grande con il mouse il drone li segue lungo la pagina; su telefono e tablet resta in alto.',
  ],
  daDire:
    'Il drone all\'inizio non sa fare niente. In dieci minuti, con sei prove, imparerà a volare da solo. Come ci siamo riusciti lo scoprirete all\'atterraggio.',
};

export const FINALE = {
  titolo: 'Finale',
  sottotitolo: 'Il debriefing',
  cosaFa:
    'L\'ultima schermata: «Ok, ti dobbiamo una confessione». Elenca le sei prove con il loro nome vero. Il drone atterra sulla seconda piazzola, in fondo alla pagina.',
  ragazzi: [
    'Se hanno decifrato le prove, vedono i nomi veri e dove si usano nella vita di tutti i giorni.',
    'Se manca tempo, il pulsante «Rivela tutto» decifra le sei prove in un colpo solo.',
    'Quando tutte le prove sono decifrate compare la parola «Informatica.» in grande.',
    'In fondo c\'è il patentino di volo: scrivono il loro nome e possono copiarlo con «Copia il patentino». «Nuovo pilota» fa ricominciare da capo.',
  ],
  daDire:
    'Il drone era una scusa. In questi dieci minuti avete usato intelligenza artificiale, algoritmi, visione, reti, sicurezza e architettura dei chip. Tutto insieme si chiama Informatica, ed è quello che si fa ogni giorno nell\'indirizzo Informatica e Telecomunicazioni del Vallauri.',
};

// Come funziona il sito in generale, in cima alla pagina.
export const COME_FUNZIONA = [
  'Il sito è una rotta in sei tappe. Ogni tappa è un gioco che fa provare ai ragazzi una tecnologia vera.',
  'Ogni prova si spiega con una riga di testo: i ragazzi provano e basta. Dopo qualche azione compare il pulsante «Decifra».',
  '«Decifra» mostra cosa hanno appena fatto, dove si usa nella vita reale e il codice che c\'è dietro, in poche righe.',
  'Per vedere il drone seguire la pagina serve uno schermo largo (almeno 1100 px) con il mouse. Gli effetti sonori si spengono dall\'icona in alto a destra.',
  'Se il tempo stringe, nel finale c\'è «Rivela tutto».',
  'Demo automatica: il pulsante «Demo» in alto (o «Avvia la demo» qui sopra) fa vedere il sito da solo. La pagina scorre e un cursore immaginario prova ogni gioco, con una didascalia che dice cosa succede. Dura al massimo 5 minuti, di solito meno. Si ferma con «Stop», con Esc o appena usi la rotellina, la tastiera o un clic.',
  'Tema chiaro o scuro: il pulsante con sole e luna in alto. La scelta resta salvata nel browser.',
];
