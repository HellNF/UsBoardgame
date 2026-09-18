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

### D-43 · Hot seat: il motore gira nel browser, solo nelle pagine `/dev`

**Derivata, dal pacchetto C, confermata dal proprietario il 2026-09-17.** La pagina `/dev/hotseat` fa girare `reduce` nel browser con un `EngineContext`
finto, per poter giocare una partita intera senza Supabase. È l'unica **eccezione** alla regola 1 di AGENTS.md
("le regole girano solo sul server") e vale solo per le pagine di sviluppo: la pagina chiama `notFound()` quando
`NODE_ENV === "production"` (verificato: in `pnpm start` le pagine `/dev/*` rispondono 404).
_Perché:_ senza Docker né Supabase l'unico modo di provare a occhio carte, timer e schermata finale è far girare
il motore nel browser; tenerlo confinato a `/dev` e spento in produzione evita che l'eccezione finisca nell'app.

### D-44 · Hot seat: scheda di prova e due sfide in più per i minigiochi

**Derivata, dal pacchetto C, confermata dal proprietario il 2026-09-17.** In hot seat non ci sono schede vere (arrivano con F3-02), quindi il contesto finto
risponde alle domande "quanto mi conosci" confrontando la risposta con la **prima opzione** di ogni domanda a
scelta multipla. Inoltre la hot seat aggiunge due carte sfida di prova (`dev-forza-4`, `dev-memory`) perché il
mazzo di `main` contiene solo il tris: servono a provare le tre interfacce dei minigiochi. Le due carte vivono in
`src/features/game/dev-context.ts` e **non** entrano in `src/content`.
_Perché:_ le schede di prova non devono toccare i contenuti versionati, e il pacchetto C non può importare il mazzo
del pacchetto B (branch non ancora unito).

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
- [x] Posizioni di scale, serpenti e geometrie nella disposizione `classic`: **approvate dal proprietario il
      2026-09-17** (l'impianto va bene e le scale da 5 file si leggono). Le correzioni di leggibilità richieste
      sono A1/A5, fatte nel branch `hermes/e-ui-fix`: i simboli delle caselle sono disegnati sopra scale e
      serpenti con l'alone del colore della carta, quindi la stella della casella 15 resta visibile e la scala
      8→26 non è stata spostata.
- [ ] Revisione delle ~150 domande (task F3-04).
- [x] Carte di gioco per due schermi: **chiusa dal pacchetto E** (D-56). `CardPanel` riceve il posto di chi guarda:
      l'altro non vede più il campo di risposta, ma una riga di attesa che dice cosa sta facendo. Il server
      rifiutava già le azioni non proprie (403), quindi era un problema di chiarezza, non di sicurezza.
- [ ] Presenza non protetta: chi conosce l'id di una stanza può iscriversi al suo canale e vedere la presenza
      (i dati di gioco no, li filtra RLS). Si chiude con i canali privati e RLS su `realtime.messages`.
- [x] `pnpm db:start` non arrivava in fondo (il container dei log `vector` non diventa "healthy"):
      **chiusa il 2026-09-17** con `[analytics] enabled = false` in `supabase/config.toml` (commit `d7658fe`).
- [x] Il diario mostrava l'id della domanda invece del testo e registrava le monete a zero: **chiusa dal pacchetto
      E** (D-54 e F5-06).
- [ ] Valori esatti di verde bosco e ocra (proposta in `globals.css`, da validare accanto alla reference).
- [ ] Le risposte giuste del quiz-lampo viaggiano nello stato (D-55): chi guarda gli strumenti per sviluppatori del
      browser le vede. Per una partita fra due persone che si fidano va bene; se dovesse dare fastidio, il
      confronto va spostato sul server come per le domande a scelta multipla.
- [ ] **Il tempo nelle attività, e quanto deve pesare.** Indicazione del proprietario (2026-09-18): il conto alla
      rovescia è **ansiogeno** e non è quello che si cerca in una serata in due — «se esce una bella riflessione con
      l'altra persona vale più il tempo che passa con l'altra persona che il vincere». Un limite alle attività ci
      sta, ma non come pressione. Da decidere insieme, e riguarda tre cose che oggi hanno un timer: la carta del
      quiz (`durationSeconds`), le sfide lampo e la pausa della sfida esterna. Le due voci qui sotto sono casi
      particolari di questa.
- [ ] La pausa della sfida esterna (F4-05) non ferma il timer della carta: se si va a giocare fuori il tempo
      scorre e la sfida può scadere mentre non si guarda. Per i duelli non è un guaio (alla scadenza si passa alla
      doppia conferma, che è già dove si dichiara), ma va deciso se la pausa deve fermare anche il conto.
- [ ] Tentativi di accesso: il contatore del ritardo è in memoria del processo (D-50); se il sito diventasse
      pubblico va spostato su Postgres (una tabella di tentativi per stanza).
- [x] **L'archivio delle partite non si riempie mai.** Nessuno scriveva `status = 'finished'`: quando il motore
      arrivava alla fine la riga restava `playing` (e andava bene per la schermata finale, che si riapre anche
      rientrando), ma `findFinishedGames` cerca `status = 'finished'`, quindi «Partite passate» nel diario restava
      vuoto; e con «Nuova partita» la serata conclusa diventava `abandoned`, cioè non tornava più. Trovato in
      locale il 2026-09-18 (F5-06). **Chiuso dal pacchetto F (D-61):** `apply_game_action` porta la partita a
      `finished` con `finished_at` nella stessa transazione dell'azione che la conclude, e «Nuova partita»
      abbandona solo una serata non conclusa. La verifica in locale è la voce F1 del Registro.

---

## Contenuti (pacchetto B)

### D-41 · Quiz e riflessi sono duelli a doppia conferma finché non esistono i loro moduli

**Derivata.** Le carte `quiz-lampo` e `riflessi` sono sfide integrate (`category: builtin`), ma il loro verdetto è
`double_confirm` e non `automatic`: i moduli dei minigiochi a tempo arrivano con il task F4-04 e il motore non li
conosce ancora, quindi una carta `automatic` con un minigioco inesistente romperebbe la partita. Al ritorno
dichiarano entrambi il punteggio, come per le sfide esterne.
_Perché:_ meglio una carta giocabile subito che una carta che si rompe; quando F4-04 registra i due moduli basta
cambiare verdetto e `minigame` in `src/content/challenges.ts`.

**Superata da D-55 (pacchetto E):** i due moduli esistono, le carte sono `automatic` con `minigame` `quiz` e
`reflex`, e nessuno dichiara più il risultato.

_Nota di numerazione:_ questa voce è stata scritta sul branch `hermes/b-content`, partito da `main`; le decisioni
D-31…D-40 arrivano dal branch `hermes/a-engine` (pacchetto A). Al merge dei due branch l'ordine dei numeri resta
questo.

---

## Interfaccia e verifica a occhio (branch `hermes/e-ui-fix`)

### D-45 · Pagina `/dev/scenari`: le carte rare, uno stato alla volta

**Derivata, dall'indicazione del proprietario.** La pagina `/dev/scenari` (solo sviluppo, 404 in produzione come
`/dev/hotseat`, D-43) elenca ogni stato di carta e di schermata costruito da un `GameState` **fissato a mano** in
`src/features/game/dev-scenarios.ts`: domanda a scelta multipla con verdetto giusto e sbagliato, domanda breve nei
tre verdetti, domanda aperta, domanda su base di scala, i sette imprevisti, l'offerta della stella con e senza
monete, lo zaino pieno, sfida duello automatica, prova a giudizio, doppia conferma d'accordo e in disaccordo con
rivincita o moneta, sfida lampo del serpente, schermata finale in vittoria dell'uno, dell'altro e in pareggio.
Nessuna carta è pescata a caso: l'unico valore calcolato all'apertura è la scadenza dei timer.
I componenti sono quelli di `src/features` (nessuna copia) e la carta resta viva e cliccabile perché il reducer
gira nel browser con l'`EngineContext` finto della hot seat.
_Perché:_ le carte rare si vedono altrimenti solo sperando che escano in partita; con stati fissati a mano si
controllano in un colpo solo, senza toccare i contenuti né le regole.

