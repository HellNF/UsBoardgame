# Verifica in locale

Il lavoro prodotto dagli agenti senza Docker (stato `[L]` nella [roadmap](roadmap.md)) si verifica qui, sul computer
del proprietario, con Supabase locale in Docker.

## Preparazione (una volta)

1. Avvia Docker Desktop.
2. `pnpm install`
3. `pnpm db:start` — alla prima esecuzione scarica le immagini (una decina di minuti). Stampa URL, publishable key
   e secret key. I servizi dei log sono spenti in `supabase/config.toml` (`[analytics] enabled = false`): con essi
   accesi l'avvio falliva perché il container `vector` non diventa "healthy".
4. `cp .env.example .env.local` e incolla i valori.

## Verifica di un branch

```bash
git fetch origin
git switch hermes/<pacchetto>
pnpm install
pnpm check && pnpm build          # deve essere verde anche qui
pnpm content:seed                 # se il branch tocca src/content
pnpm db:reset                     # riapplica tutte le migrazioni + seed da zero
pnpm db:types && git diff --stat  # i tipi generati devono combaciare con quelli scritti a mano
pnpm dev
```

- Studio di Supabase (tabelle, log, SQL): http://127.0.0.1:54323
- Due giocatori: una finestra normale e una in incognito (sessioni anonime separate).
- Stanza di prova: `pnpm room:create --code COPPIA42 --name1 Leo --name2 Marta` (la password si scrive a
  terminale). **Senza** `--` prima delle opzioni: con pnpm 11 il separatore arriva allo script e lo fa fallire.

Se tutto torna: segna i task `[x]` nella roadmap, fai il merge del branch in `main` e pusha.
Se qualcosa non va: annota il problema sotto la voce del Registro (`**Esito:** …`) così l'agente può correggerlo.

## Controlli ricorrenti

| Area              | Controllo                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Migrazioni        | `pnpm db:reset` senza errori, da database vuoto                                                                                            |
| RLS               | `supabase/tests/rls.sql` nel SQL editor di Studio: nessuna riga visibile dove non deve                                                     |
| Segretezza schede | DevTools → Network durante una domanda: nessuna risposta della scheda dell'altro nelle risposte HTTP né nei messaggi WebSocket di Realtime |
| Scritture         | Dal browser, con la publishable key, un `insert`/`update` diretto su qualsiasi tabella deve fallire                                        |
| Sincronia         | Un'azione in una finestra appare nell'altra in meno di un secondo                                                                          |
| Riconnessione     | Ricaricare la pagina a metà carta riporta alla stessa carta, per entrambi                                                                  |
| Conflitti         | Due click quasi simultanei: uno viene accettato, l'altro riceve `409` e la UI si riallinea                                                 |
| Presenza          | Chiudere una finestra aggiorna l'indicatore "connesso" nell'altra                                                                          |

## Registro

Gli agenti aggiungono qui una voce per ogni task `[L]`: cosa verificare, passo per passo, e l'esito atteso.
Il proprietario compila **Esito**.

<!--
### F0-04 · Accesso alla stanza — branch hermes/d-server
1. `pnpm room:create …` con password `prova-locale`.
2. Finestra A: accedi al posto 1 → si arriva alla lobby.
3. Finestra B (incognito): password sbagliata → errore e ritardo crescente; password giusta, posto 2 → lobby.
4. Atteso: in Studio, `player_sessions` ha due righe con utenti anonimi diversi.
**Esito:** _
-->

### F1-01 · Disposizione `classic` dopo la correzione (D-42) — branch `hermes/a-engine`

1. `pnpm dev` e apri la partita in hot seat (`/dev/hotseat`, dal pacchetto C). Su `hermes/a-engine` la pagina non
   esiste ancora: in quel caso confronta `src/content/boards/classic.ts` con `docs/reference/board/boardReference.png`.
2. Guarda le due geometrie corrette: la scala **28→72** e il serpente **87→37**, e verifica che nessuna scala o
   serpente copra più di 5 file (7 scale e 6 serpenti, sparsi su tutto il tabellone).
3. `npx vitest run src/content/boards/boards.test.ts` e `npx vitest run src/engine/board-validation.test.ts` → verdi.

**Esito:** verificato il 2026-09-17 (Opus, senza Docker). Le due geometrie corrette si vedono in
`/dev/hotseat`: la scala 28→72 e il serpente 87→37, 7 scale e 6 serpenti, nessuno oltre 5 file. I due test sono
verdi dentro `pnpm check`. L'impianto è **approvato**: `classic.ts` non si tocca più (le correzioni di leggibilità
sono passate per il disegno, A1/A5).

### F1-05 · Partita in hot seat — branch hermes/c-ui

