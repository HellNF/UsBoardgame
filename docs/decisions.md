# Registro delle decisioni

Decisioni prese dopo `specs.md`. Se una decisione contraddice le specifiche, **vale la decisione**.
Le regole che ne derivano sono scritte in forma completa in [rules.md](rules.md).

Formato: una decisione per voce, con il motivo. Per cambiarne una: non cancellarla, aggiungi una nuova voce
che la sostituisce (`Sostituisce D-xx`) e aggiorna i documenti che la citano.

Legenda origine: **Intervista** = confermata dal proprietario del progetto il 2026-09-17;
**Derivata** = conseguenza tecnica scelta durante la documentazione, da rivedere se emergono problemi.

---

## Tecnica

### D-01 · Stack: Next.js + Supabase + pnpm

**Intervista.** Next.js 16 (App Router, TypeScript strict) su Vercel; Supabase (Postgres, Realtime, Auth anonima);
pnpm. Tailwind CSS 4, Zod 4, Vitest, Motion per le animazioni in codice, Rive per i personaggi.
_Perché:_ come da specifiche; un solo servizio gratuito per database, tempo reale e accesso.

### D-02 · Il motore delle regole gira sul server

**Intervista.** Il reducer `(stato, azione, contesto) → nuovo stato` (`src/engine`) viene eseguito solo nelle
API route Next.js. Il client invia azioni; il server valida, tira i dadi, legge le schede, salva e
Realtime propaga lo stato.
_Perché:_ le schede sono segrete (un client che le ricevesse le esporrebbe), i dadi non devono essere
truccabili e c'è un solo punto di verità, così i due schermi non vanno fuori sincrono.

### D-03 · Stanza = coppia, persistente, posti fissi

**Intervista.** Una stanza creata una volta (codice + password) con due posti fissi. Si entra con codice e
password e si sceglie il posto; il browser ottiene una sessione anonima Supabase legata a quel posto
(`player_sessions`). Schede, domande usate, storico e diario appartengono alla stanza. Niente email.

### D-18 · Supabase: migrazioni SQL versionate + CLI via pnpm

**Intervista.** Schema in `supabase/migrations`, CLI come dev-dependency. Sviluppo con `supabase start` (Docker);
produzione su un progetto remoto (`supabase link` + `supabase db push`).

### D-19 · Lingua: codice in inglese, interfaccia e documentazione in italiano

**Intervista.** Identificatori, tabelle e colonne in inglese; testi UI e docs in italiano.
Corrispondenze in [glossary.md](glossary.md).

### D-16 · Dispositivi: desktop/laptop, tablet in orizzontale

**Intervista.** La partita è progettata per larghezze ≥ 1024px. Su telefono funzionano accesso, lobby e scheda,
non la partita.

### D-15 · Contenuti come file nel repo + seed

**Intervista.** Domande, sfide e disposizioni sono file TypeScript validati con Zod in `src/content`,
trasformati in `supabase/seed.sql` da `pnpm content:seed`. Nessun editor nel sito (per ora).
Una prima bozza delle ~150 domande la scrive un agente; il proprietario la rivede.

### D-22 · Scritture solo via API route con secret key

**Derivata da D-02.** RLS concede ai client solo letture (membri della stanza; schede solo al proprietario).
Tutte le scritture passano da `src/server/**` con il client admin. La tabella `rooms` non è mai leggibile dai client.

### D-23 · Concorrenza ottimistica