### D-46 · La pedina segnaposto porta il numero del posto

**Derivata, dall'indicazione del proprietario.** Il segnaposto della pedina mostra **il numero del posto** (1 o 2)
e non l'iniziale del nome: entrambi i giocatori si chiamano "Giocatore 1" e "Giocatore 2", quindi le due pedine
mostravano la stessa lettera. Il nome resta nell'etichetta accessibile della pedina. Nello stesso pannello il posto
di turno si riconosce da tre segnali insieme — bordo pieno della riga, pallino pieno del colore del giocatore ed
etichetta "Tocca a te" — così non dipende dal solo colore.
_Perché:_ il "·" che segnava il turno sembrava un errore di battitura, e due pedine identiche non si distinguono
guardando il tabellone.

---

## Server e database (pacchetto D)

### D-47 · Il calcolo dell'hash della password sta in un file senza `server-only`

**Derivata.** `src/server/auth/password.ts` ha il marcatore `server-only`; il calcolo vero (`hashPassword`,
`verifyPassword`, `parseHash`, i parametri scrypt) sta in `src/server/auth/password-core.ts`, che **non** lo ha,
perché lo usano anche gli script da terminale (`pnpm room:create` gira con `tsx`, dove il marcatore solleva subito
un errore). La regola "ogni file di `src/server` comincia con `import server-only`" (docs/architecture.md) resta
vera per l'applicazione; l'import dal browser è impedito da ESLint, che vieta a `src/features` e `src/app` di
importare da `@/server`. Lo stesso vale per la lettura di `.env.local` negli script
(`scripts/lib/env-file.ts`), che vive fuori da `src/server` proprio per non violare quella regola.
_Perché:_ un solo punto per l'hash (testato una volta sola) e script capaci di riusarlo, senza indebolire il
confine tra codice server e browser.

### D-48 · Le pagine della stanza si riparano da sole e rimandano alla fase

**Derivata da D-23, D-28.** Ogni pagina di `/r/[code]/...` passa da `currentRoom(code)`
(`src/server/room/current.ts`): se il browser non ha un posto rimanda all'accesso con il codice già scritto;
se nella stanza non c'è una serata aperta la crea (lobby con le impostazioni di partenza); se la partita esiste
sa qual è la fase e la pagina rimanda alla schermata giusta (`/lobby`, `/sheet`, `/game`, `/diary`). Le letture di
posti e stanze passano dal client con RLS, disposizione e stato della partita dal client con la secret key.
_Perché:_ la riconnessione di F2-03 non deve dipendere da cosa ricorda il browser, e nessuna pagina deve
pretendere che qualcuno abbia già creato la serata a mano.

### D-49 · La pesca delle domande: scelta pura, adattatore nel server, registrazione nella transazione

**Derivata da D-06, D-09, D-28, D-29.** La scelta è una funzione pura (`src/server/game/question-draw.ts`:
`selectQuestion`, `selectChallenge`) provata con Vitest; l'adattatore (`src/server/game/context.ts`) carica
catalogo, schede, `used_questions` e le sfide già uscite **prima** del `reduce`, perché il reducer è sincrono;
registrazione delle domande uscite e azzeramento del registro esaurito viaggiano nella stessa transazione
dell'azione (`apply_game_action(…, p_used, p_reset_seats)`). L'azzeramento è una **cancellazione** delle righe di
quel sottoinsieme (stanza + posto per le "quanto mi conosci", stanza + righe con `seat` nullo per le aperte): il
diario non legge `used_questions`, quindi non si perde storia.
_Perché:_ le regole di pesca restano verificabili senza database, e la partita non può restare con una domanda
usata ma non registrata (o viceversa) se la scrittura fallisce a metà.

### D-50 · Ritardo sui tentativi di accesso: contatore in memoria del processo

**Derivata.** Il ritardo crescente sui tentativi falliti (`src/server/auth/attempts.ts`) è una funzione pura con
un contatore in memoria per codice di stanza, che dimentica le chiavi vecchie dopo 15 minuti. Con più istanze
della funzione (Vercel) ogni istanza conta per sé: è un ostacolo all'automazione più stupida, non una difesa.
_Perché:_ per due giocatori la password della stanza è il vero controllo, e una tabella di tentativi nel database
sarebbe un'altra scrittura da gestire per un guadagno nullo; se un giorno il sito diventasse pubblico andrà
spostato su Postgres (riga in "Ancora aperte").

---

## Verifica in locale col database (2026-09-17)

### D-51 · Il tempo reale vuole il token della sessione, passato a mano

**Derivata, dalla verifica in locale.** Prima di `channel.subscribe()` bisogna chiamare
`await supabase.realtime.setAuth()`. Senza, il canale si collega con la sola publishable key: la **presenza**
funziona, ma i `postgres_changes` non arrivano, perché `anon` non ha nessun privilegio sulle tabelle e RLS non
consegna niente. Il caso normale è proprio quello rotto: la sessione anonima si crea nella pagina di accesso e in
tutte le pagine successive arriva dal cookie, senza nessun evento di autenticazione che passi il token al canale.
_Perché:_ è un guasto silenzioso — nessun errore in console, il canale risulta `SUBSCRIBED` e la presenza si vede,
quindi sembra tutto collegato mentre la schermata dell'altro resta ferma. Chi tocca
`src/features/presence/use-room-realtime.ts` non deve togliere quella chiamata.

