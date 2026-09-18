# Modello dati

Fonte di verità: `supabase/migrations/*.sql`. Questo file spiega il perché. I tipi TypeScript del database si
generano con `pnpm db:types` (`src/lib/supabase/database.types.ts`); lo stato di gioco in `games.state` è
tipizzato da `GameState` in `src/engine/types.ts`.

| Tabella (specs) | Tabella           | Contenuto                                                                                                     | Letture client (RLS)                  | Scritture            |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------- |
| stanze          | `rooms`           | codice, `password_hash` (scrypt)                                                                              | nessuna                               | script `room:create` |
| giocatori       | `players`         | posto 1/2, nome, pedina, colore, `last_seen_at`                                                               | membri della stanza                   | server               |
| —               | `player_sessions` | sessione anonima Supabase → posto                                                                             | solo la propria                       | server (join)        |
| domande         | `questions`       | catalogo: categoria, livello, tipo, testo, testo per la scheda, opzioni                                       | tutti gli autenticati (solo `active`) | seed                 |
| sfide           | `challenges`      | carta sfida intera in `data` (jsonb, schema in `src/content/schema.ts`)                                       | tutti gli autenticati (solo `active`) | seed                 |
| tabelloni       | `boards`          | disposizione intera in `layout` (`BoardLayout`)                                                               | tutti gli autenticati                 | seed                 |
| schede          | `sheet_answers`   | risposta di un giocatore a una domanda                                                                        | **solo il proprietario**              | server               |
| domande_usate   | `used_questions`  | domanda uscita, a quale posto (null per le aperte)                                                            | membri della stanza                   | server               |
| partite         | `games`           | stato della serata (`finished` compreso), impostazioni, `state` (GameState), `version`, pronti, `finished_at` | membri della stanza                   | server               |
| eventi          | `game_events`     | registro di ogni azione accettata, per diario e animazioni                                                    | membri della stanza                   | server               |

## Note

- **Id dei contenuti stabili:** `questions.id` (es. `deep-004`) è referenziato da schede e domande usate.
  Non rinumerare mai; per ritirare una domanda si imposta `active = false` (colonna già nel database; il campo va aggiunto allo
  schema Zod e al seed quando serve).
- **Risposte `multiple`:** `sheet_answers.answer` contiene il testo esatto dell'opzione scelta. Cambiare il testo di
  un'opzione invalida le risposte date: in quel caso si crea una nuova domanda.
- **Una partita aperta per stanza:** indice univoco parziale su `games(room_id)` per gli stati `lobby`, `sheets`, `playing`.
- **Diario:** si costruisce da `game_events` (tipi evento definiti in `src/engine`) più `questions` per i testi.
  Le risposte date alle `short` sono nel payload dell'evento; le risposte della scheda no.
- **Realtime:** `games`, `game_events` e `players` sono nella publication `supabase_realtime`; RLS filtra gli eventi.
  Le tre tabelle hanno `replica identity full`: senza, Realtime valuta la policy solo sulla riga nuova e un
  aggiornamento potrebbe arrivare a chi non è della stanza.
- **Permessi oltre le policy:** i ruoli `anon` e `authenticated` ricevono solo `select` sulle tabelle leggibili, e
  **nessun** privilegio su `rooms`. Le policy da sole non bastano come documentazione di "i client non scrivono":
  il privilegio non c'è proprio. Tutte le scritture passano dal client con secret key (`src/server/**`).
- **`apply_game_action(game_id, expected_version, new_state, events)`:** funzione `security definer` (revocata ai
  ruoli client, eseguibile solo da `service_role`) che in **una sola transazione** aggiorna `games` con
  `where version = <attesa>`, incrementa `version` e inserisce la riga di `game_events` di ogni evento. Se la
  versione non combacia ritorna `null`: la route risponde `409` e il client si riallinea (D-23).
- **La serata conclusa entra nell'archivio (D-61):** se lo stato applicato ha `phase = "finished"`, la stessa
  transazione scrive `status = 'finished'` e `finished_at = now()` sulla riga di `games`. È così che
  `findFinishedGames` trova la partita e «Partite passate» nel diario si riempie; e solo una partita **non
  conclusa** diventa `abandoned` con «Nuova partita» (`statusOnNewGame` in `src/server/game/game-status.ts`,
  puro e provato). La regola sta in un posto solo: la migrazione `20260918130000_finish_game.sql` la esegue nel
  database, la funzione pura la scrive per esteso in TypeScript come `readyOutcome` per la lobby (D-53).
- **`set_lobby_ready(game_id, seat, ready, sheets_incomplete, new_state)`:** il pronto di un posto, in una sola
  istruzione: scrive `ready` sulla riga letta in quel momento (quindi il pronto dei due posti non si perde) e, se con
  questo pronto sono pronti tutti e due, porta la serata a `sheets` o `playing` con lo stato iniziale
  (`version = 1`) nella stessa transazione (D-53). Su una serata già partita ritorna `null`.
- **`start_lobby_game(game_id, new_state)`:** porta la serata a `playing` da `lobby` o `sheets`. Idempotente: se è
  già partita ritorna la riga com'è, quindi la seconda chiamata di «Gioca lo stesso» non è un errore.
- **`supabase/tests/lobby.sql`:** i controlli della lobby atomica (i due pronti, la scheda incompleta, le due
  chiamate di avvio). Si esegue nel SQL editor come `supabase/tests/rls.sql` e chiude con `ROLLBACK`.
- **`supabase/tests/finish_game.sql`:** i controlli dell'archivio (F1, D-61): l'azione normale, il conflitto di
  versione, la conclusione con la data, la serata nuova dopo la conclusione, «Nuova partita» che non abbandona
  una serata conclusa, la riparazione delle righe rimaste `playing`. Anche questo chiude con `ROLLBACK`.
- **Domande usate:** quando il sottoinsieme pescabile è esaurito il registro si azzera (D-29). L'azzeramento è
  una cancellazione delle righe di quel sottoinsieme (stanza + posto per le "quanto mi conosci", stanza + righe con
  `seat` nullo per le aperte): il diario non legge `used_questions`, quindi non si perde storia.