1. `pnpm dev`, poi apri <http://localhost:3000/dev/hotseat>.
2. Guarda il tabellone: 100 caselle con i numeri, domande con l'iniziale della categoria in corsivo, sfide nere
   piene, imprevisti a metà diagonale, monete (cerchio pieno = +3, cerchio vuoto = −2), 3 stelle, 4 decorazioni
   multi-cella; 7 scale a montanti e pioli, 6 serpenti sinuosi con la testa a occhi; pedine e anello del turno.
3. Gioca: «Tira i dadi» → la pedina salta; sulle caselle escono le carte:
   - domanda a scelta multipla → scegli un'opzione (il verdetto è automatico, scheda di prova: D-44);
   - domanda breve → scrivi la risposta, poi l'altro preme «Giusta» / «Quasi» / «Sbagliata»;
   - domanda aperta → «Ne abbiamo parlato» (+1 moneta);
   - sfida con minigioco (tris, forza 4, memory) → gioca i turni, il motore decide;
   - sfida a doppia conferma → dichiarano entrambi; se non coincidono, rivincita o moneta;
   - prova (verdetto del giudice) → «Riuscita» / «Non riuscita»;
   - imprevisto → «Continua»; stella → compra o rifiuta; zaino pieno → scegli cosa scartare.
4. Prova gli oggetti dal pannello (compra, usa Dado singolo e Dado truccato) e il timer di una sfida.
5. Per arrivare in fretta alla fine: «Strumenti di prova (solo sviluppo)» → «Avvicina alla 100», poi tira due
   volte; nella schermata finale premi «Rivela la prossima stella» una volta per tipo (Sapientone, Campione).
6. In produzione la pagina non deve esistere: `pnpm build && pnpm start`, poi
   `curl -o /dev/null -w "%{http_code}" http://localhost:3000/dev/hotseat` → **404**.

**Esito:** verificato il 2026-09-17 (Opus, senza Docker) in Chrome a 1440 × 900 e 1024 × 768:
partita giocata dall'inizio alla schermata finale, tutte le carte e i tre minigiochi, oggetti e timer, e le 209
prove di `pnpm check` verdi. In produzione `/dev/hotseat` risponde **404** (`pnpm build && pnpm start`).
Cinque rilievi (A1–A5: numeri coperti da scale e serpenti, due pedine con la stessa lettera, il "·" del turno, la
carta sotto la piega a 1024 × 768, la stella della 15) sono stati corretti nel branch `hermes/e-ui-fix`, voce qui
sotto.

### F0-05 · F2-02 · F3-02 · F5-06 · Schermate su dati finti — branch hermes/c-ui

1. `pnpm dev`, poi apri <http://localhost:3000/dev/ui>.
2. Controlla a occhio: accesso (codice, password, stato dell'altro giocatore), lobby (disposizione, categorie di
   sfida, durata massima, posta in palio, prontezza dei due posti, pedina e colore), scheda (blocchi per categoria,
   contatore delle risposte, avviso se incompleta), diario (momenti della serata + archivio).
3. Le stesse viste devono restare usabili su telefono (accesso, lobby e scheda): prova a restringere la finestra.
4. In produzione anche `/dev/ui` deve rispondere 404 (come sopra).

**Esito:** verificato il 2026-09-17 (Opus, senza Docker): le quattro viste di `/dev/ui` si leggono e
restano usabili a finestra stretta; in produzione la pagina risponde **404**. Restano viste su dati finti: il
collegamento a Supabase arriva col pacchetto D.

### F3-04 · Mazzo di ~150 domande — branch hermes/b-content

1. `pnpm content:seed`: atteso `seed.sql: 150 domande, 17 sfide, …`.
2. `pnpm db:reset`, poi in Studio:
   `select category, kind, count(*) from public.questions group by 1, 2 order by 1, 2;`
   → 30 domande per categoria, di cui 8 `multiple`/`short` (da scheda) e 22 `open`.
3. `select level, count(*) from public.questions where category = 'deep' group by 1 order by 1;`
   → 10 domande per ognuno dei tre livelli.
4. Rilettura dei testi (è il motivo per cui il task è `[L]`): italiano colloquiale con gli accenti giusti, `text` in
   prima persona, `sheetText` in seconda, aperte senza domande sì/no, livello 3 intimo ma mai imbarazzante o
   doloroso (niente salute, ex, denaro).
5. `pnpm dev` → scheda (quando esiste la pagina, task F3-02): le domande escono nei blocchi giusti, senza ripetizioni.

**Esito:**

### F4-01 · Mazzo di sfide — branch hermes/b-content

1. `pnpm content:seed` e `pnpm db:reset`, poi in Studio:
   `select id, data->>'category' as categoria, data->>'mode' as modalita, data->>'verdict' as verdetto, data->>'snakeFlash' as lampo from public.challenges order by 1;`
   → 5 `builtin`, 10 `videocall`, 2 `external` con `url`; nessuna `emulator`.