### D-52 · Conflitto di versione: la funzione SQL "ritorna null" come riga di campi nulli

**Derivata, dalla verifica in locale.** `apply_game_action` fa `return null` quando la versione non combacia, ma
PostgREST non consegna `null`: manda la riga composita di `public.games` **con tutti i campi a `null`**. Il
conflitto si riconosce quindi da `row.version === null`, non dall'assenza dell'oggetto. La route delle azioni
cattura inoltre le eccezioni e risponde 500 **con un messaggio**: un 500 dal corpo vuoto non dà al client niente da
mostrare.
_Perché:_ con il controllo sbagliato il secondo di due clic simultanei riceveva un 500 vuoto invece del `409` con
lo stato fresco, e la UI non si riallineava — cioè proprio il caso per cui esiste la concorrenza ottimistica (D-23).

---

## La partita su due schermi (pacchetto E)

### D-53 · La lobby passa da una transazione: il pronto è una sola istruzione

**Derivata, dalla verifica in locale del pacchetto D.** Il passaggio "pronto → si parte" leggeva `games.ready`, lo
modificava in memoria e lo riscriveva, e l'avvio chiudeva con `.single()`. Con due clic quasi simultanei (uno per
posto) il secondo poteva riscrivere un `ready` vecchio — serata ferma in lobby con entrambi pronti — oppure
ricevere un 500 perché non c'era più la riga da aggiornare.

Ora il pronto è una funzione SQL (`public.set_lobby_ready`, migrazione `20260918120000_lobby_atomic.sql`): scrive
`ready` sulla riga letta in quella stessa istruzione e, se con questo pronto sono pronti tutti e due, porta la
serata a `sheets` o `playing` con lo stato iniziale **nella stessa transazione**. `public.start_lobby_game`
("Gioca lo stesso") è idempotente: se la serata è già partita ritorna la riga com'è, quindi la seconda chiamata non
è più un errore. La regola è scritta anche in TypeScript (`readyOutcome` in `src/server/room/lobby.ts`) e provata
con la doppia chiamata; `supabase/tests/lobby.sql` la prova sul database.
_Perché:_ due clic quasi simultanei sono il caso normale di due persone che premono "Sono pronto" insieme, e la
regola deve stare in un posto solo (il database) invece che fra due letture e una scrittura.

### D-54 · Nel diario il testo della domanda viene dal catalogo nel bundle

**Derivata.** Il diario scriveva l'id (`Domanda deep-004`) e il nome della sfida solo per id. Ora `read-diary.ts`
prende i testi da `src/content/questions` e i nomi da `src/content/challenges`: è la stessa scelta già fatta dalle
carte (`online-table`), e non serve nessuna query in più. Una domanda fuori catalogo resta leggibile
(`Domanda tastes-999`) invece di sparire.
_Perché:_ alternativa era una join su `questions` a ogni lettura del diario (una query in più per una tabella che
il server già conosce), con il rischio di mostrare il testo aggiornato in produzione e quello vecchio in partita;
dal bundle il testo è **esattamente** quello che si è letto in partita.

### D-55 · Quiz-lampo e riflessi sono minigiochi a tempo del motore

**Derivata, su indicazione del proprietario (F4-04).** `quiz-lampo` e `riflessi` non sono più duelli a doppia
conferma (D-41 è superata): sono `automatic` con i minigiochi `quiz` e `reflex`.

- **Quiz-lampo:** le domande stanno **nella carta** (`quiz` in `src/content/challenges.ts`), sono contenuto
  pubblico e non la scheda, quindi la risposta giusta può vivere nello stato senza svelare niente a nessuno. Una
  risposta ciascuno per domanda, a turno; un punto per risposta giusta; chi ne ha di più vince, il pareggio
  riapre la sfida.
- **Riflessi:** il momento del segnale lo decide il modulo con l'orologio del server e vive nello stato
  (`goAt`), quindi è lo stesso per le due schermate; il primo che tocca prende il punto e chi tocca **prima** del
  segnale regala il punto all'altro; si gioca al meglio di cinque (`RULES.minigames.reflex`).

Per questo i moduli ricevono l'orologio (`MinigameClock`) e `turn` può valere `"both"` (nei riflessi possono muovere
entrambi): il reducer e le carte seguono quel valore invece di dare per scontato un turno.
_Perché:_ "a tempo" con due schermi richiede che il tempo sia uno solo e deciso dal server, come i timer delle
sfide (D-25); un modulo che legge l'orologio da sé darebbe due gare diverse.

### D-56 · La carta sa chi la guarda: `viewerSeat`

**Derivata, su indicazione del proprietario (F3-03, F4-02, F4-06, F5-05).** `CardPanel` riceve il posto di chi
guarda: chi guarda vede i comandi suoi, l'altro legge una riga di attesa che dice cosa sta facendo l'altro
(«Marta sta scrivendo la risposta…», «Leo sta giudicando…», «Tocca a Marta muovere»). Nella hot seat il valore è `"all"` e i comandi si vedono
tutti, come prima; la pagina degli scenari parte da «posto 1» (è il caso interessante) e ha l'interruttore; `/dev/scenari` ha un interruttore per
guardare la stessa carta dal posto 1, dal posto 2 o da tutti e due, così le due viste si controllano senza
database. Le regole stanno in `src/features/cards/viewer.ts`, pure e provate; i componenti delle carte non le
ripetono.
Non è una regola di sicurezza (il server risponde comunque 403 alle azioni dell'altro posto e 422 a chi gioca fuori
turno): è chiarezza — nessuno deve vedere il campo di risposta dell'altro.
_Perché:_ due schermi con i comandi di tutti e due i posti sono illeggibili; la visibilità è una regola di UI e va
scritta una volta sola, in una funzione che si può provare.

### D-57 · Animazioni: cella per cella, e un movimento per volta in coda

**Derivata, su indicazione del proprietario (F2-05).** Il percorso della pedina è una funzione pura
(`src/features/board/route.ts`): un saltello per **ogni casella attraversata**, gradino per gradino sulle scale,
lungo il corpo sui serpenti. Gli eventi di spostamento si accodano (`src/features/board/use-move-queue.ts`) e si
animano **in ordine**, uno per volta, per la durata del proprio percorso: una sola azione può portarne due (il
tiro e poi la scala) e dal tempo reale possono arrivare due righe insieme, e in nessuno dei due casi si perde
un'animazione o si torna indietro. Anche l'ingresso delle carte è un'animazione (la cornice entra quando cambia la
carta, non a ogni ritocco).
_Perché:_ il tabellone non deve tenere stato proprio — la strada della pedina la sa chi possiede gli eventi — e con
una coda l'ordine non dipende dai tempi della rete.

