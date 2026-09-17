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

- [ ] **F0-01** Avviare Supabase locale (`pnpm db:start`), applicare la migrazione, correggere eventuali errori SQL,
      `pnpm db:types`. Creare `.env.local`.
- [ ] **F0-02** `hashPassword` / `verifyPassword` con `scrypt` + test.
- [ ] **F0-03** `pnpm room:create`: crea stanza e due posti (password chiesta a terminale, mai negli argomenti).
- [ ] **F0-04** `src/proxy.ts` per il refresh della sessione; `POST /api/rooms/join`; accesso anonimo; ritardo sui
      tentativi falliti. Test RLS: un posto non legge la scheda dell'altro né `rooms`.
- [~] **F0-05** Pagina di accesso (codice, password, scelta del posto) e lobby minima con indicatore "connesso".
  Nota: UI pronta e visibile in `/dev/ui` su dati finti (`src/features/access`), con lo stato dell'altro
  giocatore; il collegamento a Supabase e la scelta del posto sono del pacchetto D.
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

## Fase 2 · Tempo reale — _partita a distanza sincronizzata_

- [ ] **F2-01** `applyAction` + `POST /api/games/[gameId]/actions` (identità, versione, transazione, eventi).
- [~] **F2-02** Lobby completa: impostazioni, pronto, creazione della partita (`status` lobby → playing).
  Nota: la parte visiva (disposizione, categorie, durata massima, posta, pronto dei due posti) è in
  `src/features/lobby` e si vede in `/dev/ui`; `status` e la creazione della partita sono del pacchetto D.
- [ ] **F2-03** Abbonamento Realtime a `games`/`game_events`, gestione dei `409`, riconnessione alla fase salvata.
- [ ] **F2-04** Presence: indicatore dell'altro giocatore e `last_seen_at`.
- [~] **F2-05** Animazioni guidate dagli eventi (pedina che salta, scala, serpente) con Motion.
  Nota: fatti il salto della pedina verso la casella nuova (con la curva del serpente quando lo spostamento è
  una discesa), l'anello del turno e l'ingresso delle carte; manca il salto **cella per cella** e l'uso degli
  eventi `MINIGAME_MOVED` per animare le pedine dei minigiochi.

## Fase 3 · Domande — _prima serata giocabile_

- [ ] **F3-01** `drawQuestion` lato server (categoria, 60/40, livelli profonde, solo domande con risposta, registro
      per posto/coppia, azzeramento) + test.
- [~] **F3-02** Pagina scheda: blocchi per categoria, salvataggio automatico, avanzamento; stato `sheets` in lobby.
  Nota: la scheda è in `src/features/sheet` (blocchi per categoria, contatore, avviso scheda incompleta) e si
  vede in `/dev/ui`; le risposte private e lo stato `sheets` arrivano con il pacchetto D.
- [~] **F3-03** Carta domanda: `multiple` (verdetto automatico), `short` (giudizio dell'altro), `open`;
  regola della scala con una sola domanda.
  Nota: motore completo e testato (pacchetto A); manca la carta della UI (pacchetto C).
- [L] **F3-04** Mazzo iniziale: ~150 domande secondo [content.md](content.md) → revisione del proprietario.
  Nota: 150 domande (30 per categoria: 8 da scheda e 22 aperte; profonde dieci per livello) in
  `src/content/questions/`, con i controlli di forma in `src/content/content.test.ts`. I testi sono una prima
  bozza da rileggere: voce nel Registro di [local-testing.md](local-testing.md).
- [ ] **F3-05** `pnpm content:push` per pubblicare i contenuti in produzione.

## Fase 4 · Sfide — _tutte le categorie tranne l'emulatore_

- [L] **F4-01** Mazzo di sfide (integrati, videochiamata, esterni; ≥ 6 lampo) e filtri della serata.
  Nota: 17 carte in `src/content/challenges.ts` (5 integrate, 10 in videochiamata di cui 6 lampo, 2 esterne).
  `quiz-lampo` e `riflessi` sono duelli a doppia conferma finché F4-04 non aggiunge i loro moduli al motore
  (D-41). La revisione dei testi è del proprietario.
- [~] **F4-02** Carta sfida: duello/prova, giudice, doppia conferma, disputa, timer (`TIMER_EXPIRED`).
  Nota: motore completo e testato (pacchetto A, con D-33 e D-36); mancano la carta della UI e la route.
- [~] **F4-03** Minigiochi nel motore + UI: tris, forza 4, memory.
  Nota: i tre moduli puri sono in `src/engine/minigames` con test (pacchetto A) e la UI è in
  `src/features/minigames`, provabile in `/dev/hotseat` (la hot seat pesca anche due sfide di prova per forza 4
  e memory, D-44); mancano i turni remoti e le mosse via API, che arrivano con il pacchetto D.
- [ ] **F4-04** Minigiochi a tempo: quiz, riflessi.
- [ ] **F4-05** Pausa per sfida esterna (link Lichess, skribbl.io) e ritorno con "Chi ha vinto?".
- [~] **F4-06** Sfida lampo del serpente.
  Nota: motore (30 s, Antidoto, vittoria = resta, altrimenti scende) e test fatti nel pacchetto A; UI in C.

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
  Nota: motore delle stelle bonus e del vincitore fatto e testato (pacchetto A); la schermata arriva con il
  pacchetto C.
- [~] **F5-06** Diario della serata e archivio delle partite.
  Nota: la vista è in `src/features/diary` (momenti della serata + archivio) e si vede in `/dev/ui` su dati
  finti; la lettura del diario dal database è del pacchetto D.

## Fase 6 · Illustrazioni — _estetica finale_ (in parallelo)

- [ ] **F6-01** Reference in `docs/reference/` e revisione di [design.md](design.md) accanto alle immagini.
- [ ] **F6-02** ~35 illustrazioni delle domande + 3 stelle + decorazioni (SVG).
- [ ] **F6-03** Scale e serpenti definitivi (montanti e pioli, corpo a macchie, testa con occhio).
- [ ] **F6-04** Rive: wrapper e segnaposto per pedine (6), dadi, carta; file `.riv` creati a mano nell'editor Rive.
- [ ] **F6-05** Rive: wrapper e segnaposto per mascotte (6) e finale; file `.riv` creati a mano nell'editor Rive.
- [ ] **F6-06** Suoni opzionali.

## Fase 7 · Extra — _versione rifinita_

- [ ] **F7-01** Emulatore DS nel browser per sfide a punteggio (file caricato solo in locale); elenco giochi da decidere.
- [ ] **F7-02** Generatore casuale di disposizioni da seme.
- [ ] **F7-03** Altre disposizioni predefinite.
- [ ] **F7-04** Bilanciamento dopo le prime partite (solo `RULES` e contenuti).