**Derivata da D-02.** `games.version` aumenta a ogni azione; l'update usa `where version = <atteso>`.
In caso di conflitto il client ricarica lo stato e riprova (o scarta, se l'azione non è più valida).

### D-24 · Casualità e tempo iniettati nel reducer

**Derivata da D-02.** Il reducer non chiama `Math.random` né `Date`: li riceve da `EngineContext`.
I test usano un RNG deterministico; il seme non è mai nello stato (i client potrebbero prevedere i dadi).

### D-25 · Timer decisi dal server

**Derivata.** Le sfide a tempo salvano `deadlineAt` (ISO) nello stato. Il client mostra il conto alla rovescia;
alla scadenza invia `TIMER_EXPIRED`, che il server accetta solo se `now ≥ deadlineAt`.

### D-26 · Minigiochi integrati nel motore

**Derivata.** Le mosse dei minigiochi a turni (tris, forza 4, memory) passano dalla stessa pipeline
(`MINIGAME_MOVE`); ogni minigioco è un modulo puro in `src/engine/minigames`. Quelli a tempo (riflessi, quiz)
misurano in locale e inviano il risultato.

---

## Regole di gioco

### D-04 · Due dadi

**Intervista.** Somma 2-12. Il numero di dadi è un parametro (`RULES.dice.count`).

### D-05 · Si completa il round

**Intervista.** Chi inizia è sorteggiato. Quando qualcuno raggiunge la 100, il round si completa: se ci arriva
chi ha iniziato, l'altro gioca il suo ultimo turno. Le 3 stelle dell'arrivo vanno solo al primo in ordine di turno.
Anche il limite di 25 round conta round completi.

### D-06 · Catalogo unico di domande, tipo misto

**Intervista.** Un solo catalogo (categoria, livello, tipo `multiple | short | open`). La scheda contiene tutte le
domande non aperte. Casella domanda: si pesca nella categoria dell'illustrazione, con il 60% di probabilità una
"quanto mi conosci" e il 40% una aperta (`RULES.questions.knowMeRatio`). Base di una scala: sempre "quanto mi conosci".
Risponde chi è sulla casella, sull'altro.

### D-07 · Casella domanda + base di scala = una sola domanda

**Intervista.** Esce una "quanto mi conosci": se è giusta dà le monete e fa salire; con "quasi" dà 1 moneta ma non
fa salire; "Salta domanda" la annulla (niente penalità, niente salita).

### D-08 · Opzioni fisse nel catalogo

**Intervista.** Le `multiple` hanno opzioni generiche scritte nel catalogo; nella scheda si sceglie la propria.
Le domande personali sono `short`: si scrive la risposta e chi è interrogato la giudica.

### D-09 · Livelli solo per le profonde

**Intervista.** Ogni domanda ha un livello 1-3. Solo la categoria "profonde" viene filtrata per casella:
1-30 → livello 1, 31-70 → fino a 2, 71-100 → fino a 3 (se il livello è esaurito si pesca da quelli sotto).

### D-10 · Casi limite dell'economia

**Intervista.** Vedi [rules.md § Economia](rules.md#economia): raddoppio solo dei guadagni in 71-100; monete mai
sotto 0; rimonta calcolata al tiro e valida anche con i dadi speciali; una stella per atterraggio; pareggio di sfida
senza premio (i minigiochi fanno una rivincita); la sfida lampo vinta conta per "Campione" ma non dà monete;
"quasi" non conta per "Sapientone"; stella bonus a nessuno in caso di pareggio.

### D-11 · Nessuna reazione a catena

**Intervista.** Gli spostamenti causati da oggetti o imprevisti non attivano effetti di casella, scale o serpenti.
Minimo casella 1. Antidoto passivo (si consuma da solo). Massimo 3 oggetti: al quarto si sceglie cosa scartare.
Superare la 100 con uno spostamento speciale conta come arrivo.

### D-17 · Sfide: duello o prova

**Intervista.** Ogni carta ha `mode`: `duel` (giocano entrambi; verdetto `automatic` o `double_confirm`) oppure
`trial` (gioca solo chi è sulla casella; l'altro giudica: verdetto `judge`). Una prova riuscita dà il premio e conta
come sfida vinta.

### D-27 · Disaccordo nella doppia conferma

**Derivata dalle specifiche.** Se le dichiarazioni non coincidono, entrambi scelgono tra rivincita lampo e lancio
di moneta (`RESOLVE_DISPUTE`); se scelgono in modo diverso, vale il lancio di moneta (tirato dal server).

### D-28 · Schede incomplete dopo l'aggiunta di domande

**Derivata.** Alla prima partita entrambe le schede devono essere complete. Se in seguito si aggiungono domande,
si può giocare lo stesso: si pescano solo "quanto mi conosci" a cui l'altro ha risposto, e la lobby segnala le
domande nuove da compilare.

### D-29 · Domande usate

**Derivata.** Le "quanto mi conosci" sono tracciate per posto (a chi sono state poste), le aperte per coppia.
Quando il sottoinsieme pescabile è esaurito, il suo registro si azzera.

### D-30 · Dettagli minori scritti direttamente in rules.md

**Derivata, da confermare alle prime partite.** Vincoli 5-6 di una disposizione valida (scale e serpenti non nella
stessa fila; nessuna testa di serpente in 2-12); prova scaduta = fallita, duello scaduto = doppia conferma;
Scala portatile non utilizzabile senza scale davanti; se il sottoinsieme di domande scelto è vuoto si pesca
dall'altro; imprevisti equiprobabili; parità di stelle e monete = pareggio.

---

## Tabellone, estetica e contenuti

### D-12 · Disposizioni: preset + generatore

**Intervista.** Preset scritti a mano come file dati (per ora `classic`), poi un generatore casuale da seme che
rispetta quantità e vincoli. Si sceglie in lobby.

### D-13 · Illustrazioni SVG disegnate dagli agenti

**Intervista.** Componenti SVG React disegnati seguendo [design.md](design.md) e le immagini in `docs/reference/`.
Fino alla fase 6 si usano segnaposto geometrici.

### D-14 · Rive per i personaggi

**Intervista.** Rive (state machine) per mascotte, pedine, dadi, carta che si gira e schermata finale.
SVG + Motion per tabellone, illustrazioni, scale e serpenti (dipendono dalla disposizione) e spostamenti.
Ogni asset Rive ha un segnaposto: il gioco funziona anche senza.

### D-20 · Font e colori

**Intervista.** Playfair Display corsivo per i titoli, Space Grotesk per il testo. In lobby ognuno sceglie una
pedina tra 6 e un colore tra rosso `#D83B2C`, blu `#2F4B9E`, verde bosco e ocra (diversi tra loro).

---

## Ancora aperte

- [ ] Elenco dei giochi DS/3DS posseduti e regole di ogni sfida (fase 7).
- [ ] Posizioni di scale, serpenti e geometrie nella disposizione `classic` (task F1-01, da proporre e rivedere).
- [ ] Revisione delle ~150 domande (task F3-04).
- [ ] Valori esatti di verde bosco e ocra (proposta in `globals.css`, da validare accanto alla reference).