### D-58 · Se una "quanto mi conosci" non è pescabile si ripiega, non si rompe il turno

**Derivata, trovata in locale (F3-01, pacchetto E).** `drawQuestion` prova nell'ordine
(`drawAttempts` in `src/server/game/question-draw.ts`, puro e provato):

1. la richiesta del motore, con il vincolo della scheda (D-28: una "quanto mi conosci" si pesca solo se
   l'interrogato ha risposto);
2. una "quanto mi conosci" **breve** anche senza risposta in scheda — il verdetto lo dà l'interrogato a voce, la
   scheda non serve, e così la domanda può ancora far salire una scala (D-07);
3. una domanda **aperta**, come dice `rules.md` § Domande ("se il sottoinsieme scelto è vuoto si usa l'altro").

_Perché:_ con «Gioca lo stesso» e le schede vuote (D-28) la prima strada non trova niente in **nessuna** categoria,
e prima il turno finiva con un 500 («Nessuna domanda pescabile»): la partita si fermava lì. Il ripiego sulle brevi
viene prima di quello sulle aperte perché una scala persa cambia la partita, e una breve si gioca comunque.

### D-59 · L'esito della sfida sta nell'evento: `won`

**Derivata, trovata in locale (F5-06, pacchetto E).** `CHALLENGE_RESOLVED` porta anche `won`: `seat` è il posto **a
favore del quale** si è deciso, `won` dice se quel posto ha davvero vinto. In una prova giudicata "non riuscita" il
verdetto va all'altro posto ma nessuno ha vinto. Il diario usa i due campi insieme: il momento è di chi ha provato
(non del giudice) e il testo è «Prova non riuscita: nessun premio (giudizio)». Una vittoria senza monete (la sfida
lampo del serpente) dice «nessun premio in monete», non «+0 monete» (D-54).
_Perché:_ dal solo `seat` il diario raccontava una vittoria che non c'era stata, attribuita anche alla persona
sbagliata. Le righe già in `game_events` non hanno il campo: lì il diario resta come prima, senza errori.

### D-60 · Quello che dipende dall'orologio si disegna solo nel browser

**Derivata, trovata in locale (F2-05, F4-04, pacchetto E).** Il tempo che manca di una sfida e il segnale dei
riflessi compaiono dopo l'idratazione (`useHydrated` in `src/features/cards/use-hydrated.ts`, che è
`useSyncExternalStore` e non un `setState` in un effetto: quella strada la vieta `react-hooks/set-state-in-effect`).
_Perché:_ `Date.now()` nel primo disegno vale un secondo sul server e un altro nel browser, quindi React buttava
via l'albero appena idratato con «Hydration failed because the server rendered text didn't match the client» —
un errore in console a ogni caricamento con una carta a tempo aperta.

---

## L'archivio e l'estetica (pacchetto F)

### D-61 · La serata conclusa entra nell'archivio, nella transazione dell'azione

**Derivata, trovata in locale (F5-06).** Quando lo stato applicato ha `phase = "finished"`, `apply_game_action`
scrive anche `status = 'finished'` e `finished_at = now()` (migrazione `20260918130000_finish_game.sql`): una sola
transazione, come vuole D-52. Nessun secondo `update` dal lato TypeScript, che potrebbe lasciare la riga con lo
stato salvato e l'archivio no. Solo una partita **non conclusa** diventa `abandoned` con «Nuova partita»
(`statusOnNewGame` in `src/server/game/game-status.ts`, con la condizione dello stato anche nell'`update`, così
una partita che finisce fra la lettura e la scrittura non viene toccata).
La decisione è scritta anche in TypeScript, pura e provata (`statusAfterAction`, `isConcludedGame`,
`statusOnNewGame`): è la stessa regola, come `readyOutcome` per la lobby (D-53).
_Perché:_ con la riga ferma a `playing` l'archivio del diario restava vuoto per sempre e una serata giocata fino
in fondo spariva; portare a `finished` la riga **senza** data avrebbe lasciato «Partite passate» senza la sua
data, e farlo da fuori avrebbe aperto la finestra in cui lo stato è salvato ma l'archivio no.
_Effetto collaterale accettato:_ dopo la fine, rientrando nella pagina della partita non si riapre più la
schermata finale (la riga non è più aperta): si arriva al diario, dove la serata è nell'archivio. È la voce F1
del Registro, da guardare in locale.

### D-62 · Le mosse dei minigiochi si accodano e si animano una per volta

**Derivata, su indicazione del proprietario (F2-05).** Tris, forza 4 e memory ricevevano `MINIGAME_MOVED` ma
ridisegnavano lo stato **senza transizione**: due mosse ravvicinate (l'altra schermata che muove, il tempo reale
che consegna due righe insieme) cambiavano il disegno nello stesso istante. Ora `useMinigameQueue`
(`src/features/minigames/use-minigame-queue.ts`) è lo stesso impianto di `useMoveQueue` per la pedina del
tabellone: ogni stato nuovo del minigioco entra in coda e va in scena uno per volta, e gli elementi comparsi
adesso entrano con Motion (`enteringCells` dice quali sono, `useEnterFrom` li anima e si spegne con
`prefers-reduced-motion`).
L'attesa la decide `revealDelay` (`src/features/minigames/queue.ts`, puro e provato): il minimo fra due scene è
320 ms, e il memory ha i suoi tempi perché le sue mosse sono giri di carte — la prima carta del turno resta
leggibile 600 ms, la seconda si vede accanto alla prima, e una **coppia sbagliata resta scoperta 900 ms** prima
che la mossa successiva la richiuda.
_Non serve nessun evento:_ ogni stato nuovo del minigioco **è** una mossa, quindi la coda si costruisce dal solo
`state` e vale identica nella hot seat, negli scenari e nella partita vera.
_Perché:_ con il solo disegno nuovo e nessuna coda il tabellone saltava da una posizione all'altra e in memory
una coppia sbagliata poteva sparire prima di essere vista; la coda invece non dipende dai tempi della rete.

### D-64 · La serata conclusa resta sulla schermata finale

