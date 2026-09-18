# Roadmap

Fasi da [specs.md § Piano di sviluppo](specs.md#piano-di-sviluppo). Ogni task ha un id (`F<fase>-<n>`) citato nei
`TODO(...)` del codice. **Aggiorna lo stato qui quando inizi o chiudi un task** e aggiungi in fondo al task, in una riga, cosa hai
lasciato di non ovvio.

| Stato | Significato                                                                                                             |
| ----- | ----------------------------------------------------------------------------------------------------------------------- |
| `[ ]` | da fare                                                                                                                 |
| `[~]` | in corso                                                                                                                |
| `[L]` | codice scritto e `pnpm check` verde, **da verificare in locale con Docker** (vedi [local-testing.md](local-testing.md)) |
| `[x]` | fatto e verificato                                                                                                      |

Dipendenze: 0 → 1 → 2 → 3 → (4, 5) → 7. La fase 6 può procedere in parallelo dalla fase 1.
Dopo la fase 3: **prima serata giocabile**.

## Fase S · Struttura del progetto

- [x] **S-01** Scaffold Next.js 16 + Tailwind 4 + ESLint + Prettier + Vitest, pnpm.
- [x] **S-02** Cartelle definitive, regole di import in ESLint, token e font.
- [x] **S-03** Tipi del motore, `RULES`, helper `cellToCoord` con test.
- [x] **S-04** Schemi Zod dei contenuti, esempi, script `content:seed`.
- [x] **S-05** Supabase init, migrazione iniziale con RLS (non ancora eseguita su un database).
- [x] **S-06** Documentazione per gli agenti.

## Fase 0 · Base — _entrambi entrano nella stessa stanza_

- [x] **F0-01** Avviare Supabase locale (`pnpm db:start`), applicare la migrazione, correggere eventuali errori SQL,
      `pnpm db:types`. Creare `.env.local`.
      Nota: il pacchetto D ha corretto la migrazione leggendola (non è mai stata applicata): policy del catalogo
      legate ad `active`, `select` concesso ai client solo sulle tabelle leggibili e nessun privilegio di scrittura
      (su `rooms` nemmeno il `select`), `replica identity full` su `games`, `game_events` e `players`, indice su
      `used_questions (room_id, seat)` e la funzione `apply_game_action` delle transazioni. Resta da **applicarla**:
      `pnpm db:reset` e `pnpm db:types` sono la verifica (voce F0-01 del Registro).
- [x] **F0-02** `hashPassword` / `verifyPassword` con `scrypt` + test.
      Nota: `src/server/auth/password-core.ts` (scrypt con salt casuale, formato `scrypt$N$r$p$salt$hash`, confronto
      con `timingSafeEqual`, 7 test) e `password.ts` con il marcatore `server-only`. Il core è senza marcatore perché
      lo usano anche gli script `tsx` (`room:create`): l'import dal browser è impedito da ESLint.
- [x] **F0-03** `pnpm room:create`: crea stanza e due posti (password chiesta a terminale, mai negli argomenti).
      Nota: `scripts/create-room.ts` con `--code`, `--name1`, `--name2`, `--pawn1/2`, `--color1/2`; la password si
      chiede due volte a terminale e si salva solo l'hash. Lettura di `.env.local` in `scripts/lib/env-file.ts` e
      argomenti puri in `scripts/lib/room-args.ts` (12 test). Da eseguire con Supabase acceso (Registro, F0-03).
- [x] **F0-04** `src/proxy.ts` per il refresh della sessione; `POST /api/rooms/join`; accesso anonimo; ritardo sui
      tentativi falliti. Test RLS: un posto non legge la scheda dell'altro né `rooms`.
      Nota: `src/proxy.ts` (il middleware di Next 16 si chiama proxy) rinnova il cookie della sessione, rimanda alla
      pagina di accesso chi apre `/r/...` senza sessione e non fa nulla senza `.env.local`; `POST /api/rooms/join`
      valida il corpo con Zod, le due risposte sbagliate (codice o password) sono identiche e arrivano dopo il ritardo
      crescente di `src/server/auth/attempts.ts` (test); `POST /api/rooms/leave` libera il posto. Le query di verifica
      sono in `supabase/tests/rls.sql`.
- [x] **F0-05** Pagina di accesso (codice, password, scelta del posto) e lobby minima con indicatore "connesso".
      Nota: UI pronta e visibile in `/dev/ui` su dati finti (`src/features/access`), con lo stato dell'altro
      giocatore; il collegamento a Supabase e la scelta del posto sono del pacchetto D.
      Dal pacchetto D: la pagina `/` usa `AccessContainer` (sessione anonima, `POST /api/rooms/join`, scelta del posto)
      e rimanda alla schermata della fase; la lobby di `/r/[code]/lobby` è collegata ai dati veri (F2-02, F2-04) e
      l'indicatore "l'altro è collegato" viene da Presence.
- [ ] **F0-06** Progetto Supabase remoto + progetto Vercel + variabili; deploy di prova.

## Fase 1 · Tabellone — _partita completa su un solo schermo_

- [x] **F1-01** Disposizione `classic` (100 celle, 7 scale, 6 serpenti, geometrie ispirate alla reference) +
      validatore dei vincoli di [rules.md § Tabellone](rules.md#tabellone) con test.
      Nota: la disposizione è una proposta in `src/content/boards/classic.ts` (posizioni e geometrie da rivedere a
      occhio accanto alla reference); i vincoli sono verificati, le quantità stanno in `RULES.board.cellCounts`.
      Il proprietario ha approvato le posizioni con una correzione: vincolo 7, scale e serpenti entro 5 file
      (D-42). La scala 28→84 è diventata 28→72, il serpente 87→24 è diventato 87→37.
- [x] **F1-02** `createInitialState`.
- [x] **F1-03** `reduce` per: tiro, rimonta, movimento, caselle libere/monete, scale e serpenti con **segnaposto**
      per domanda e sfida (risolte con un pulsante "riuscita/fallita"), fine turno, round, fine partita, stelle bonus.
      Test per ogni regola.
      Nota: il pacchetto A ha implementato le regole complete al posto dei segnaposto (domande, sfide, oggetti,
      imprevisti, minigiochi); i segnaposto servivano solo a provare il tabellone prima della fase 3.
      Da questa sessione: `src/engine/simulation.test.ts` gioca 200 partite casuali sul tabellone `classic`
      (RNG per seme) e verifica che nessuna si blocchi, che `version` cresca di 1 per azione, gli invarianti
      (monete, stelle, oggetti, posizione) e il limite di round. A partita finita `round` è l'ultimo round
      giocato: non compare più il "round 26" (rules.md § Fine partita).
- [x] **F1-04** `EngineContext` finto per i test (RNG deterministico).
      Nota: `src/engine/testing.ts` (non esportato da `src/engine/index.ts`) con RNG a sequenza, orologio finto,
      domande e sfide finte, una seconda disposizione valida e un piccolo aiuto per giocare nei test.
- [x] **F1-05** Tabellone SVG con segnaposto geometrici, pedine, scale e serpenti generati, dadi, pannello laterale.
      Nota: pagina `/dev/hotseat` (404 in produzione, D-43) con partita completa per due giocatori su un solo
      schermo: tabellone, dadi, pannello, tutte le carte, timer, schermata finale. Verificato a occhio con
      `pnpm dev` (voci F1-05 del Registro in [local-testing.md](local-testing.md)).
      Modalità "hot seat" (entrambi i posti sullo stesso schermo) per provare le regole senza Supabase.
      Correzioni del 2026-09-17 (branch `hermes/e-ui-fix`): numeri e simboli delle caselle disegnati sopra scale e
      serpenti con l'alone del colore della carta (A1); pedina con il **numero del posto** invece dell'iniziale del
      nome (A2); turno segnalato da bordo pieno, pallino pieno ed etichetta "Tocca a te" (A3); partita in **una
      schermata sola** da 1024 × 768 in su, con il solo pannello di destra scorrevole (A4); stella della casella 15
      leggibile sotto la scala 8→26, che non è stata spostata (A5).
      Sullo stesso branch la pagina `/dev/scenari` elenca **25 stati di carta fissati a mano** (le carte rare: i
      sette imprevisti, l'offerta della stella con e senza monete, lo zaino pieno, la doppia conferma in disaccordo,
      la sfida lampo del serpente, la schermata finale): la carta è viva e cliccabile, e la verifica è nel Registro
      di [local-testing.md](local-testing.md).

## Fase 2 · Tempo reale — _partita a distanza sincronizzata_

- [x] **F2-01** `applyAction` + `POST /api/games/[gameId]/actions` (identità, versione, transazione, eventi).
      Nota: `src/server/game/` con schemi Zod delle azioni (oggetti stretti: i campi di troppo sono rifiutati),
      `apply-action.ts` (sessione → posto, stanza, versione attesa, `reduce`, `apply_game_action` in una transazione) e
      gli adattatori del contesto in `context.ts`. Risposte 400/401/403/404/409/422/500; il `409` porta lo stato fresco
      con cui il client si riallinea. Verifica nel Registro (F2-01), **compreso il doppio clic**.
- [x] **F2-02** Lobby completa: impostazioni, pronto, creazione della partita (`status` lobby → playing).
      Nota: la parte visiva (disposizione, categorie, durata massima, posta, pronto dei due posti) è in
      `src/features/lobby` e si vede in `/dev/ui`; `status` e la creazione della partita sono del pacchetto D.
      Dal pacchetto D: `POST /api/rooms/[code]/games` (impostazioni, pronto, `start`, `new`) con le regole pure in
      `src/server/room/lobby.ts` (test); con entrambi pronti si passa a `sheets` se una scheda è incompleta (D-28),
      altrimenti a `playing`; `LobbyContainer` collega `LobbyView` all'API e a Realtime.
      Verificato in locale il 2026-09-17; il difetto trovato allora (il passaggio "pronto → si parte" non era atomico)
      è corretto dal pacchetto E con una transazione (D-53): `set_lobby_ready` e `start_lobby_game` nella migrazione
      `20260918120000_lobby_atomic.sql`, con `supabase/tests/lobby.sql`.
      Chiuso in locale il 2026-09-18: i due «Sono pronto» insieme, dieci volte su dieci, senza perdere un pronto e
      senza un 500; `lobby.sql` verde (non partiva: voleva il cast a `smallint`); il secondo clic sul pulsante non dà
      più un 409 rosso (voce F2-02 del Registro).
- [x] **F2-03** Abbonamento Realtime a `games`/`game_events`, gestione dei `409`, riconnessione alla fase salvata.
      Nota: `src/features/presence/use-room-realtime.ts` (un canale per stanza, `games` e `game_events` filtrati per
      partita) e `OnlineTable`, che manda le azioni all'API e sul `409` prende lo stato del server senza ricalcolarlo.
      Ogni pagina della stanza rimanda alla schermata della fase (`src/server/room/current.ts`): è la riconnessione.
- [x] **F2-04** Presence: indicatore dell'altro giocatore e `last_seen_at`.
      Nota: Presence sul canale della stanza (`{ seat, screen }`) alimenta l'indicatore in lobby e in partita;
      `players.last_seen_at` si aggiorna a ogni caricamento di pagina della stanza (lato server).
- [~] **F2-05** Animazioni guidate dagli eventi (pedina che salta, scala, serpente) con Motion.
  Nota: dal pacchetto E il percorso della pedina è **cella per cella** (`src/features/board/route.ts`: un saltello
  per ogni casella, gradino per gradino sulle scale, lungo il corpo sui serpenti) e gli eventi di spostamento si
  **accodano** e si animano in ordine, uno per volta (`src/features/board/use-move-queue.ts`), anche nella partita
  online, dove gli eventi arrivano dal tempo reale. Anche l'ingresso della carta è un'animazione (D-57).
  Dal pacchetto F anche le **pedine dei minigiochi** si animano (D-62): tris, forza 4 e memory passano dalla
  stessa coda (`src/features/minigames/use-minigame-queue.ts`, con i tempi puri e provati in `queue.ts`), e in
  memory una coppia sbagliata resta scoperta il tempo di vederla prima di richiudersi.
  Verificato in parte in locale il 2026-09-18: online nessun movimento perso né tornato indietro, con la coda che
  regge anche mentre si apre una carta. Restano il saltello cella per cella guardato a occhio in due (da una
  scheda di sfondo non si può campionare) e le pedine dei minigiochi in partita vera: la voce F2-05 del Registro.
  Dal pacchetto F le pedine dei minigiochi si animano una mossa per volta (D-62, `queue.ts` + `use-minigame-queue.ts`,
  8 prove). Verificato in locale il 2026-09-18 che la coda è collegata ai tre tabellini e che le prove sono verdi;
  i tempi in millisecondi non si misurano da qui, quindi l'occhio resta al proprietario. In `/dev/scenari` manca
  un riquadro per memory e forza 4, che è il modo più semplice per guardarle.

## Fase 3 · Domande — _prima serata giocabile_

- [x] **F3-01** `drawQuestion` lato server (categoria, 60/40, livelli profonde, solo domande con risposta, registro
      per posto/coppia, azzeramento) + test.
      Nota: la scelta è pura in `src/server/game/question-draw.ts` (`selectQuestion` e `selectChallenge`, 16 test):
      categoria, livello massimo per le profonde, solo domande con risposta in scheda (D-28), niente ripetizioni e
      azzeramento del registro a mazzo esaurito (D-29), categoria di ripiego se quella della casella è vuota (D-30).
      Il 60/40 lo decide il motore; l'adattatore in `context.ts` carica catalogo, schede e registro. Registrazione
      delle domande uscite e azzeramento avvengono nella stessa transazione dell'azione.
- [x] **F3-02** Pagina scheda: blocchi per categoria, salvataggio automatico, avanzamento; stato `sheets` in lobby.
      Nota: la scheda è in `src/features/sheet` (blocchi per categoria, contatore, avviso scheda incompleta) e si
      vede in `/dev/ui`; le risposte private e lo stato `sheets` arrivano con il pacchetto D.
      Dal pacchetto D: la pagina `/r/[code]/sheet` legge le domande del catalogo e **solo** le proprie risposte (RLS),
      il salvataggio passa da `PUT /api/sheet/[questionId]` con la risposta controllata contro la domanda, lo stato
      `sheets` nasce dal pronto in lobby (F2-02) e la lobby offre "Gioca lo stesso" (D-28).
- [x] **F3-03** Carta domanda: `multiple` (verdetto automatico), `short` (giudizio dell'altro), `open`;
      regola della scala con una sola domanda.
      Nota: motore completo e testato (pacchetto A), carta della UI dal pacchetto C, e dal pacchetto E ogni schermo
      vede **solo i comandi del posto che guarda** (D-56): chi aspetta legge «Leo sta scrivendo la risposta…» o
      «Marta sta giudicando la tua risposta…».
      Chiuso in locale il 2026-09-18 in partita vera, guardando la stessa scena dai due posti: il campo di risposta lo
      vede solo chi risponde, i tre verdetti solo chi giudica (voce F3-03 del Registro).
- [L] **F3-04** Mazzo iniziale: ~150 domande secondo [content.md](content.md) → revisione del proprietario.
  Nota: 150 domande (30 per categoria: 8 da scheda e 22 aperte; profonde dieci per livello) in
  `src/content/questions/`, con i controlli di forma in `src/content/content.test.ts`. I testi sono una prima
  bozza da rileggere: voce nel Registro di [local-testing.md](local-testing.md).
- [L] **F3-05** `pnpm content:push` per pubblicare i contenuti in produzione.
  Nota: `scripts/push-content.ts` fa upsert su `questions`, `challenges` e `boards` con gli stessi id del seed
  (ripubblicare non duplica e non tocca schede, domande usate né partite). Da eseguire con le variabili del
  progetto remoto: Registro, voce F3-05.

## Fase 4 · Sfide — _tutte le categorie tranne l'emulatore_

- [L] **F4-01** Mazzo di sfide (integrati, videochiamata, esterni; ≥ 6 lampo) e filtri della serata.
  Nota: 17 carte in `src/content/challenges.ts` (5 integrate, 10 in videochiamata di cui 6 lampo, 2 esterne).
  `quiz-lampo` e `riflessi` sono duelli a doppia conferma finché F4-04 non aggiunge i loro moduli al motore
  (D-41). La revisione dei testi è del proprietario.
- [x] **F4-02** Carta sfida: duello/prova, giudice, doppia conferma, disputa, timer (`TIMER_EXPIRED`).
      Nota: motore completo e testato (pacchetto A, con D-33 e D-36), carta e route dal pacchetto D. Dal pacchetto E
      la carta è per posto (D-56): nella prova giudica solo l'altro, nella doppia conferma e nel disaccordo ognuno ha
      il suo pezzo e legge se l'altro ha già dichiarato.
      Chiuso in locale il 2026-09-18: prova giudicata dall'altro e doppia conferma per posto, in partita vera
      (voce F4-02 del Registro).
- [x] **F4-03** Minigiochi nel motore + UI: tris, forza 4, memory.
      Nota: i tre moduli puri sono in `src/engine/minigames` con test (pacchetto A), la UI è in
      `src/features/minigames` (provabile in `/dev/hotseat`: D-44) e le mosse passano dal server via `MINIGAME_MOVE`
      (pacchetto D). Dal pacchetto E ogni schermo mostra i **propri** comandi quando tocca a lui e una riga di attesa
      quando tocca all'altro (D-56).
      Chiuso in locale il 2026-09-18: tris online con i turni che si alternano davvero fra i due posti, e la riga di
      attesa per chi guarda e non muove (voce F4-03 del Registro).
- [x] **F4-04** Minigiochi a tempo: quiz, riflessi.
      Nota: fatti nel pacchetto E (D-55). `quiz` e `reflex` sono moduli del motore (`src/engine/minigames`) con test:
      il quiz usa le domande della carta (contenuto pubblico in `src/content/challenges.ts`), i riflessi prendono il
      momento del segnale dall'orologio del server. Le carte `quiz-lampo` e `riflessi` sono diventate `automatic`
      (D-41 superata) e si possono provare in `/dev/scenari` (due riquadri nuovi) e in `/dev/hotseat`.
      Chiuso in locale il 2026-09-18: quiz giocato online dal browser (punti e turno giusti, riga di attesa per
      l'altro) e riflessi risolti dal server. Da decidere la durata della carta del quiz, che può scadere prima delle
      cinque domande e mandare la sfida alla doppia conferma (voce F4-04 del Registro).
- [x] **F4-05** Pausa per sfida esterna (link Lichess, skribbl.io) e ritorno con "Chi ha vinto?".
      Nota: dal pacchetto E la carta delle sfide esterne mostra il link, ha il pulsante «Andiamo a giocare» che mette
      la partita in pausa (le dichiarazioni spariscono finché non si torna) e al ritorno chiede «Siamo tornati: chi ha
      vinto?» e riapre le dichiarazioni di entrambi. La pausa è della schermata, non dello stato condiviso: la serata
      resta ferma sulla carta.
      Chiuso in locale il 2026-09-18 in partita vera: la pausa è davvero della schermata (l'altro posto continua a
      vedere le sue dichiarazioni) e il ritorno le riapre. Resta da decidere se la pausa deve fermare anche il timer
      della carta, che intanto scorre (voce F4-05 del Registro).
- [x] **F4-06** Sfida lampo del serpente.
      Nota: motore (30 s, Antidoto, vittoria = resta, altrimenti scende) e test fatti nel pacchetto A; UI in C e dal
      pacchetto E la vista è per posto (D-56).
      Chiuso in locale il 2026-09-18: la sfida lampo è comparsa da sola sullo schermo dell'altro posto e il giudizio
      «Non riuscita» ha fatto scendere la pedina dalla 17 alla 7, con −2 monete (voce F4-06 del Registro).

## Fase 5 · Economia — _regole complete_

- [x] **F5-01** Monete da domande e sfide, raddoppio 71-100, mai sotto zero.
      Nota: motore completo e testato (monete da domande, sfide e caselle, raddoppio da 71 in su, mai sotto zero).
- [x] **F5-02** Casella stella e offerta.
      Nota: motore completo e testato; l'offerta compare solo se il giocatore ha almeno 10 monete (D-35).
- [x] **F5-03** Oggetti: acquisto, uso, limite di 3, scarto.
      Nota: motore completo e testato (acquisto, uso di un solo oggetto attivo per turno, scarto al quarto).
- [x] **F5-04** Imprevisti.
      Nota: motore completo e testato (sette imprevisti equiprobabili, nessuna reazione a catena).
- [~] **F5-05** Schermata finale: stelle bonus una alla volta, vincitore, posta in palio.
  Nota: motore delle stelle bonus e del vincitore fatto e testato (pacchetto A), schermata dal pacchetto C
  (provabile in `/dev/scenari`, tre riquadri).
  Verificato in parte il 2026-09-18: la schermata finale si apre anche nella partita online, con le statistiche al
  plurale giusto («1 stella · 17 monete · 3 risposte giuste») e il pulsante che scopre le stelle una alla volta.
  L'assegnazione delle stelle bonus è già stata guardata nella hot seat; online non era giudicabile perché lo
  stato finale l'ho forzato a mano (voce F5-05 del Registro).
- [x] **F5-06** Diario della serata e archivio delle partite.
      Nota: la vista è in `src/features/diary` (momenti della serata + archivio) e si vede in `/dev/ui` su dati
      finti; la lettura del diario dal database è del pacchetto D.
      Dal pacchetto D: la pagina `/r/[code]/diary` legge i momenti da `game_events` con `src/server/diary/read-diary.ts`
      (mappa evento → momento pura, con test: round, monete, oggetti, scale, serpenti, stelle) e l'archivio dalle
      partite concluse; le risposte della scheda non entrano mai nel diario.
      Dal pacchetto E il diario scrive il **testo** della domanda e il **nome** della sfida dal catalogo nel bundle
      (D-54), non registra le monete a zero e i testi sono stati riletti.
      Verificato in locale il 2026-09-18 sulla partita vera: testo della domanda, nome della sfida, monete col segno e
      la provenienza, nessuna riga a zero. Corretto qui un difetto: una prova non riuscita era scritta «Vinta: +0
      monete» e attribuita al giudice (D-59).
      L'**archivio** è del pacchetto F: `apply_game_action` porta la partita a `finished` con `finished_at` nella
      stessa transazione dell'azione che la conclude, e «Nuova serata» abbandona solo una partita non conclusa
      (D-61, migrazione `20260918130000_finish_game.sql`, regole pure in `src/server/game/game-status.ts`,
      controlli SQL in `supabase/tests/finish_game.sql`).
      Chiuso in locale il 2026-09-18: serata giocata fino in fondo, riga `finished` con la data, «Partite passate» che
      si riempie, e «Nuova partita» che non se la porta più via. Corretto qui il contraccolpo: la serata conclusa
      resta sulla schermata finale invece di far nascere una lobby a ogni ricarica, e «Nuova partita» apre davvero la
      serata nuova (D-64). Resta del proprietario solo la rilettura dei testi a voce.
      Da verificare in locale con la voce F1 del Registro; la rilettura dei testi a voce resta del proprietario.

## Fase 6 · Illustrazioni — _estetica finale_ (in parallelo)

- [ ] **F6-01** Reference in `docs/reference/` e revisione di [design.md](design.md) accanto alle immagini.
- [~] **F6-02** ~35 illustrazioni delle domande + 3 stelle + decorazioni (SVG).
  Nota: dal pacchetto F ci sono i 38 disegni (35 domande, 7 per categoria, + 3 stelle) in `src/art/illustrations`,
  con registro `index.ts` e la pagina `/dev/art` (48 px e 200 px, 404 in produzione). Il tabellone li usa al posto
  delle iniziali e le 35 caselle domanda hanno 35 disegni diversi. Verificato in locale il 2026-09-18.
  Restano: le **decorazioni** (cerchi, mezzelune, diagonali) sono ancora i segnaposto geometrici del pacchetto C, e
  tre disegni non si leggono (`deep-mirror`, `memories-phone`, `deep-roots` a 48 px). Voce F6-02 · F6-03 del Registro.
- [L] **F6-03** Scale e serpenti definitivi (montanti e pioli, corpo a macchie, testa con occhio).
  Nota: fatti nel pacchetto F (macchie, occhio, lingua, coda che si assottiglia; scale con montanti e pioli
  bianchi bordati di nero), con `geometry.test.ts`. Verificato in locale il 2026-09-18: si leggono anche sopra le
  caselle nere. Resta l'occhio del proprietario (voce F6-02 · F6-03 del Registro).
- [ ] **F6-04** Rive: wrapper e segnaposto per pedine (6), dadi, carta; file `.riv` creati a mano nell'editor Rive.
- [ ] **F6-05** Rive: wrapper e segnaposto per mascotte (6) e finale; file `.riv` creati a mano nell'editor Rive.
- [ ] **F6-06** Suoni opzionali.

## Fase 7 · Extra — _versione rifinita_

- [ ] **F7-01** Emulatore DS nel browser per sfide a punteggio (file caricato solo in locale); elenco giochi da decidere.
- [ ] **F7-02** Generatore casuale di disposizioni da seme.
- [ ] **F7-03** Altre disposizioni predefinite.
- [ ] **F7-04** Bilanciamento dopo le prime partite (solo `RULES` e contenuti).