2. `select count(*) from public.challenges where (data->>'snakeFlash')::boolean;` → almeno 6, tutte con durata
   massima ≤ 30 s.
3. Rilettura delle istruzioni delle carte: devono essere comprensibili senza spiegazioni.
4. Nota: `quiz-lampo` e `riflessi` sono duelli a doppia conferma (D-41), non minigiochi automatici: quando arriva
   F4-04 si cambiano verdetto e `minigame` in `src/content/challenges.ts`.

**Esito:**

### Nota di merge · `supabase/seed.sql`

`supabase/seed.sql` è generato: i branch `hermes/a-engine` (aggiunge la disposizione `classic`) e `hermes/b-content`
(aggiunge domande e sfide) lo toccano entrambi. Dopo il merge dei due branch rilanciare `pnpm content:seed` e
committare il file prima di `pnpm db:reset`.

Anche `docs/hermes-log.md` e `docs/decisions.md` sono toccati da entrambi i branch: al merge tenere le sezioni e le
decisioni di tutti e due (i numeri D-31…D-40 arrivano dal pacchetto A, D-41 dal pacchetto B).

### F1-05 · Correzioni all'interfaccia della partita — branch `hermes/e-ui-fix`

1. `pnpm dev`, poi <http://localhost:3000/dev/hotseat>. Riduci la finestra a **1024 × 768** (F12 → icona del
   dispositivo, oppure ridimensiona la finestra): la misura minima della partita (D-16).
2. Atteso, senza scorrere la pagina con la rotella: il tabellone resta quadrato e si rimpicciolisce per stare in
   altezza; scorre **solo** la colonna di destra (dadi, carta attiva, pannello), con la barra visibile al bordo.
   Con una carta aperta (sfida o domanda) la carta si vede senza scendere sotto la piega.
3. Guarda i numeri delle caselle su cui passano scale e serpenti — 12, 16, 17, 18, 39, 51, 52, 53, 54, 55, 56, 93,
   96, 98 — e la **stella della casella 15**, sotto la scala 8→26, e la stella della 53: numeri e simboli devono
   leggersi, con un alone chiaro attorno. La scala 8→26 **non** è stata spostata: se la stella della 15 non si
   legge, va spostata in `src/content/boards/classic.ts`.
4. Le due pedine: cerchio rosso con "1" e cerchio blu con "2" (prima mostravano entrambe "G").
5. Guarda il pannello: chi ha il turno ha la riga con il bordo spesso, il pallino pieno e l'etichetta nera "Tocca a
   te"; l'altro ha il bordo sottile.
6. Prova anche a 1440 × 900 e a 1920 × 1080: la partita deve restare in una schermata sola.