**Derivata, trovata in locale (F1, pacchetto F).** Finché la coppia non comincia una partita nuova, la stanza
mostra l'**ultima serata conclusa**: `currentRoom` prende la partita aperta, e se non c'è l'ultima `finished`
(`roomGameChoice` in `src/server/game/game-status.ts`, pura e provata); `/r/[code]/game` non rimanda più al
diario; `screenFor("finished")` porta alla partita, non al diario. «Nuova partita» sulla schermata finale chiama
davvero `{ action: "new" }` e porta in lobby.
_Perché:_ con D-61 la riga diventa `finished` appena il motore finisce, e `currentRoom` apriva da sé una lobby
nuova quando non trovava una serata aperta: bastava **ricaricare una pagina qualsiasi** perché la schermata
finale — le stelle bonus scoperte una alla volta, il vincitore, la posta in palio — sparisse per sempre, e al suo
posto ci fosse una lobby vuota. È il momento per cui si è giocata la serata: deve reggere una ricarica.
Di conseguenza la stessa serata è sia quella mostrata sia nell'archivio: il diario la scrive **una volta sola**.

### D-65 · Le decorazioni multi-cella sono forme piene, non segnaposto a filo

**Derivata, su indicazione del proprietario (F6-02, pacchetto G).** Le quattro decorazioni della disposizione
`classic` (caselle 4-5, 9, 23, 26) erano i segnaposto geometrici del pacchetto C: un cerchio, un semicerchio, una
diagonale e un rettangolo, tutti **a filo** (contorno, tratto 6). Accanto alle 38 illustrazioni nuove — campiture
nere piene con dettagli di carta — stonavano. Ora sono forme piene in inchiostro, contenute nel gruppo di caselle
che la disposizione indica con un margine di 12 unità dai bordi: `disc` (disco, anche su due caselle),
`crescent` (falce), `hill` (mezzo disco appoggiato in basso), `diamond` (rombo). I
nomi dei segnaposto (`circle`, `half-circle`, `diagonal`, `filled`) escono dal tipo `DecorationShape`.
Stanno sotto scale, serpenti e numeri, quindi non rubano leggibilità a niente: dove passa una scala o un serpente
vincono loro, e il numero della casella resta staccato dal nero dall'alone di A1.
_Perché:_ l'alternativa era togliere le decorazioni; il tabellone è pieno, ma le quattro forme piene danno il
ritmo che sulle caselle libere mancava, nello stesso linguaggio delle illustrazioni. Il disco su due caselle
copre il bordo in mezzo: le due caselle restano leggibili dai loro numeri.

Due vincoli che vengono dal guardare il tabellone vero, e che la verifica locale ha corretto:

1. **Una decorazione va su caselle che nessuna scala e nessun serpente attraversa.** «Sta sotto» non basta:
   sotto un nero pieno c'è un altro nero pieno e i due si fondono in una macchia. Le prime scelte (23, dove passa
   il serpente 62→18, e 26, dove **arriva** la scala 8→26) si leggevano come un fungo e come una freccia spezzata;
   sono state spostate su 46 e 90. Lo z-order separa solo se la forma sopra porta del bianco (i pioli delle scale).
2. **Forme piene, mai anelli.** Il numero della casella si disegna nell'angolo in alto a sinistra con il suo alone
   di carta, quindi ogni decorazione riceve **sempre** un morso lì. Una forma piena lo regge (si legge come una
   tacca); una fascia sottile si interrompe e la forma cambia significato. Il rombo era nato come anello — un rombo
   di carta dentro quello nero — e si leggeva come una freccia: ora è pieno.
3. **Mai su una casella di bordo.** La cornice esterna del tabellone è spessa ~16 unità e si disegna **dopo** le
   decorazioni, quindi sulla prima e sull'ultima riga e colonna si mangia il margine di 12 e i due neri diventano
   uno: il disco sulle caselle 4-5 si fondeva con la cornice di sotto. La cornice è il terzo nero, dopo le scale e
   i serpenti; questa regola è arrivata dopo le altre due, guardando il tabellone renderizzato (H).

Il conto lo fanno `crossedCells` e `isBorderCell` in `src/engine/board-geometry.ts` (lo stesso modulo che usa il
generatore, D-70): si decora solo una casella libera, non attraversata e interna. Il vincolo di bordo è arrivato al
generatore col pacchetto I, che lo applica nel piazzamento delle decorazioni. Nella disposizione `classic` ne
restano **quattro**
— 35, 46, 64, 84 — e le uniche due adiacenti sono la 35 e la 46, quindi la disposizione scritta a mano porta
**tre** decorazioni su tre righe diverse (46, 64, 84) e nessuna forma su due caselle: quella la usa il generatore,
dove i vincoli lasciano più spazio. La falce resta fuori da `classic` perché somiglia all'illustrazione
`deep-moon`. Le posizioni non si scelgono a occhio: si calcolano.

### D-66 · Un riquadro in `/dev/scenari` per ogni minigioco che si vuole guardare (G3)

**Derivata, su richiesta del proprietario.** Le due animazioni del pacchetto F (le pedine dei
minigiochi a una mossa per volta, D-62) si potevano vedere solo se la carta usciva per caso in
partita: memory e forza 4 non avevano un riquadro in `/dev/scenari`, mentre il tris sì. È la
ragione per cui quella pagina esiste.

I due riquadri nuovi usano le carte di prova della hot seat (`dev-forza-4`, `dev-memory`, D-44), che
prima non erano raggiungibili dagli scenari: il mazzo degli scenari è ora il catalogo vero più
`HOTSEAT_CHALLENGE_CONTENT`. Il memory si apre coperto apposta: cliccando due carte che non
combaciano si vede la coppia restare scoperta, e cliccando la terza si vede la pausa prima che si
richiudano — le due cose che la coda regola.

### D-67 · I wrapper Rive esistono, con il segnaposto e la sonda una volta per sessione (G4)

I cinque wrapper di `public/rive/` sono in `src/art/rive/`: `PawnView` (6 artboard, `Pawn`),
`DieView` (`Die`/`Roll`), `CardView` (`Card`/`Flip`), `MascotView` (6 artboard, `Mood`), `FinaleView`
(`Finale`/`Reveal`). I `.riv` li disegna a mano il proprietario: nessun file è stato creato o
modificato, e i nomi attesi stanno in `src/art/rive/files.ts` (una costante, un posto solo).

Il segnaposto non è un ripiego: è quello che si vede finché il file non c'è, e deve reggere da solo.
Ogni wrapper lo sceglie controllando la presenza del file con una richiesta `HEAD`, **una per file per
sessione** (le sei pedine ne fanno una sola), con l'esito in memoria fuori da React
(`useSyncExternalStore`, come `useHydrated`, D-60): sul server la risposta è sempre «non c'è», così il
primo disegno è il segnaposto e l'idratazione non si disallinea. Conseguenza dichiarata: finché i
`.riv` mancano la console mostra la riga di rete del 404 di ogni file — è il browser che registra la
richiesta, non un errore dell'applicazione.

