# Istruzioni per Hermes

Sei l'agente che **costruisce** il gioco. Il proprietario del progetto poi **verifica in locale** con Docker e
Supabase. Il tuo obiettivo: portare avanti il più possibile la [roadmap](docs/roadmap.md) in modo che la verifica
locale trovi codice completo, testato dove possibile e con istruzioni chiare su cosa controllare.

## Chi fa cosa (dal pacchetto I)

Il lavoro è diviso per **tipo**, non solo per ambiente:

| Tu                                                                         | Il proprietario (con Opus)                                           |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| motore, server, route, migrazioni, RLS, tempo reale, wrapper, test, script | illustrazioni SVG, decorazioni, tutto ciò che si giudica guardandolo |
| **misurare** una cosa visiva (contare incroci, ingombri, caselle legali)   | **decidere i numeri** dopo aver guardato il risultato                |

Quindi: **non disegnare e non ridisegnare illustrazioni**, e non scegliere «quale sta meglio». Cinque pacchetti
di fila hanno mostrato che il giudizio a 48 px non passa dalla tua parte del tavolo: lo specchio-racchetta, le
decorazioni fuse con serpente e scala, le radici che sono state prima un omino e poi un tavolo. Il codice che
**misura** quelle stesse cose invece è venuto giusto al primo colpo (`src/engine/board-geometry.ts`), ed è quello
che serve: tu costruisci lo strumento e la manopola, i numeri li gira chi guarda.

Se un punto del prompt ti chiede un giudizio visivo, è un errore del prompt: fermati e scrivilo nel rapporto.

## 0. Leggi prima di scrivere codice

In quest'ordine, per intero:

1. [AGENTS.md](AGENTS.md) — comandi, struttura, regole non negoziabili, convenzioni.
2. [docs/README.md](docs/README.md) — mappa della documentazione.
3. [docs/decisions.md](docs/decisions.md) — prevale su `docs/specs.md`.
4. [docs/rules.md](docs/rules.md) — il regolamento che implementerai.
5. [docs/architecture.md](docs/architecture.md), [docs/data-model.md](docs/data-model.md).
6. Il resto di `docs/` quando arrivi al pacchetto che lo richiede.

Next.js è la versione 16: prima di usare un'API di Next leggi la guida in `node_modules/next/dist/docs/`
(esempio: `middleware` ora si chiama `proxy`).

## 1. Il tuo ambiente e i suoi limiti

Tu **non hai Docker né Supabase**. Quindi:

| Puoi verificare da solo                            | Non puoi verificare (lo fa il proprietario)     |
| -------------------------------------------------- | ----------------------------------------------- |
| `pnpm check` (typecheck + lint + Vitest)           | migrazioni SQL applicate davvero                |
| `pnpm build` (deve passare **senza** `.env.local`) | policy RLS, accesso anonimo, cookie di sessione |
| `pnpm content:seed` (validazione dei contenuti)    | Realtime, Presence, riconnessione               |
| `pnpm dev` + pagine che non toccano Supabase       | route API che leggono o scrivono il database    |

Regole che ne derivano:

- **Tutto ciò che è logica va in funzioni pure testabili**, separate dal codice che parla con Supabase.
  Esempio: la pesca delle domande è una funzione pura `selectQuestion(candidates, used, answered, rng)` testata con
  Vitest, più un adattatore sottile in `src/server` che carica i dati e la chiama.
- Il codice che tocca il database lo scrivi comunque, completo, ma il task va in stato **`[L]`** (non `[x]`)
  e aggiungi le istruzioni di verifica in [docs/local-testing.md](docs/local-testing.md) § Registro.
- **Non inventare output di comandi che non hai eseguito.** Se non hai potuto verificare qualcosa, scrivilo.
- La migrazione `supabase/migrations/20260917000000_init.sql` non è mai stata applicata: finché il task F0-01 non è
  `[x]` puoi correggerla direttamente. Dopo, solo nuove migrazioni (`pnpm supabase migration new <nome>`, oppure
  crea a mano un file `supabase/migrations/<AAAAMMGGhhmmss>_<nome>.sql`).
- Dopo una modifica allo schema aggiorna a mano i tipi che ti servono: `pnpm db:types` richiede Docker e lo
  lancerà il proprietario.

## 2. Flusso di lavoro con git

- Parti sempre da `main` aggiornato. **Un branch per pacchetto** (vedi § 3): `hermes/a-engine`, `hermes/b-content`, …
- Commit piccoli, uno per task o sotto-task, messaggio in inglese all'imperativo con l'id del task nel corpo.
  `pnpm check` verde prima di ogni commit; `pnpm build` verde prima di ogni push.
