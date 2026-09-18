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
- [~] **F0-06** Progetto Supabase remoto + progetto Vercel + variabili; deploy di prova.
  Fatto il 2026-09-18: progetto Supabase `wgrctbgxsxtkuleavrwz` (eu-west-1, Postgres 17), le tre migrazioni
  applicate con `pnpm supabase db push`, contenuti pubblicati con `pnpm content:push` (150 domande, 17 sfide,
  1 tabellone), accesso anonimo attivato a mano dal dashboard (è spento di default: senza, nessuno entra) e
  **RLS verificata sul remoto** con una sessione anonima vera — `rooms` non leggibile, le altre tabelle filtrate
  a zero righe, scrittura diretta e `apply_game_action` dal client rifiutate.
  Restano: la stanza vera (`pnpm room:create` dal Terminale, serve un terminale vero per la password), il
  progetto Vercel con le tre variabili, e il deploy di prova. Vedi la voce «Due ambienti» del Registro.
  **Da riallineare (pacchetto J, D-78):** il tabellone sul remoto è quello pubblicato **prima** che le decorazioni
  della `classic` fossero spostate, quindi non è più uguale al file locale. Il primo `pnpm content:push` con la
  regola nuova si fermerà su `classic` e dirà cosa fare; la sequenza proposta è nel log del pacchetto J.
  **Prima di una serata vera:** `pnpm check:ready` (pacchetto K) risponde in un comando alle sei domande che finora
  erano sei verifiche a mano di questo Registro — migrazioni, accesso anonimo, contenuti, stanza, RLS, canale —
  con il rimedio sotto ogni riga rossa e `pnpm check:realtime` per l'ultima.

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
      **Dal pacchetto J (D-79)** il canale è **privato**: si iscrive solo chi ha una sessione in quella stanza (due
      policy su `realtime.messages`), e sul canale passano anche mosse ed eventi — per questo la verifica in locale
      guarda tutte e due le cose. **Dal pacchetto K la verifica è uno script**: `pnpm check:realtime` (D-80).
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
  Dal pacchetto G in `/dev/scenari` ci sono i **due riquadri che mancavano** (memory e forza 4, gli stessi due clic:
  due mosse ravvicinate si disegnano una per volta), quindi le due animazioni si guardano senza aspettare che la carta
  esca in partita: voce F2-05 del Registro, sezione G3.

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
- [x] **F3-05** `pnpm content:push` per pubblicare i contenuti in produzione.
      Nota: `scripts/push-content.ts` fa upsert su `questions`, `challenges` e `boards` con gli stessi id del seed
      (ripubblicare non duplica e non tocca schede, domande usate né partite). Da eseguire con le variabili del
      progetto remoto: Registro, voce F3-05.
      Chiuso il 2026-09-18: eseguito sul progetto remoto vero, 150 domande, 17 sfide e 1 tabellone pubblicati e
      ricontati sul database. Da rilanciare a ogni revisione dei testi.
      **Dal pacchetto J (D-78)** i **tabelloni** non si riscrivono più: prima di scrivere, lo script confronta il
      layout locale con quello pubblicato e, se è diverso, si ferma (uscita 3) dicendo quale id è cambiato; le due
      strade sono un id nuovo oppure `pnpm content:push -- --force`. Domande e sfide restano come prima.

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
- [L] **F6-02** ~35 illustrazioni delle domande + 3 stelle + decorazioni (SVG).
  Nota: i 38 disegni (35 domande, 7 per categoria, + 3 stelle) sono in `src/art/illustrations`, con registro `index.ts`
  e la pagina `/dev/art` (48 px e 200 px, 404 in produzione); il tabellone li usa al posto delle iniziali e le 35
  caselle domanda hanno 35 disegni diversi. Dal pacchetto G le **decorazioni** multi-cella sono forme piene
  (`disc`, `crescent`, `hill`, `diamond` in `board.tsx`, scelte in `src/content/boards/classic.ts`, D-65) e i tre
  disegni che a 48 px non si leggevano (`deep-mirror`, `deep-roots`, `memories-phone`) sono rifatti. Verificato in
  locale il 2026-09-18: il rombo è pieno e non più un anello, e `memories-phone` ora si legge. Le decorazioni sono
  **tre** (colle 46, disco 64, rombo 84): D-65 ha tre vincoli — niente caselle attraversate, niente caselle di
  bordo (la cornice se le mangia), forme piene e mai anelli — e in `classic` restano solo quattro caselle legali,
  che `crossedCells` calcola invece di scegliere a occhio.
  **Dal pacchetto H** i due disegni che restavano aperti sono rifatti (H1): `deep-mirror` è uno specchio a mano visto
  di fronte — ovale più alto che largo, cornice spessa, manico corto e largo, e dentro una fascia diagonale di carta
  su fondo di inchiostro, con 4 unità di carta fra cornice e fondo — e `deep-roots` è terra in sezione, con la terra
  come campitura piena e quattro radici asimmetriche che si assottigliano a gradini. Resta il suo occhio: la voce H1
  del Registro dice cosa guardare a 48 px.
  `deep-roots` è stato poi rifatto una terza volta in verifica: la campitura rettangolare si leggeva come un
  **tavolo**, e ne esce con la terra ridotta a una zolla sottile e le radici che si **biforcano** — nessuna gamba si
  biforca, ed è quello il segno. Le due regole generali che ne restano sono in design.md: l'angolo in alto a
  sinistra del disegno resta libero (lì morde l'alone del numero) e a 48 px conta la silhouette, non il dettaglio.
- [L] **F6-03** Scale e serpenti definitivi (montanti e pioli, corpo a macchie, testa con occhio).
  Nota: fatti nel pacchetto F (macchie, occhio, lingua, coda che si assottiglia; scale con montanti e pioli
  bianchi bordati di nero), con `geometry.test.ts`. Verificato in locale il 2026-09-18: si leggono anche sopra le
  caselle nere. Resta l'occhio del proprietario (voce F6-02 · F6-03 del Registro). Dal pacchetto H l'asse della
  scala e il corpo del serpente si calcolano in `src/engine/board-geometry.ts` (D-70): la forma non cambia, cambia
  dove nasce.
- [L] **F6-04** Rive: wrapper e segnaposto per pedine (6), dadi, carta; file `.riv` creati a mano nell'editor Rive.
  Nota: dal pacchetto G i wrapper ci sono (`src/art/rive/`: `PawnView`, `DieView`, `CardView`, `MascotView`,
  `FinaleView`), ognuno col suo segnaposto e con la sonda che prende il file appena c'è (nome esatto in `files.ts`,
  contratto in docs/design.md § Animazioni Rive). I `.riv` restano da disegnare a mano: la lista degli artboard, delle
  macchine a stati e degli ingressi è nella voce F6-04 · F6-05 del Registro.
  **Dal pacchetto H i wrapper sono collegati alle schermate** (D-68): il tabellone usa `PawnView` al posto della
  pedina SVG, i dadi `DieView`, le carte `CardView`. Finché i `.riv` mancano non cambia niente di quello che si vede:
  in partita il segnaposto di ogni wrapper è il **componente attuale** della schermata (il cerchio SVG con il numero
  del posto, il dado a pallini, la carta con il suo ingresso di Motion), e il campione di `/dev/art` resta nella
  pagina. Resta da verificare col primo `.riv` esportato che il file prenda il posto del segnaposto.
  **Dal 18/09/2026 (D-82) la pedina è il personaggio**: i sei animali sono disegni SVG in `src/art/characters`, a
  colori, con la pedana del colore del giocatore e il numero del posto, e si muovono con Motion (schiacciata
  atterrando, inclinazione sul serpente, respiro a chi tocca). Il disco col numero resta solo per una pedina senza
  animale. `pawns.riv` non serve più per giocare: se arriva, prende il posto del disegno.
