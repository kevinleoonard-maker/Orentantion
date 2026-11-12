import type { MissionId } from './missions';

// Il "codice" che si vede nella rivelazione di ogni prova (MissionReveal), sotto "Sotto il cofano".
// È Python semplificato, pensato per essere letto da ragazzi di terza media: nomi e commenti in italiano,
// poche righe. Non è il codice vero del sito (che è TypeScript), ma segue la stessa idea del gioco.
// Regole: i commenti iniziano con # (MissionReveal li colora così) e il # non compare mai dentro una stringa;
// righe corte (max ~60 caratteri) per non far scorrere di lato sui telefoni.
export const CODE: Record<MissionId, string> = {
  ai: `# 20 droni, ognuno con un cervello a caso
droni = [Drone(cervello_a_caso()) for _ in range(20)]

while True:
    # 1. Tutti provano a volare finché si schiantano
    for drone in droni:
        drone.vola()    # più resta in aria, più punti fa

    # 2. I due che sono andati più lontano vincono
    droni.sort(key=lambda d: d.punti, reverse=True)
    migliori = droni[:2]

    # 3. Nuova generazione: i cervelli dei vincitori,
    #    con piccoli cambiamenti a caso (mutazioni)
    droni = [Drone(muta(random.choice(migliori).cervello))
             for _ in range(20)]`,

  path: `# Il drone esplora la mappa a quadretti partendo dal via
da_provare = [partenza]
passi = {partenza: 0}   # passi fatti fino a ogni quadretto

while da_provare:
    # sceglie il quadretto più promettente:
    # passi già fatti + distanza stimata dall'arrivo
    qui = min(da_provare,
              key=lambda q: passi[q] + distanza(q, arrivo))
    if qui == arrivo:
        break   # trovata la strada più corta!
    da_provare.remove(qui)

    for vicino in quadretti_vicini(qui):
        if vicino in palazzi:
            continue   # i palazzi bloccano il passaggio
        if passi[qui] + 1 < passi.get(vicino, 9999):
            passi[vicino] = passi[qui] + 1
            da_provare.append(vicino)`,

  vision: `# Una foto è una tabella di numeri (0 = nero, 255 = bianco)
# Questa griglia 3x3 trova i bordi (da scuro a chiaro)
filtro = [[-1, 0, 1],
          [-2, 0, 2],
          [-1, 0, 1]]

altezza, larghezza = len(foto), len(foto[0])
bordi = [riga[:] for riga in foto]

for y in range(1, altezza - 1):
    for x in range(1, larghezza - 1):
        totale = 0
        # appoggia la griglia sul pixel e sugli 8 vicini
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                pixel = foto[y + dy][x + dx]
                totale += pixel * filtro[dy + 1][dx + 1]
        bordi[y][x] = abs(totale)   # numero alto = bordo!`,

  network: `import random

messaggio = "CIAO BASE"

# 1. Spezza il messaggio in pacchetti numerati
pacchetti = list(enumerate(messaggio))

# 2. Spediscili: ogni tanto un pacchetto si perde.
#    Finché manca qualche numero, la base lo richiede
arrivati = {}
while len(arrivati) < len(pacchetti):
    for numero, lettera in pacchetti:
        if numero in arrivati:
            continue   # già consegnato
        if random.random() < 0.7:   # 7 volte su 10 ce la fa
            arrivati[numero] = lettera

# 3. La base li rimette in ordine
print("".join(arrivati[n] for n in sorted(arrivati)))`,

  crypto: `import hashlib

chiave = "Drone2024!"

# 1. Non si salva la chiave: si salva la sua impronta
impronta = hashlib.sha256(chiave.encode()).hexdigest()
print(impronta)   # cambia UNA lettera e cambia tutto!

# 2. Quanti caratteri diversi si possono usare?
simboli = 26 + 26 + 10 + 33   # a-z, A-Z, 0-9, simboli

# 3. Quanto ci mette un pirata a provarle tutte?
combinazioni = simboli ** len(chiave)
secondi = combinazioni / 1_000_000_000   # 1 miliardo/secondo
anni = secondi / (3600 * 24 * 365)
print(round(anni), "anni")`,

  cpu: `ram = [5, 3, 0]   # memoria: 5 e 3, poi un posto vuoto
programma = [
    ("LDA", 0),   # carica ram[0] nell'accumulatore
    ("ADD", 1),   # aggiungi ram[1]
    ("STA", 2),   # salva il risultato in ram[2]
    ("HLT", 0),   # fine
]
pc = 0    # a che istruzione siamo
acc = 0   # l'accumulatore: dove il chip fa i conti

while True:
    # 1. FETCH: preleva l'istruzione e passa alla prossima
    istruzione, n = programma[pc]
    pc += 1

    # 2. DECODE + 3. EXECUTE: capisce cos'è e la esegue
    if istruzione == "LDA":
        acc = ram[n]
    elif istruzione == "ADD":
        acc += ram[n]
    elif istruzione == "STA":
        ram[n] = acc
    else:
        break   # HLT: il chip si ferma

print(ram[2])   # 8`,
};