- Pusha il branch. **Non fare merge in `main`**: lo fa il proprietario dopo la verifica locale.
- Un pacchetto può partire da un altro branch non ancora mergiato se ne dipende: scrivilo nel primo commit.

## 3. Pacchetti di lavoro, in ordine

Stato dei task sempre aggiornato in `docs/roadmap.md`.

### Pacchetto A · Motore completo (`hermes/a-engine`) — verificabile al 100% da te

L'intero regolamento di `docs/rules.md` dentro `src/engine`, con test. Include la parte "motore" di task che nella
roadmap stanno in fasi diverse.

1. **F1-04** `EngineContext` finto (`src/engine/testing.ts`): RNG deterministico a sequenza, disposizione di test,
   domande e sfide finte.
2. **F1-01** Disposizione `classic` + validatore dei vincoli (`src/engine/board-validation.ts`) + test che la
   `classic` sia valida. Geometrie: ispirati alle immagini in `docs/reference/board/` se presenti; altrimenti
   proponi una disposizione ragionevole e segnala in `docs/decisions.md` "Ancora aperte" che va rivista.
3. **F1-02** `createInitialState`.
4. **F1-03** `reduce`: tiro, rimonta, movimento, caselle, scale, serpenti, turni, round, fine partita, stelle bonus.
5. Parte motore di **F3-03** (carta domanda: `multiple`, `short`, `open`, scala con una domanda, Salta domanda),
   **F4-02** (duello/prova, giudice, doppia conferma, disputa, `TIMER_EXPIRED`), **F4-06** (sfida lampo),
   **F5-01…F5-05** (monete, stella, oggetti, imprevisti, fine e bonus).
6. Parte motore di **F4-03**: `src/engine/minigames/` con tris, forza 4, memory come moduli puri
   (`init`, `applyMove`, `result`).

Requisiti:

- Un file di test per area (`turn.test.ts`, `questions.test.ts`, `items.test.ts`, …). **Ogni riga delle tabelle di
  `rules.md` deve avere almeno un test.** Nomi dei test in italiano che citano la regola.
- Il reducer rifiuta con `{ ok: false, error }` ogni azione non valida (turno sbagliato, fase sbagliata, monete
  insufficienti, oggetto non posseduto, …) e ogni rifiuto ha un test.
- Gli `events` restituiti descrivono tutto ciò che la UI deve animare o il diario deve raccontare. Definisci i tipi
  evento come unione discriminata in `types.ts` (sostituendo il `type: string` generico) e documentali in
  `docs/architecture.md`.
- Nessun numero magico: tutto in `RULES`.
- Se `rules.md` è ambiguo: scegli la soluzione più semplice, aggiungi una voce **Derivata** in `decisions.md`,
  aggiorna `rules.md`, continua. Non fermarti.

Fine pacchetto: tutti i task del motore `[x]` (sono verificati dai test).

### Pacchetto B · Contenuti (`hermes/b-content`) — verificabile da te

1. **F3-04** 150 domande secondo [docs/content.md](docs/content.md): 30 per categoria, ~8 per categoria nella
   scheda, profonde su tre livelli. Rileggi le regole di stile prima di scrivere. Italiano corretto con gli accenti.
2. **F4-01** Mazzo di sfide: almeno 5 integrate (tris, forza 4, memory, quiz, riflessi), 10 in videochiamata
   (almeno 6 utilizzabili come lampo), 2 esterne (Lichess, skribbl.io). Niente emulatore.
3. `pnpm content:seed` verde, `supabase/seed.sql` committato.

Stato: `[L]`, perché il proprietario deve rivedere i testi. Aggiungi nel Registro "rivedere domande e sfide".

### Pacchetto C · Interfaccia offline (`hermes/c-ui`) — verificabile da te con `pnpm dev`

Dipende da A. Costruisci tutta la UI contro il motore **senza Supabase**.

1. **F1-05** Pagina `src/app/dev/hotseat/page.tsx`: partita completa per due giocatori sullo stesso schermo.
   **Eccezione documentata alla regola 1 di AGENTS.md:** qui il reducer gira nel browser con l'`EngineContext`
   finto. La pagina deve rispondere `notFound()` in produzione (`process.env.NODE_ENV === "production"`).
   Aggiungi questa eccezione in `docs/decisions.md` come decisione Derivata.
2. Componenti in `src/features/`: tabellone SVG (celle, geometrie, scale e serpenti generati in modo deterministico,
   pedine), dadi, pannello laterale (turno, punteggi, oggetti), tutte le carte (domanda, sfida, imprevisto, stella,
   scarto oggetto), timer, schermata finale con le stelle bonus rivelate una alla volta.
   Animazioni con Motion guidate dagli `events` (**F2-05**, parte UI).