**Esito:** verificato il 2026-09-17 (Opus, senza Docker) in Chrome a 1024 × 768 su
`origin/hermes/e-ui-fix` (ba05c19): `pnpm check` verde (16 file, 209 prove), `pnpm build` verde, la pagina non
scorre (l'altezza del documento è quella della finestra) e scorre solo la colonna di destra. Numeri e simboli si
leggono su tutte le caselle attraversate (12, 16, 17, 18, 51–56, 87, 89, 93, 96, 98) e la stella della 15 si vede
intera sotto la scala 8→26: **A1 e A5 approvati**, la scala non va spostata. Pedine con "1" e "2", turno con bordo
spesso, pallino pieno ed etichetta "Tocca a te". Branch unito in `main`.

### F1-05 · Pagina `/dev/scenari` (le carte rare) — branch `hermes/e-ui-fix`

1. `pnpm dev`, poi <http://localhost:3000/dev/scenari>.
2. Atteso: 25 riquadri in due colonne, con l'indice in alto; ogni riquadro ha titolo, una riga che dice cosa si
   deve vedere e la carta.
3. Prova qualche clic per confermare che la carta è viva e non un disegno (la riga di controllo in fondo al
   riquadro dice dove sono finiti i posti):
   - "Domanda a scelta multipla · verdetto giusto" → premi la prima opzione ("Cinema"): +3 monete;
   - "Domanda breve · giudizio «Quasi»" → "Quasi": +1 moneta;
   - "Domanda su base di scala" → prima opzione: da casella 8 a casella 26, +3 monete;
   - "Imprevisto · Vento a favore" → "Continua": 60 → 65; "Sentiero sbagliato" → 40 → 35; "Serpente improvviso" →
     60 → 34; "Scala fortunata" → 60 → 92; "Regalo" → le monete passano da 5 a 8 e da 8 a 5;
   - "Offerta della stella · con monete sufficienti" → "Compra la stella": da 12 a 2 monete e 1 stella; con 4
     monete il pulsante "Compra" è spento;
   - "Zaino pieno" → scegli cosa scartare (o scarta quello nuovo);
   - "Doppia conferma · in disaccordo" → scegli rivincita o moneta per entrambi i posti;
   - "Sfida lampo del serpente" → "Non riuscita": la pedina scende da 62 a 18;
   - "Schermata finale · vince il posto 1" → "Rivela la prossima stella" tre volte: Sapientone, Campione, vincitore.
4. "Ricomincia lo scenario" riporta il riquadro allo stato di partenza.
5. In produzione la pagina non deve esistere: `pnpm build && pnpm start`, poi
   `curl -o /dev/null -w "%{http_code}" http://localhost:3000/dev/scenari` → **404** (come `/dev/hotseat`).

**Esito:** verificato il 2026-09-17 (Opus, senza Docker): 25 riquadri, indice senza collegamenti
rotti, nessun messaggio in console. Carte provate a mano: zaino pieno (scarta il Dado truccato, la carta si chiude
e il turno passa), offerta della stella con monete (12 → 2 monete e 1 stella) e senza monete (pulsante spento con
"Ti servono altre 6 monete"), schermata finale del posto 1 (Sapientone, Campione, «Vince Leo» e la posta in palio).
In produzione **404**. La pagina **resta** anche dopo il pacchetto D: è l'unico modo di rivedere le carte rare.
Due difetti di concordanza corretti qui in locale (vedi sotto), il resto va bene.

### Nota · concordanza dei numeri nei testi (2026-09-17, in locale)

La schermata finale scriveva "1 stelle · 12 monete · 1 risposte giuste"; la riga di controllo degli scenari diceva
"· oggetti" senza il numero. Corretto in `main` con `src/lib/plural.ts` (`plural(n, "stella", "stelle")` → "1 stella"),
usato ora anche dal pannello laterale, dal diario, dalla carta della stella e dalla carta sfida. Nessun cambiamento
di regole: solo testo.

## Registro · Pacchetto D (server e database) — branch `hermes/d-server`

Qui il database non c'è (niente Docker né Supabase): **tutto il pacchetto D è `[L]`**, tranne ciò che è coperto da
test puri. Le voci seguono l'ordine di lettura: prima la base, poi le azioni, poi i contenuti.

### F0-01 · Migrazione applicata e tipi rigenerati

1. `pnpm db:start`; poi `cp .env.example .env.local` e incolla URL, publishable key e secret key.
2. `pnpm db:reset`: deve applicare `20260917000000_init.sql` **senza errori** e caricare il seed.
3. `pnpm content:seed && pnpm db:reset` se il seed è cambiato.
4. `pnpm db:types`: deve finire senza errori e scrivere `src/lib/supabase/database.types.ts`. Il file non è nel
   repo: se lo committi, `pnpm check` deve restare verde (per ora il codice non lo importa: vedi "Limiti noti" nel
   resoconto).
5. In Studio: `select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;` → le tabelle
   del gioco con `rowsecurity = true`.
6. In Studio, controllo dei privilegi del client (devono risultare solo letture, e nessuna su `rooms`):
   `select table_name, privilege_type, grantee from information_schema.role_table_grants
 where table_schema = 'public' and grantee = 'authenticated' order by 1, 2;`
   → solo `SELECT`, nessuna riga per `rooms`.
7. In Studio, controllo della funzione delle transazioni:
   `select proname, prosecdef, pg_get_function_identity_arguments(oid) from pg_proc
 where pronamespace = 'public'::regnamespace order by 1;`
   → `apply_game_action` con `prosecdef = true` e gli argomenti `uuid, integer, jsonb, jsonb, jsonb, jsonb`.
8. Incolla `supabase/tests/rls.sql` nel SQL editor ed eseguilo: attesi i NOTICE `ok: …` di ogni controllo e nessun
   ERROR. Lo script chiude con ROLLBACK, quindi non lascia righe.

**Esito:** verificato il 2026-09-17 (Opus, con Docker). La migrazione si applica su database vuoto e il seed entra
(150 domande, 17 sfide, 1 tabellone). Controllato in `psql`: RLS attiva su tutte e dieci le tabelle, una policy per
ognuna e **nessuna** su `rooms`; `anon` non ha alcun privilegio, `authenticated` solo `select` e mai su `rooms`;
`apply_game_action` è `security definer` ed eseguibile solo da `service_role`; `replica identity full` e
pubblicazione realtime su `games`, `game_events`, `players`. `pnpm db:types` genera 517 righe (con
`apply_game_action`) e il file è ora committato.
**Intoppo da sapere:** `pnpm db:start` è fallito al primo avvio perché il container dei log (`supabase_vector`) non
diventa "healthy" e la CLI ferma tutto (`LegacyHealthCheckTimeoutError`). Il giro funzionante è
`pnpm exec supabase start -x vector,logflare`; in alternativa `[analytics] enabled = false` in
`supabase/config.toml`. Da decidere quale delle due mettere nel comando di `package.json`.

### F0-03 · `pnpm room:create`

1. `pnpm room:create` (senza argomenti) → stampa l'uso e non tocca il database.
2. `pnpm room:create -- --code COPPIA42 --name1 Nicolò --name2 Marta`: chiede la password **due volte**, e mentre
   la scrivi non si vede (l'eco è spento). Atteso: `Stanza COPPIA42 creata (id …)` e i due posti con il loro id.
3. In Studio: `select code, left(password_hash, 20) from public.rooms;` → l'hash comincia con `scrypt$16384$8$1$`;
   la password in chiaro non compare da nessuna parte.
4. Rilancia lo stesso comando: atteso `La stanza COPPIA42 esiste già: …` (non nasce una seconda stanza).
5. In Studio: `select seat, display_name, pawn, color from public.players order by seat;` → due righe, posto 1 e
   posto 2, con pedina e colore scelti.
6. `pnpm room:create -- --code COPPIA42 --name1 A --name2 B --pawn1 fox --pawn2 fox` → rifiuta pedine o colori
   uguali **prima** di chiedere la password.

**Esito:** verificato il 2026-09-17 (Opus, con Docker): crea la stanza e i due posti, la password è chiesta a
terminale e salvata come hash scrypt; `--help` e gli argomenti sbagliati stampano l'uso.
**Due difetti:** (1) l'invocazione scritta nell'aiuto — `pnpm room:create -- --code …` — **non funziona** con pnpm
11.25: il `--` arriva allo script e risponde "Argomento inatteso". Va scritta senza `--`
(`pnpm room:create --code COPPIA42 --name1 Leo --name2 Marta`): correggere il messaggio di aiuto e i documenti.
(2) la password digitata resta visibile a terminale mentre si scrive.

### F0-04 · Accesso alla stanza, posto legato al browser, uscita

1. `pnpm dev`, finestra A (normale): <http://localhost:3000>, codice `COPPIA42`, password, **posto 1** → si arriva
   a `/r/COPPIA42/lobby`.
2. Finestra B (incognito): password **sbagliata** → stesso messaggio `Codice o password non corretti.` e la
   risposta arriva sempre più tardi (≈ 0,4 s, 0,8 s, 1,6 s, 3,2 s… fino a 8 s). Con un codice inesistente il
   messaggio è identico: dal messaggio non si capisce quale dei due è sbagliato.
3. Finestra B: password giusta, **posto 2** → lobby, con i due posti e i loro nomi.
4. In Studio: `select count(*) from public.player_sessions;` → 2 righe con due `auth_user_id` diversi (uno per
   browser). `select seat, last_seen_at from public.players order by seat;` → entrambi valorizzati.
5. Apri `/r/COPPIA42/lobby` in una terza finestra senza sessione → si torna all'accesso con il codice già scritto
   nel campo (lo fa `src/proxy.ts`).
6. Uscita: dalla console della finestra A `await fetch('/api/rooms/leave', { method: 'POST' })` → `{ ok: true }`;
   in Studio quella riga di `player_sessions` sparisce e ricaricando la lobby si torna all'accesso (la sessione
   anonima resta, il posto no).
7. `supabase/tests/rls.sql` nel SQL editor: tutte le voci `ok:` (in particolare `rooms` non leggibile e
   `sheet_answers` solo la propria).

**Esito:** verificato il 2026-09-17 (Opus, con Docker) con due sessioni anonime distinte: i due posti
entrano e restano separati (`player_sessions` con due utenti diversi). Password sbagliata → 401 con ritardo
crescente misurato: 0,6 s → 1,0 s → 1,8 s → 3,4 s. Codice inesistente → stesso messaggio e tempo simile.
`POST /api/rooms/leave` cancella la riga della sessione e da quel momento il client non vede più nulla.

### F0-05 · F2-02 · Lobby con i dati veri

1. Due finestre (normale + incognito) sulla lobby della stessa stanza.
2. Cambia la posta in palio in A: in B compare entro un secondo (Realtime su `games`), senza ricaricare.
3. Cambia disposizione, categorie di sfida e durata massima: le stesse impostazioni si vedono in B; in Studio
   `select settings from public.games where status = 'lobby';` mostra quello che hai scelto.
4. Premete "Sono pronto" **uno alla volta**: con un solo pronto la serata resta in lobby.
5. Con **entrambi** pronti: se una scheda è incompleta lo stato diventa `sheets` e compare "Gioca lo stesso";
   premendolo (o completando le schede) si passa a `playing` e le due finestre vanno in `/r/COPPIA42/game`.
6. "Nuova serata" in lobby: la partita aperta diventa `abandoned` e ne nasce una nuova in `lobby`. In Studio:
   `select id, status, created_at from public.games order by created_at;` → la vecchia resta con stato `abandoned`.
7. Indicatore "l'altro è collegato": compare quando l'altra finestra è aperta e sparisce chiudendola (F2-04).

**Esito:** verificato il 2026-09-17 (Opus, con Docker) in Chrome: stanza, posto, presenza, fase
("Prima le schede"), avviso di scheda incompleta con «Gioca lo stesso» e «Vai alla scheda», impostazioni della
serata (disposizione, categorie di sfida, durata massima) e i due posti con pedina, colore e stato di pronto.
Il passaggio pronto + pronto → `sheets` → «Gioca lo stesso» → `playing` funziona.
**Da sistemare:** il passaggio non è atomico. `ready` si legge, si modifica e si riscrive senza controllo di
versione, e `startGame` chiude con `.single()`: con due clic su «pronto» quasi simultanei si può restare in lobby
con entrambi pronti, oppure il secondo prende un 500.

### F2-01 · Azione di gioco, versione e conflitto (`409`)

1. Partita avviata, due finestre. In A "Tira i dadi" → la pedina si muove e la carta (se c'è) si apre **anche in
   B** entro un secondo.
2. Prova un'azione fuori turno (in B, quando tocca ad A): la carta/pulsante non c'è, e anche forzando dalla
   console la risposta è `422` con `Il motore ha rifiutato l'azione: Non è il turno di questo giocatore.`
3. **Conflitto di versione, modo semplice (consigliato):** in Studio
   `select id, version from public.games where status = 'playing';` (segna il numero), poi
   `update public.games set version = version + 1 where id = '<id>';`
   Ora in A premi un pulsante qualsiasi: atteso il messaggio "Qualcuno ha giocato prima di te: stato ricaricato." e
   la schermata che si riallinea **da sola** sullo stato del server (nessuna mossa persa, nessun doppio tiro).
   In Studio `select version from public.games where id = '<id>';` → è cresciuta di 1 per ogni azione accettata.
4. **Conflitto vero, con due clic quasi simultanei:** apri la partita nelle due finestre, poi premi lo stesso
   pulsante (in A e in B) con un distacco di mezzo secondo su un'azione che entrambi possono fare (es. il tiro di
   chi ha il turno, o "Pronto" in lobby): una richiesta passa e l'altra riceve `409`; nella finestra che ha perso
   compare il messaggio di riallineamento. In DevTools → Network la seconda chiamata ha stato `409`.
5. Dalla console, con la publishable key del browser (senza secret key): un `insert` diretto su qualsiasi tabella
   deve fallire. Esempio:
   `supabase.from('players').insert({ room_id: '<uuid>', seat: 1, display_name: 'intruso' })` →
   errore `new row violates row-level security policy` o `permission denied`.
6. Le due righe di `game_events` dell'azione sono in Studio: `select id, version, seat, type from public.game_events
order by id desc limit 10;` → una riga per evento, con `seat` giusto (null per gli eventi di partita).

**Esito:** verificato il 2026-09-17 (Opus, con Docker) chiamando le route vere. Identità: un posto che
manda un'azione dell'altro → **403**; nel turno dell'altro → **422** con lo stato fresco; tiro regolare → **200**
con eventi e carta pescata dal catalogo vero.
**Difetto trovato e corretto:** due azioni simultanee con la stessa versione davano **200 e 500 (corpo vuoto)**
invece di 200 e 409. `apply_game_action` in conflitto ritorna NULL, ma PostgREST consegna la riga composita **con
tutti i campi a `null`**: il controllo `if (!row)` non scattava mai e `parseGameState(null)` sollevava un'eccezione.
Corretto in `src/server/game/apply-action.ts` (il conflitto si riconosce da `row.version === null`) e nella route,
che ora cattura le eccezioni e risponde con un messaggio. Riprovato: **200 e 409 con lo stato fresco**.

### F2-03 · Riconnessione alla fase salvata

1. Con la partita in corso, ricarica la pagina (F5) a metà carta in entrambe le finestre: si torna **alla stessa
   carta** e allo stesso turno, senza passi da rifare.
2. Apri a mano l'indirizzo sbagliato per la fase: con la serata in lobby `/r/COPPIA42/game` → rimanda alla lobby;
   con la partita in corso `/r/COPPIA42/lobby` → rimanda alla partita; con la scheda da completare
   `/r/COPPIA42/game` → rimanda alla scheda.
3. Chiudi e riapri la finestra in incognito sulla partita: si rientra nel posto giusto (il posto è legato alla
   sessione anonima) e lo stato è quello del server.
4. Spegni il wi-fi per qualche secondo e riaccendilo: la schermata resta usabile e al primo aggiornamento Realtime
   torna allineata (lo stato non vive mai solo nel browser).

**Esito:** verificato il 2026-09-17 (Opus, con Docker) in Chrome: con una carta aperta, ricaricando la
pagina torna la stessa carta (lo stato sta nel database, non nel browser).
**Difetto grave trovato e corretto:** i `postgres_changes` non arrivavano mai a una pagina appena caricata. La
sessione viene ripresa dal cookie e nessun evento di autenticazione la passa al canale, quindi il tempo reale si
collegava come `anon`: RLS non consegnava nessuna riga e la schermata dell'altro restava ferma (la presenza invece
funzionava, quindi il guasto era silenzioso). Riprodotto anche fuori dal browser. Corretto in
`src/features/presence/use-room-realtime.ts` con `await supabase.realtime.setAuth()` **prima** di `subscribe`.
Riprovato in Chrome: la carta pescata dall'altro posto compare senza ricaricare.
Aggiunta anche una guardia in `online-table.tsx`: una riga più vecchia di quella mostrata non riporta indietro il
tabellone.

### F2-04 · Presence e `last_seen_at`

1. Due finestre nella stessa stanza: in entrambe si legge "L'altro è collegato".
2. Chiudi una finestra: entro pochi secondi l'altra passa a "L'altro non è collegato".
3. In Studio: `select seat, last_seen_at from public.players order by seat;` → ricaricando una pagina della stanza,
   quel `last_seen_at` si aggiorna (è il battito "lento": la presenza viva è il canale Realtime).
4. Con la partita in corso l'indicatore c'è anche nel gioco (in alto, accanto al turno).

**Esito:** verificato il 2026-09-17 (Opus, con Docker): collegando il secondo posto l'indicatore passa da
«L'altro non è collegato» a «L'altro è collegato» senza ricaricare, e torna indietro quando l'altro chiude.
**Da sapere:** la presenza **non** è protetta da RLS. Un client di un'altra stanza che conosca l'id della stanza può
iscriversi al canale `room:<id>`, vedere la presenza e annunciarsi. I dati di gioco invece non passano: provato con
una sessione di un'altra stanza, che non ha ricevuto nessuna riga di `games` né di `game_events` mentre l'altro
posto le riceveva tutte. Per chiudere anche la presenza servono i canali privati con RLS su `realtime.messages`.

### F3-01 · Pesca delle domande: registro e niente ripetizioni

1. Gioca e finisci su una casella domanda: la carta mostra una domanda del catalogo vero.
2. In Studio: `select question_id, seat, count(*) from public.used_questions group by 1, 2 order by 1;` → cresce una
   riga per ogni domanda uscita; le "quanto mi conosci" hanno `seat` 1 o 2, le aperte hanno `seat` null.
3. Ripeti la stessa casella/lo stesso giocatore: la domanda è **diversa** finché il sottoinsieme non è esaurito.
4. **Scheda incompleta (D-28):** lascia senza risposta una domanda della scheda dell'altro posto; quella domanda
   non deve mai uscire in partita finché non la compila.
5. **Azzeramento del registro (D-29):** in Studio conta le domande pescabili di una categoria per un posto
   (`select count(*) from public.questions where active and category = 'tastes' and kind <> 'open';`), poi gioca
   finché non le hai viste tutte: quando il sottoinsieme è esaurito, le righe di quel posto in `used_questions`
   si azzerano e le domande tornano pescabili (il conteggio riparte da poche righe).
6. Le domande ritirate non escono: `update public.questions set active = false where id = '<una domanda>';` → non
   compare più in partita (e in Studio non è più visibile dal client). Rimettila `active = true` alla fine.

**Esito:** verificato il 2026-09-17 (Opus, con Docker): le domande escono dal catalogo vero e il registro
`used_questions` si scrive nella stessa transazione dell'azione, per posto per le "quanto mi conosci" e con `seat`
nullo per le aperte. Nessuna riga doppia (controllo per stanza, posto e domanda). Escono solo le domande a cui
l'altro ha risposto nella scheda (D-28): con cinque risposte messe a mano, la domanda a scelta multipla pescata era
una di quelle.
**Non provato dal vivo:** l'esaurimento del mazzo e l'azzeramento del registro (troppe partite per farlo a mano);
restano coperti dai test di `src/server/game/question-draw.test.ts`.

### F3-02 · Scheda: salvataggio automatico e segretezza

1. `/r/COPPIA42/sheet` nella finestra A: rispondi a qualche domanda. Atteso: "Salvataggio…" poi l'avviso sparisce,
   il contatore delle risposte cresce e nessun errore rosso.
2. In Studio: `select count(*) from public.sheet_answers where player_id = (select id from public.players where
seat = 1);` → cresce con le risposte date (una riga per domanda, mai due).
3. Ricarica la pagina: le risposte ci sono ancora. Rispondi di nuovo alla stessa domanda con un'altra opzione:
   resta **una** riga, aggiornata.
4. **Segretezza:** nella finestra B (posto 2) apri la console e leggi `select` sulla tabella:
   `supabase.from('sheet_answers').select('*')` → tornano **solo** le risposte del posto 2. In DevTools → Network,
   durante una domanda in partita, nessuna risposta della scheda dell'altro compare nelle chiamate HTTP né nei
   messaggi WebSocket (Realtime).
5. Le domande aperte non stanno nella scheda (non compaiono in pagina) e le risposte a scelta multipla accettate
   sono solo quelle fra le opzioni: se dal browser mandi un testo inventato, la route risponde `400`.

**Esito:** verificato il 2026-09-17 (Opus, con Docker) in Chrome: la pagina mostra "5 di 40 risposte",
l'avviso di scheda incompleta, i blocchi per categoria e l'etichetta «privata, la vede solo chi la compila».
Premendo un'opzione la risposta finisce subito nel database (`tastes-002` → «Montagna»).
**Segretezza confermata dal vivo:** la risposta della scheda dell'altro non compare in nessuna risposta HTTP delle
azioni né in nessun evento salvato (cercata la stringa esatta in entrambi: zero risultati). Al motore arriva solo il
verdetto: in `checkMultipleChoice` il confronto avviene dentro una chiusura lato server.

### F3-05 · `pnpm content:push`

1. Con le variabili del progetto **remoto** in `.env.local`: `pnpm content:push` → atteso
   `Pubblicati: 150 domande, 17 sfide, 1 tabelloni in https://<progetto>.supabase.co`.
2. Rilanciato una seconda volta: stesso messaggio e in Studio `select count(*) from public.questions;` → **150**
   (nessun doppione: gli id sono stabili).
3. Il push non tocca le partite: `select count(*) from public.games;` e `select count(*) from public.sheet_answers;`
   restano quelli di prima.

**Esito:** **non verificato:** serve un progetto Supabase remoto, che non esiste ancora (task F0-06). In locale lo script si
ferma con il messaggio sulle variabili mancanti, che è il comportamento giusto. Resta `[L]`.

### F5-06 · Diario e archivio

1. Gioca qualche turno, poi apri `/r/COPPIA42/diary`: i momenti della serata hanno il round, il nome di chi ha
   giocato, un titolo e un dettaglio (domande, sfide, imprevisti, monete, oggetti, scale, serpenti, stelle).
2. Nessuna risposta della scheda compare nel diario: si vede solo la risposta **data** in partita
   (`QUESTION_ANSWERED`), mai quella della scheda dell'altro.
3. Finisci una partita (o arriva al limite di round): in cima al diario compare la riga dell'archivio, con data,
   vincitore e stelle/monete dei due posti.
4. La partita conclusa non blocca la serata successiva: "Nuova serata" dalla lobby crea una partita nuova e
   l'archivio continua a elencare le vecchie.

**Esito:** verificato il 2026-09-17 (Opus, con Docker) in Chrome: «Momenti della serata» racconta gli eventi
in ordine e «Partite passate» mostra data, vincitore, stelle e monete dei due posti.
**Due cose da sistemare:** il diario scrive «Domanda deep-004», cioè l'**id** invece del testo della domanda (per un
ricordo da rileggere non va); e compare una voce «+0 monete», che non è un momento della serata. Le concordanze
(«+1 moneta» invece di «+1 monete») le ho corrette io.

