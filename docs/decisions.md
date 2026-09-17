# Registro delle decisioni

Decisioni prese dopo `specs.md`. Se una decisione contraddice le specifiche, **vale la decisione**.
Le regole che ne derivano sono scritte in forma completa in [rules.md](rules.md).

Formato: una decisione per voce, con il motivo. Per cambiarne una: non cancellarla, aggiungi una nuova voce
che la sostituisce (`Sostituisce D-xx`) e aggiorna i documenti che la citano.

Legenda origine: **Intervista** = confermata dal proprietario del progetto il 2026-09-17;
**Derivata** = conseguenza tecnica scelta durante la documentazione, da rivedere se emergono problemi;
**Derivata, confermata dal proprietario il 2026-09-17** = derivata che il proprietario ha rivisto e approvato
(cambiarla richiede una nuova voce).

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

### D-31 · Stato del motore per "ancora sulla casella d'arrivo"

**Derivata da D-11, confermata dal proprietario il 2026-09-17.** Scala e serpente si applicano solo se il giocatore è ancora sulla casella d'arrivo del tiro.
`GameState` porta perciò `arrivalCell` (la casella d'arrivo del tiro in corso, `null` quando non c'è) e
`handled: { ladder, snake }` (quali dei due effetti sono già stati applicati). Uno spostamento da oggetto,
imprevisto o serpente azzera o invalida l'arrivo, quindi nessun effetto si attiva a catena.
_Perché:_ con i soli `position` e `card` non si distingue "sono qui perché ci sono appena arrivato" da
"sono qui perché qualcosa mi ha spostato", e la regola dipende da quella differenza.

### D-32 · `drawChallenge` fornisce la carta completa

**Derivata da D-02, confermata dal proprietario il 2026-09-17.** `EngineContext.drawChallenge` non restituisce solo l'id: restituisce modalità, verdetto,
premio, durata, `snakeFlash` e id del minigioco (tipo `ChallengeCard`). I contenuti stanno in `src/content`,
che il motore non può importare, quindi i dati che servono alle regole arrivano dal contesto.
_Perché:_ premio e verdetto li applica il motore; senza questi campi dovrebbe rileggere il catalogo da sé.

### D-33 · Timer e rivincita delle sfide

**Derivata da D-25, confermata dal proprietario il 2026-09-17.** Il momento di scadenza è `now + min(durata massima della carta, durata massima della serata)`.
La rivincita dopo un disaccordo rigioca la stessa carta con una nuova scadenza (e, per i minigiochi, un nuovo
inizio). Una sfida con verdetto `automatic` scaduta passa alla doppia conferma e il minigioco viene abbandonato.
_Perché:_ serviva una durata unica e prevedibile quando la carta non dichiara un massimo compatibile con la serata.

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

### D-34 · Il raddoppio vale solo per i guadagni del gioco

**Derivata, confermata dal proprietario il 2026-09-17.** Dalla 71 in su raddoppiano le monete guadagnate dal gioco: caselle, premi delle domande (compreso
il "quasi") e premi delle sfide. Non raddoppiano i trasferimenti fra i due giocatori (Regalo, Ladro) né il prezzo
della stella: spostare monete non crea monete nuove, e le perdite non raddoppiano comunque.
_Perché:_ "ogni guadagno ottenuto mentre si è in una casella ≥ 71" non distingue le fonti; senza questa scelta il
Ladro e il Regalo creerebbero monete dal nulla.

### D-35 · L'offerta della stella appare solo con le monete in mano

**Derivata, confermata dal proprietario il 2026-09-17.** Sulla casella stella l'offerta compare solo se il giocatore ha almeno `RULES.stars.price` monete;
altrimenti la casella non ha effetto e il turno prosegue. Chi rifiuta non paga nulla.
_Perché:_ la regola dice "se si hanno ≥ 10 monete, offerta facoltativa": senza monete non c'è offerta da mostrare.

### D-36 · Prova senza "riuscita": nessun premio a nessuno

**Derivata, confermata dal proprietario il 2026-09-17.** In una prova (`mode: trial`, verdetto `judge`) il premio va **solo** a chi ha giocato, quando l'altro
dichiara la riuscita. Una dichiarazione di mancata riuscita, un pareggio o la scadenza del timer non danno premio
a nessuno (e non contano per Campione). Nella sfida lampo del serpente "non dichiarato vincente" significa
scendere alla coda.
_Perché:_ "se riesce prende il premio" non diceva cosa succede negli altri casi; dare il premio all'altro
premierebbe chi non ha giocato.