- [L] **F6-05** Rive: wrapper e segnaposto per mascotte (6) e finale; file `.riv` creati a mano nell'editor Rive.
  Nota: come F6-04 — stesso pacchetto, stessi wrapper, stessa voce del Registro; i segnaposto si guardano tutti
  insieme in fondo a `/dev/art`.
  **Dal pacchetto H** `FinaleView` è collegato alla schermata finale come **ornamento** in uno spazio nuovo in testa
  alla sezione, con segnaposto «niente»: le tre rivelazioni e le loro frasi restano come sono, perché il file riceve
  solo `winner` e `revealStar` (D-69).
  **Dal pacchetto I** il posto della **mascotte** è deciso — pannello di destra, un animale per posto come la
  pedina, movimento dagli stessi `GameEvent[]` delle animazioni, mai unico canale di un'informazione (D-74, mappa
  evento → mood compresa) — ma non è collegata: senza `mascots.riv` il segnaposto occuperebbe spazio senza fare
  niente.
  **Dal 18/09/2026 (D-82) il motivo è caduto**: i sei personaggi esistono come disegni SVG con i **cinque umori**
  (`src/art/characters`, campionario in `/dev/personaggi`), quindi la mascotte nel pannello avrebbe qualcosa da
  fare. Resta da collegare: la mappa evento → umore di D-74 e il posto nel pannello di destra.
- [ ] **F6-06** Suoni opzionali.

## Fase 7 · Extra — _versione rifinita_