Una correzione al contratto di `docs/design.md`: l'ingresso `winner` di `finale.riv` è un **numero**
(0 pareggio, 1, 2), non un trigger. Un ingresso che scatta non può dire _chi_ ha vinto.

I segnaposto si guardano tutti insieme in fondo a `/dev/art`. Non hanno test: il progetto non ha un
ambiente DOM per i componenti (`vitest` gira in `node` e include solo `*.test.ts`), quindi la prova è
la pagina.

---

## Le rifiniture (pacchetto H)

### D-68 · In partita il segnaposto di un wrapper è il componente attuale della schermata

**Derivata, su indicazione del proprietario (F6-04, F6-05).** I cinque wrapper di `src/art/rive/` sono
collegati alle schermate che hanno un posto per loro: la pedina del tabellone, il dado, la carta,
la schermata finale. Ognuno prende un `placeholder` — **quello che si vede finché il `.riv` non c'è** —
e le schermate di gioco ci passano il componente che si vede oggi:

- la **pedina** resta il cerchio SVG con il numero del posto (`PawnToken`): dentro l'SVG il canvas Rive
  entra solo attraverso un `foreignObject`, perché un canvas è HTML;
- il **dado** resta `DieFace`, il dado a **pallini**; il dado a cifra di `/dev/art` è il campione della
  pagina, non il dado della partita;
- la **carta** passa `placeholder="children"`: l'ingresso è già un'animazione di Motion (D-57) e il
  mezzo giro in CSS del segnaposto di `/dev/art` litigherebbe con lei;
- la **finale** passa `placeholder="none"` (vedi D-69).

Regola generale: **il campione di `/dev/art` serve a guardare il wrapper, in partita il segnaposto è
sempre il componente attuale**. Finché i `.riv` mancano non deve cambiare niente di quello che si vede.
_Verificato:_ tabellone, riga dei dadi e schermata finale **identici al pixel** prima e dopo il
collegamento, markup della carta identico, zero elementi `canvas` e una sola sonda `HEAD` per file.

### D-69 · Un'animazione decorativa non può mangiare informazione di gioco

**Derivata, su indicazione del proprietario (F6-05).** `finale.riv` entra nella schermata finale come
**ornamento**, in uno spazio nuovo in testa alla sezione, e non prende il posto di niente. Le tre
rivelazioni continuano a scrivere le loro frasi — «Sapientone», «Campione», il nome del vincitore,
compreso «nessuno: stesse risposte giuste» — perché il file riceve solo `winner` e `revealStar` e non
può portare quell'informazione. Il segnaposto di quello spazio è `"none"`: finché il `.riv` manca la
schermata resta identica al pixel.

È la stessa regola che ha già deciso il dado a pallini e l'ingresso della carta che resta (D-68),
portata al caso limite: dove il wrapper **sarebbe** uno scambio di tutta la schermata, non lo è.
_Conseguenza dichiarata:_ `revealStar` scatta **a ogni pressione** (`revealed` va da 0 a 3: le prime
due sono le due stelle bonus, la terza scopre il vincitore) e `winner` resta un numero come dice il
contratto. Se disegnando il file servisse sapere **quale** stella si sta scoprendo, si aggiunge un
`number star` e si aggiorna la tabella di [design.md](design.md): quella decisione si prende davanti
all'editor, col file in mano.

### D-70 · Il disegno del tabellone e il generatore misurano l'ingombro con lo stesso modulo

**Derivata (F7-02).** La geometria che serve **anche al motore** sta in `src/engine/board-geometry.ts`:
l'asse di una scala, il corpo di un serpente e **quali caselle un tratto attraversa** (distanza dal
rettangolo della casella, ritirato di `DECORATION_INSET`, con la tolleranza dell'ingombro vero — metà
montante più tratto per le scale, metà corpo per i serpenti). `src/features/board/geometry.ts` costruisce
i disegni da quei campioni: montanti, pioli, macchie, coda.

_Perché:_ la regola di D-65 («si decora solo una casella che nulla attraversa») la deve poter applicare
il **generatore**, che vive nel motore e non può importare `src/features`. Con la misura in due posti,
il generatore avrebbe evitato caselle che sembrano libere e non lo sono (o viceversa) — e il difetto
corretto a mano sulla 23 e sulla 26 sarebbe potuto tornare per una svista, non per una scelta.

### D-71 · I numeri che finiscono nel disegno si arrotondano

**Derivata, trovata verificando `/dev/disposizioni` (F7-02).** I punti di un serpente e i pioli di una
scala nascono da `Math.sin`, `Math.hypot` e `Math.atan2`: Node e il browser **non li calcolano con gli
stessi ultimi bit**, quindi un `cx` differiva nell'ultima cifra fra l'HTML del server e quello del
browser e React segnalava in console un disallineamento di idratazione («This won't be patched up»).
Ora i punti si arrotondano a due decimali e gli angoli a uno, dove nascono
(`src/engine/board-geometry.ts`); i percorsi erano già arrotondati.

_Perché:_ a scala di tabellone 0,01 unità non si vede, mentre un errore in console a ogni caricamento sì
(è la stessa preoccupazione di D-60). Il difetto c'era anche prima di questo pacchetto: si vedeva solo
sui tabelloni le cui coordinate cadevano sulla cifra sfortunata, come capita con quelli generati.

---

## Le disposizioni e la mascotte (pacchetto I)

### D-72 · Il budget di leggibilità sta dentro il piazzamento, e si misura a inchiostro intero

**Derivata, su indicazione del proprietario (F7-02, pacchetto I).** Due linee sopra la stessa casella si
sovrappongono e lì il numero della casella sparisce: è la stessa ragione per cui una decorazione non si mette dove
passa una scala (D-65), portata alle linee fra loro. I due tetti sono del proprietario, contati sulla `classic` —
**al massimo 6 caselle con più di una linea e 2 linee sulla stessa casella** — e il posto dove applicarli è
**dentro il piazzamento**: si aggiunge una scala o un serpente alla volta e si rifiuta il candidato che porterebbe
il tabellone oltre il tetto, pescando il successivo. Scartare il tabellone finito non funzionerebbe: quasi nessun
seme starebbe dentro il tetto e gli otto tentativi si consumerebbero tutti.

La misura è `measureReadability` (`src/engine/board-readability.ts`), costruita su `elementFootprints` di
`board-geometry.ts`: le caselle di **ogni** elemento, con l'inchiostro vero (montanti della scala, corpo del
serpente) e **senza** ritirare il bordo della casella. Il conto si aggiorna una linea alla volta (`addLine`),
quindi un candidato si prova sul conto corrente e non sul tabellone intero; gli ingombri dei candidati (circa
5.000) restano in una memoria, perché rifare la misura da capo costava secondi per tabellone.

