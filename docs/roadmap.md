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
- [ ] **F0-05** Pagina di accesso (codice, password, scelta del posto) e lobby minima con indicatore "connesso".
- [ ] **F0-06** Progetto Supabase remoto + progetto Vercel + variabili; deploy di prova.

## Fase 1 · Tabellone — _partita completa su un solo schermo_

- [ ] **F1-01** Disposizione `classic` (100 celle, 7 scale, 6 serpenti, geometrie ispirate alla reference) +
      validatore dei vincoli di [rules.md § Tabellone](rules.md#tabellone) con test.
- [ ] **F1-02** `createInitialState`.
- [ ] **F1-03** `reduce` per: tiro, rimonta, movimento, caselle libere/monete, scale e serpenti con **segnaposto**
      per domanda e sfida (risolte con un pulsante "riuscita/fallita"), fine turno, round, fine partita, stelle bonus.
      Test per ogni regola.
- [ ] **F1-04** `EngineContext` finto per i test (RNG deterministico).
- [ ] **F1-05** Tabellone SVG con segnaposto geometrici, pedine, scale e serpenti generati, dadi, pannello laterale.
      Modalità "hot seat" (entrambi i posti sullo stesso schermo) per provare le regole senza Supabase.

## Fase 2 · Tempo reale — _partita a distanza sincronizzata_

- [ ] **F2-01** `applyAction` + `POST /api/games/[gameId]/actions` (identità, versione, transazione, eventi).
- [ ] **F2-02** Lobby completa: impostazioni, pronto, creazione della partita (`status` lobby → playing).
- [ ] **F2-03** Abbonamento Realtime a `games`/`game_events`, gestione dei `409`, riconnessione alla fase salvata.
- [ ] **F2-04** Presence: indicatore dell'altro giocatore e `last_seen_at`.
- [ ] **F2-05** Animazioni guidate dagli eventi (pedina che salta, scala, serpente) con Motion.

## Fase 3 · Domande — _prima serata giocabile_

- [ ] **F3-01** `drawQuestion` lato server (categoria, 60/40, livelli profonde, solo domande con risposta, registro
      per posto/coppia, azzeramento) + test.
- [ ] **F3-02** Pagina scheda: blocchi per categoria, salvataggio automatico, avanzamento; stato `sheets` in lobby.
- [ ] **F3-03** Carta domanda: `multiple` (verdetto automatico), `short` (giudizio dell'altro), `open`;
      regola della scala con una sola domanda.
- [ ] **F3-04** Mazzo iniziale: ~150 domande secondo [content.md](content.md) → revisione del proprietario.
- [ ] **F3-05** `pnpm content:push` per pubblicare i contenuti in produzione.

## Fase 4 · Sfide — _tutte le categorie tranne l'emulatore_

- [ ] **F4-01** Mazzo di sfide (integrati, videochiamata, esterni; ≥ 6 lampo) e filtri della serata.
- [ ] **F4-02** Carta sfida: duello/prova, giudice, doppia conferma, disputa, timer (`TIMER_EXPIRED`).
- [ ] **F4-03** Minigiochi nel motore + UI: tris, forza 4, memory.
- [ ] **F4-04** Minigiochi a tempo: quiz, riflessi.
- [ ] **F4-05** Pausa per sfida esterna (link Lichess, skribbl.io) e ritorno con "Chi ha vinto?".
- [ ] **F4-06** Sfida lampo del serpente.

## Fase 5 · Economia — _regole complete_

- [ ] **F5-01** Monete da domande e sfide, raddoppio 71-100, mai sotto zero.
- [ ] **F5-02** Casella stella e offerta.
- [ ] **F5-03** Oggetti: acquisto, uso, limite di 3, scarto.
- [ ] **F5-04** Imprevisti.
- [ ] **F5-05** Schermata finale: stelle bonus una alla volta, vincitore, posta in palio.
- [ ] **F5-06** Diario della serata e archivio delle partite.

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