### Prima di chiudere un pacchetto · `/dev/scenari` e `/dev/hotseat` restano vivi

1. `pnpm dev`: <http://localhost:3000/dev/scenari> → 25 riquadri, carte vive, nessun errore in console;
   <http://localhost:3000/dev/hotseat> → la partita in hot seat si apre e si gioca.
2. `pnpm build && pnpm start`: entrambe le pagine rispondono **404** e `/` risponde **200**.
3. Questo controllo va rifatto **prima di chiudere ogni pacchetto**: le pagine di sviluppo devono continuare a
   funzionare anche dopo il collegamento a Supabase (F0-05, F2-01, F3-01 non le toccano, ma i componenti sì).

**Esito:** verificato il 2026-09-17 (Opus, con Docker): entrambe le pagine funzionano ancora con il
pacchetto D dentro, e `pnpm check` (26 file, 269 prove) e `pnpm build` restano verdi.

### Nota · come si prova in due senza due browser (2026-09-17)

Per la verifica del pacchetto D il secondo giocatore è stato fatto **via HTTP**: una sessione anonima creata con la
libreria vera (`@supabase/ssr`, così il cookie ha il formato che il server si aspetta) e poi le stesse route
dell'applicazione. Così i due posti sono davvero due utenti diversi, e in più si possono mandare due azioni
simultanee per provare il `409`. Per il tempo reale è stato usato un secondo client `@supabase/supabase-js` con il
token del posto. Gli script stanno fuori dal repository (cartella di lavoro della sessione), non sono codice del
progetto: se servono di nuovo si riscrivono in mezz'ora, o si aprono semplicemente due finestre del browser, una in
incognito.