**Il conto della `classic` con questa misura non è quello contato a occhio: 17 caselle con più di una linea e 2
linee per casella**, non 3. La differenza è nella misura, non nel tabellone: l'inchiostro di una scala è largo 62
unità e conta anche le caselle che sfiora soltanto, mentre a occhio si contano gli attraversamenti che si vedono
(le due linee che si incrociano davvero sono 2). I tetti sono rimasti quelli dati — sono una decisione di prodotto
— ma **con questa misura la `classic` non li rispetta** (17 > 6): i tabelloni generati escono quindi più ordinati
della `classic`. Se il risultato sembra troppo vuoto, la manopola è `RULES.board.maxCrossings` (e
`maxLinesPerCell`); `budget: null` nel generatore disaccoppia del tutto il budget, per confronto.

_Conseguenza dichiarata:_ linee piazzate senza sovrapporsi **coprono più caselle** di linee sovrapposte, quindi le
caselle libere che nulla attraversa diminuiscono. Sui semi da 1 a 20 le decorazioni passano da 4 (19 semi su 20
prima del pacchetto) a 1-4; su 200 semi sono quattro in 130 casi, tre in 43, due in 21, una in 5, nessuna in uno
(il seme 113, che non lascia nemmeno una casella decorabile). La regola viene prima del numero (D-65): i numeri
stanno nel log del pacchetto I.

### D-73 · Una disposizione congelata è un file di dati, non un seme

**Derivata, su indicazione del proprietario (F7-03, pacchetto I).** `pnpm board:freeze <seme> <nome>`
(`scripts/board-freeze.ts`) scrive `src/content/boards/<nome>.ts` con la disposizione **intera** — caselle, scale,
serpenti, decorazioni — e riscrive `src/content/boards/frozen.ts`, l'elenco delle congelate. Il file non chiama il
generatore: da lì in poi la disposizione non si muove più, nemmeno se il generatore cambia. Un seme vale finché il
generatore sta fermo, una disposizione congelata vale per sempre. Lo script **rifiuta** di sovrascrivere un file
che esiste, ed è l'unico a chiamare il generatore: i semi e i nomi sono del proprietario, e nel repository non ne
è congelata nessuna.

