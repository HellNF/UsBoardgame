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
- [ ] La pausa della sfida esterna (F4-05) non ferma il timer della carta: se si va a giocare fuori il tempo
      scorre e la sfida può scadere mentre non si guarda. Per i duelli non è un guaio (alla scadenza si passa alla
      doppia conferma, che è già dove si dichiara), ma va deciso se la pausa deve fermare anche il conto.
- [ ] Tentativi di accesso: il contatore del ritardo è in memoria del processo (D-50); se il sito diventasse
      pubblico va spostato su Postgres (una tabella di tentativi per stanza).
- [ ] **L'archivio delle partite non si riempie mai.** Nessuno scrive `status = 'finished'`: quando il motore
      arriva alla fine la riga resta `playing` (e va bene per la schermata finale, che si riapre anche
      rientrando), ma `findFinishedGames` cerca `status = 'finished'`, quindi «Partite passate» nel diario resta
      vuoto; e con «Nuova partita» la serata conclusa diventa `abandoned`, cioè non torna più. Si chiude
      portando la partita a `finished` (con `finished_at`) nella stessa transazione dell'azione che la conclude,
      dentro `apply_game_action`. Trovato in locale il 2026-09-18 (F5-06).

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
(«Marta sta scrivendo la risposta…», «Leo sta giudicando…», «Tocca a Marta muovere»). Nella hot seat e nella pagina
degli scenari il valore è `"all"` e i comandi si vedono tutti, come prima; `/dev/scenari` ha un interruttore per
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