3. UI dei minigiochi (**F4-03**, **F4-04**): tris, forza 4, memory, quiz, riflessi, provabili nella hot seat.
4. Schermate che poi useranno Supabase, costruite su props e dati finti: accesso (**F0-05**), lobby (**F2-02**),
   scheda (**F3-02**), diario (**F5-06**). Tieni i componenti di presentazione separati dal caricamento dati.
5. Estetica secondo [docs/design.md](docs/design.md): bianco e nero, token Tailwind, Playfair Display corsivo per i
   titoli. Layout per ≥ 1024px; accesso, lobby e scheda usabili anche su telefono.

Ogni componente usa i segnaposto geometrici finché non esistono illustrazioni e file Rive.

### Pacchetto D · Server e database (`hermes/d-server`) — da verificare in locale

Dipende da A (e da C per collegare le schermate).

1. **F0-01 (solo parte scrivibile)** Rileggi la migrazione iniziale e correggi ciò che puoi individuare leggendo
   (sintassi, riferimenti, policy). Aggiungi le funzioni SQL necessarie alle transazioni (es.
   `apply_game_action(game_id, expected_version, new_state, events)` con `security definer` e `revoke` dai ruoli
   client).
2. **F0-02** `hashPassword` / `verifyPassword` con `node:crypto` scrypt + test Vitest (verificabile, → `[x]`).
3. **F0-03** `pnpm room:create`.
4. **F0-04** `src/proxy.ts`, `POST /api/rooms/join`, accesso anonimo lato client, ritardo sui tentativi falliti,
   uscita.
5. **F2-01** `applyAction` e route delle azioni, con validazione Zod delle azioni (schema in `src/server/game`).
6. **F2-02** API della lobby (impostazioni, pronto, avvio, stato `sheets`).
7. **F2-03**, **F2-04** Abbonamenti Realtime, gestione `409`, riconnessione, Presence.
8. **F3-01** Pesca delle domande (funzione pura testata + adattatore), **F3-02** salvataggio della scheda,
   **F3-05** `pnpm content:push`, **F5-06** lettura del diario.
9. Collega le schermate del pacchetto C ai dati reali (`/r/[code]/…`).
10. Scrivi `supabase/tests/rls.sql`: query che, impersonando un utente autenticato, dimostrano che un posto non legge
    `rooms` né la scheda dell'altro (lo eseguirà il proprietario).

Tutto `[L]`, tranne ciò che è coperto interamente da test puri. **Per ogni task aggiungi i passi di verifica nel
Registro di `docs/local-testing.md`.**

### Pacchetto E · Illustrazioni (`hermes/e-art`) — verificabile da te a occhio in `pnpm dev`

In parallelo, quando vuoi.

1. **F6-02** Illustrazioni SVG secondo `docs/design.md` (una per file, registro `index.ts`), più una pagina
   `src/app/dev/art/page.tsx` (solo sviluppo) che le mostra tutte a 48 px e a 200 px.
2. **F6-03** Scale e serpenti definitivi.
3. **F6-04**, **F6-05** Solo i wrapper React in `src/art/rive/` con i segnaposto, rispettando il contratto di
   `docs/design.md`. **Non creare né modificare file `.riv`**: li disegna a mano il proprietario nell'editor Rive.

## 4. Cosa NON fare

- Non toccare: F0-06 (account Vercel e Supabase), F7-01 (emulatore), file `.riv`, `docs/specs.md` (tranne l'elenco
  delle decisioni aperte).
- Non aggiungere servizi esterni, analytics o dipendenze pesanti senza motivarlo in `decisions.md`.
- Non committare `.env.local`, chiavi o password (nemmeno di prova in chiaro nei test SQL: usa valori finti evidenti).
- Non disattivare regole ESLint, test o controlli TypeScript per far passare `pnpm check`.
- Non cambiare le decisioni **Intervista** in `decisions.md`: se ti sembrano sbagliate, scrivilo nel rapporto.

## 5. Quando hai dubbi

Non bloccarti aspettando risposte. Scegli l'opzione più semplice e reversibile, registrala come decisione **Derivata**
e continua. Raccogli le domande per il proprietario nel rapporto finale.

## 6. Rapporto a fine pacchetto

Alla fine di ogni pacchetto aggiungi una sezione in `docs/hermes-log.md` (crealo se non esiste):

```md
## Pacchetto X · <nome> — <data>

Branch: hermes/… · Ultimo commit: <hash>

- Fatto: task e stato (`[x]` / `[L]`)
- Verificato da me: comandi eseguiti e risultato reale
- Da verificare in locale: rimando alle voci del Registro
- Decisioni Derivate aggiunte: D-xx, …
- Domande per il proprietario: …
- Limiti noti / debito tecnico: …
```