Le congelate **non entrano in partita da sole**: `boards` resta la `classic` (l'elenco che la lobby offre), le
congelate vivono in `frozenBoards`, le validano gli stessi test di `boards.test.ts` e si guardano in
`/dev/disposizioni`, che ha una sezione per loro.

_Conseguenza sui dati, da decidere, non di questo pacchetto:_ la riga della partita ha già l'id del tabellone
(`games.settings.boardId`), ma il contenuto il gioco lo legge da `public.boards` per id (`loadBoard`, `F2-01`).
Congelare una disposizione la porta fra i contenuti (file → `pnpm content:seed` → riga in `public.boards`), quindi
una serata passata si può ridisegnare finché quella riga non cambia: se un giorno si rigenerasse lo stesso id, il
diario di una serata vecchia mostrerebbe un altro tabellone. Salvare la disposizione (o il suo seme) **sulla riga
della partita** è la soluzione, ma la decisione e la migrazione non sono di questo pacchetto.

### D-74 · La mascotte sta nel pannello di destra e la muovono gli stessi eventi della grafica

**Derivata, su indicazione del proprietario (F6-05, pacchetto I).** La mascotte è l'asset Rive che era rimasto
senza un posto (D-68). Adesso il posto è deciso: **pannello di destra della partita**, **lo stesso animale della
pedina del posto** (`MascotView`, artboard = forma della pedina), una per giocatore. Il `mood` non è uno stato
inventato accanto alla partita: lo muovono **gli stessi `GameEvent[]`** che già guidano le animazioni (F2-05,
D-68), cioè l'elenco che il reducer restituisce a ogni azione. Nessun evento nuovo, nessun canale nuovo.

La regola che la tiene onesta è quella di D-69: **la mascotte non è mai l'unico canale di un'informazione**. Il
mood è un rinforzo visivo di qualcosa che è già scritto altrove (una frase, un numero, una carta): monete e stelle
hanno i loro contatori, gli incroci e le discese la loro animazione, la fine ha le sue tre rivelazioni.

La mappa evento → mood, che è parte della decisione (5 valori: 0 neutro, 1 felice, 2 sorpreso, 3 triste, 4
esultante). Vale per il posto indicato da `seat`; per gli eventi senza posto si applica al posto che l'evento
nomina, altrimenti a entrambi. Quando un'azione produce più eventi, **vince l'ultimo che ha un mood** (gli eventi
senza mood non azzerano: non raccontano niente di nuovo):

| Evento                                                                               | Mood                                            |
| ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `CLIMBED_LADDER`                                                                     | 4 esultante                                     |
| `FINISH_REACHED`                                                                     | 4 esultante (chi arriva)                        |
| `GAME_FINISHED`                                                                      | 4 al vincitore, 3 allo sconfitto, 0 in pareggio |
| `BONUS_STARS`                                                                        | 4 a `champion` e `knowItAll`, 0 agli altri      |
| `MINIGAME_FINISHED`                                                                  | 4 al vincitore, 3 allo sconfitto, 0 in pareggio |
| `CHALLENGE_RESOLVED`                                                                 | 4 a chi ha vinto (`won`), 3 all'altro           |
| `CHALLENGE_CLAIMED`                                                                  | 4 se il posto ha vinto, 3 se ha perso           |
| `STAR_BOUGHT`                                                                        | 4 esultante                                     |
| `COINS_GAINED`, `ITEM_RECEIVED`, `ITEM_BOUGHT`                                       | 1 felice                                        |
| `QUESTION_JUDGED`                                                                    | 1 risposta giusta, 3 sbagliata                  |
| `COINS_LOST`, `ITEM_DISCARDED`, `TURN_SKIPPED`                                       | 3 triste                                        |
| `SLID_DOWN_SNAKE`                                                                    | 3 triste                                        |
| `SNAKE_BLOCKED`                                                                      | 3 al posto del serpente, 1 a chi ha bloccato    |
| `EVENT_DRAWN`, `EVENT_RESOLVED`                                                      | 2 sorpreso                                      |
| `CHALLENGE_DRAWN`, `CHALLENGE_DISPUTED`                                              | 2 sorpreso                                      |
| `TIMER_EXPIRED`, `CHALLENGE_REMATCH`                                                 | 2 sorpreso                                      |
| `ITEM_OVERFLOW`                                                                      | 2 sorpreso                                      |
| ogni altro evento (`ROLLED`, `MOVED`, `TURN_ENDED`, `ROUND_STARTED`, `ITEM_USED`, …) | 0 neutro (e non azzera il mood precedente)      |

**Non è collegata**, ed è voluto: senza `mascots.riv` il segnaposto è la testa dell'animale, ferma, e un
segnaposto che occupa spazio senza fare niente è contro la regola di D-68 (in partita il segnaposto è il
componente attuale, non un riquadro vuoto). La mappa si applica il giorno in cui il file arriva: il wrapper
`MascotView` esiste già dal pacchetto G, con `mood` numerico.

### D-75 · Le illustrazioni hanno una tavolozza propria: il tabellone si colora

**Su indicazione del proprietario** (F6-02, reference consegnata il 2026-09-18). Il riferimento sono i 38 disegni
**a colori** — tinte piatte, contorno scuro, forme tonde — con la richiesta di farli «identici se non ancora
migliori». I principi di `docs/design.md` dicevano «bianco e nero puro» e «il colore è solo dei giocatori, mai sul
tabellone»: cambiano qui, perché l'estetica la decide il proprietario e la richiesta è esplicita.

Cosa cambia e cosa no:

- le **illustrazioni** hanno una tavolozza fissa di tinte piatte, i token `--color-art-*` in
  `src/app/globals.css` (crema, ambra, rosso, blu, cielo, verde, bosco, marrone, terracotta, verde acqua, sabbia,
  navy). Niente sfumature, niente grigi, nessuna ombra;
- il **contorno** resta `currentColor` (inchiostro) e spesso: il disegno si legge anche senza colore;
- il **resto del tabellone non cambia**: caselle, sfide, imprevisti, monete, decorazioni, scale, serpenti e cornice
  restano bianchi e neri, e il colore delle **pedine** resta l'unico colore che si muove;
- `docs/specs.md` non si modifica: la sua regola sul bianco e nero è superata da questa voce, come dice
  `docs/README.md`.

_Perché vale la pena, oltre alla richiesta:_ il colore ha **risolto cinque disegni** che a 48 px non si leggevano in
bianco e nero e che avevo segnato come da rifare — lo spazzolino (era una chiave), la mela (erano due cerchi), la
rosa (era una fiamma), il calzino (era una lampadina) e il cono gelato. Una tinta piatta porta informazione che a
quella misura il tratto non riesce a portare: la mela rossa con la foglia verde è una mela, la stessa sagoma in nero
non lo era.

**Come si applica** (la parte che resta vera anche dopo): le tinte non si scelgono disegno per disegno ma dai token,
il contorno non si colora, e un disegno si giudica **a 48 px nella casella** — dove l'alone del numero morde tutto
ciò che sta sopra e a sinistra di circa (47, 41), colore o no.

**Diviso così** (`HERMES.md` § Chi fa cosa): i disegni li fa e li giudica chi guarda. Dei 38 arrivati con la
reference, 36 sono stati presi come erano; `deep-mirror` e `deep-roots` erano ridisegni delle versioni vecchie —
quelle che a 48 px erano una «C» e un tavolo — e sono stati rifatti sulle forme nuove; `tastes-guitar` era l'ultimo
illeggibile (un palloncino) e ha un corpo nuovo, con la vita invece di due cerchi sovrapposti.

### D-76 · L'attività aperta prende tutto lo schermo e blocca il resto

**Su indicazione del proprietario** (2026-09-18). La carta viveva nella colonna di destra, accanto al tabellone.
Va bene per il dado e per i punteggi, non per un'attività: una domanda o un tris si guardano **in due**, e il
tabellone di fianco è solo una distrazione. Da qui `src/features/cards/card-stage.tsx`: quando `state.card` non è
nullo la carta occupa lo schermo (`fixed inset-0`), il tabellone non si vede, e la schermata si chiude da sé quando
la carta è risolta. Vale nella partita vera e nella hot seat; **non** in `/dev/scenari`, che è un catalogo di 29
riquadri e li mostra in fila.

Tre cose che questa scelta ha portato con sé:

- **Niente comandi persi.** La carta è autosufficiente: «Salta domanda» è un pulsante dentro la carta della
  domanda, e gli oggetti attivi si usano solo **prima** del tiro (`ACTIVE_ITEMS`, `preRoll`), quindi mai mentre una
  carta è aperta. Nascondere il pannello laterale non toglie niente.
- **La fascia in alto è il contesto che dava il tabellone:** su che casella sei, di chi è il turno, i due punteggi,
  e nella partita vera la stanza, il posto e se l'altro è collegato. Senza, a schermo pieno si perde il filo.
- **Il contenitore non si anima.** Una schermata che deve _bloccare_ non può dipendere da un'animazione per essere
  opaca: se i fotogrammi vengono strozzati (scheda in secondo piano) l'opacità resta a metà e il tabellone si vede
  attraverso — è successo, misurato a `0.547`. L'ingresso ce l'ha già la carta dentro (D-57); questo strato compare
  e basta. La regola generale: **l'opacità di uno strato che nasconde non si anima**.

La carta sta al centro dello schermo quando è bassa e scorre dall'inizio quando è più alta (i minigiochi lo sono):
verificato che a 600, 300 e 200 px di altezza disponibile la cima della carta resta visibile e non viene tagliata.

### D-77 · Il tabellone della serata si sceglie in lobby

**Decisione del proprietario** (2026-09-18), che chiude la voce aperta «quale disposizione usa una serata nuova».
In lobby si sceglie fra la **Classica** — preselezionata — e le due o tre disposizioni congelate (F7-03), ognuna
con un nome dicibile.

Non serve nessuna migrazione, ed è la ragione per cui questa strada è quella giusta: `games.settings.boardId` è
**già** scritto sulla riga della partita quando la serata nasce (`src/server/room/lobby.ts`), quindi una serata
passata sa da sé quale tabellone ha usato e il diario si ridisegna uguale. Resta il vincolo dell'altra metà: un
tabellone pubblicato non cambia più (regola 7 di `AGENTS.md` estesa ai tabelloni), altrimenti l'id sulla riga
punterebbe a un contenuto diverso da quello giocato.

Chi fa cosa: le disposizioni congelate le scelgo guardandole (con i nomi), e vanno congelate **dopo** il vincolo
dei 18° — una congelata non si muove più, e non si fissa un tabellone con le scale che si leggono come sbarre.
La scelta in lobby è codice, quindi di Hermes.

Scartate: «sempre la classica», che non usa il generatore; e «una a sorte ogni serata», che è una sorpresa ma non
fa tornare la disposizione che vi è piaciuta.