- [ ] **F7-01** Emulatore DS nel browser per sfide a punteggio (file caricato solo in locale); elenco giochi da decidere.
- [L] **F7-02** Generatore casuale di disposizioni da seme.
  Nota: `generateBoard(seed)` in `src/engine/board-generator.ts` (pacchetto H, rifinito nei pacchetti I e J). Funzione
  **pura**: il caso viene solo dal seme (generatore congruenziale a interi, niente `Math.random`), quindi stesso seme
  = stessa disposizione anche su macchine diverse. Rispetta i vincoli di [rules.md § Tabellone](rules.md#tabellone)
  — la distribuzione di tipi della `classic`, 7 scale e 6 serpenti, nessun estremo condiviso, niente sulla 1 e sulla
  100, al massimo 5 file, nessuna testa di serpente fra la 2 e la 12 — la regola delle decorazioni di D-65 con
  **tutti e tre** i vincoli (casella libera, che nulla attraversa, **non di bordo**: `crossedCells` più
  `isBorderCell`) e due vincoli **misurati**, tutti e due applicati **mentre pesca i candidati** (non scartando
  tabelloni finiti): il **budget di leggibilità** di D-72 (`RULES.board.maxCrossings`, `maxLinesPerCell`) e
  l'**inclinazione minima** di 18° sull'orizzontale (J1, `RULES.board.minAngleDegrees`, `elementAngle` in
  `board-geometry.ts` — il numero viene dalla `classic`, la scala 51→67). Con un tetto impossibile il generatore
  lancia dicendo a quanto si è fermato e con che tetto, invece di restituire un tabellone che il validatore
  rifiuterebbe. Gli id delle illustrazioni arrivano da fuori (`illustrationsByCategory()` del registro); se non
  bastano, lancia dicendo quanti ne mancano. Le decorazioni sono quattro forme, ma la regola viene prima del numero:
  su 200 semi sono quattro in 146 casi, tre in 33, due in 12, una in 7, nessuna in 2. La leggibilità misurata non
  supera mai il tetto (incroci 6, linee per casella 2) e l'inclinazione non scende mai sotto la soglia (minimo
  18,4°, contro 6,3° prima di J1); **nessun seme resta corto**: 7 scale e 6 serpenti sempre, su 200 semi.
  Si guarda in **`/dev/disposizioni`** (pagina di sviluppo, 404 in produzione): quattro semi fissi più quello che si
  scrive nel campo, disegnati dal componente vero della partita, con i numeri di incroci, linee e inclinazione per
  tabellone e il conto della `classic` per confronto. 43 prove fra `board-generator.test.ts`,
  `board-readability.test.ts` e `board-geometry.test.ts`. La metà meccanica di F7-03 (congelare un seme) è fatta.
- [~] **F7-03** Altre disposizioni predefinite.
  Nota: la **metà meccanica** è fatta (pacchetto I). `pnpm board:freeze <seme> <nome>` scrive
  `src/content/boards/<nome>.ts` con la disposizione **intera come dato** — caselle, scale, serpenti, decorazioni —
  e riscrive `src/content/boards/frozen.ts`, l'elenco; una disposizione congelata **non si rigenera più**, nemmeno
  se il generatore cambia (D-73), e lo script rifiuta di sovrascrivere un file che esiste (e dal pacchetto K rifiuta
  anche un nome che comincia con `-`, che è quasi sempre un flag scritto male). Le congelate le validano gli stessi
  test della `classic` (`boards.test.ts` gira su `boards` e su `frozenBoards`) e si guardano in `/dev/disposizioni`,
  sezione «Disposizioni congelate».
  **Dal pacchetto K (D-77) entrano in lobby**: `boards` è `[classic, ...frozenBoards]`, quindi congelare una
  disposizione è quello che la fa offrire — in fila dopo la `classica`, che resta quella preselezionata — e la riga
  «Disposizione» compare solo quando c'è più di una scelta. La lobby offre **solo le disposizioni pubblicate**
  (`pnpm content:seed` + `db:reset` in locale, `pnpm content:push` sul remoto): una congelata che non è nel
  database non si può giocare, e `pnpm check:ready` dice quante ne mancano. Il tabellone usato resta scritto
  **sulla riga della partita** (`games.settings.boardId`) e si legge per id da `public.boards`, quindi una serata
  vecchia continua a ridisegnare il suo anche se la disposizione esce dall'elenco offerto (D-77, D-78).
  Manca la **decisione** — quali disposizioni entrano e come si chiamano: i semi e i nomi sono del proprietario e
  nel repository non ne è congelata nessuna. 17 prove in `scripts/lib/board-freeze.test.ts`.
- [ ] **F7-04** Bilanciamento dopo le prime partite (solo `RULES` e contenuti).