### D-37 · Salta domanda consuma l'oggetto senza occupare il turno

**Derivata, confermata dal proprietario il 2026-09-17.** `SKIP_QUESTION` richiede e consuma un oggetto Salta domanda; essendo un oggetto reattivo non occupa
lo slot dell'unico oggetto attivo del turno (come l'Antidoto, che si consuma da solo). La carta si chiude senza
monete, senza penalità e senza salita.
_Perché:_ la regola descrive il Salta domanda fra gli oggetti reattivi, e gli oggetti attivi sono "al massimo uno
per turno".

### D-38 · Le stelle dell'arrivo vanno solo al primo che raggiunge la 100

**Derivata da D-05, confermata dal proprietario il 2026-09-17.** Chi arriva per primo alla 100 prende `RULES.stars.finishBonus` stelle; chi ci arriva dopo,
anche nello stesso round, completa il round ma non prende stelle dell'arrivo.
_Perché:_ "il primo in ordine di turno" ammetteva due letture (primo in ordine di seduta o primo che arriva); la
più semplice è la seconda, ed è quella che si vede giocando.

### D-39 · Dettagli dei minigiochi integrati

**Derivata da D-26, confermata dal proprietario il 2026-09-17.** Primo a muovere è chi ha pescato la carta. Memory: 12 carte e 6 coppie, chi trova una coppia
continua a giocare, chi sbaglia passa la mano e le due carte scoperte restano visibili fino alla mossa successiva;
vince chi ha più coppie, a parità di coppie è pareggio. Tris e forza 4: pareggio = rivincita automatica;
vince chi allinea tre (tris) o quattro (forza 4) pedine.
_Perché:_ il regolamento dice solo che i minigiochi hanno `init`, `applyMove`, `result` e che il pareggio fa
ripartire; i dettagli interni servono alla UI e ai test.

### D-40 · Chi ha già finito non gioca più nel round

**Derivata da D-05, confermata dal proprietario il 2026-09-17.** Chi ha raggiunto la 100 salta i turni che restano nel round (`TURN_SKIPPED`). Con due
giocatori la partita si chiude comunque alla fine del round in cui qualcuno è arrivato.
_Perché:_ il regolamento lo dice ("chi ha già finito salta il turno"); va scritto nel motore perché i round
si contano comunque completi.

### D-42 · Scale e serpenti coprono al massimo 5 file

**Derivata, confermata dal proprietario il 2026-09-17.** Vincolo 7 di una disposizione valida: |`rowOf(to)` −
`rowOf(from)`| ≤ [`board.maxSpanRows` = 5]. La disposizione `classic` è stata corretta di conseguenza: la scala
28→84 è diventata 28→72 e il serpente 87→24 è diventato 87→37.
_Perché:_ con scale lunghe mezzo tabellone una sola casella decideva la partita; il limite tiene le geometrie
leggibili e lascia il ritmo distribuito sulle cento caselle.

_Nota:_ **[D-41](decisions.md) (quiz e riflessi a doppia conferma), sul branch `hermes/b-content`, è confermata allo
stesso modo** il 2026-09-17: da sistemare quando i minigiochi a tempo arrivano con F4-04. Il file di quel branch non
si tocca da qui.

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
I file `.riv` si creano a mano nell'editor Rive, **senza server MCP**: gli agenti non generano né modificano
i `.riv`, ma scrivono i wrapper React e i segnaposto rispettando il contratto di [design.md](design.md).

### D-20 · Font e colori

**Intervista.** Playfair Display corsivo per i titoli, Space Grotesk per il testo. In lobby ognuno sceglie una
pedina tra 6 e un colore tra rosso `#D83B2C`, blu `#2F4B9E`, verde bosco e ocra (diversi tra loro).

---

## Ancora aperte

- [ ] Elenco dei giochi DS/3DS posseduti e regole di ogni sfida (fase 7).
- [ ] Posizioni di scale, serpenti e geometrie nella disposizione `classic`: la proposta è in
      `src/content/boards/classic.ts` (verificata dal validatore) e va rivista a occhio accanto a
      `docs/reference/board/boardReference.png` (task F1-01).
- [ ] Revisione delle ~150 domande (task F3-04).
- [ ] Valori esatti di verde bosco e ocra (proposta in `globals.css`, da validare accanto alla reference).
