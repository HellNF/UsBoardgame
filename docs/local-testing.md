# Verifica in locale

Il lavoro prodotto dagli agenti senza Docker (stato `[L]` nella [roadmap](roadmap.md)) si verifica qui, sul computer
del proprietario, con Supabase locale in Docker.

## Preparazione (una volta)

1. Avvia Docker Desktop.
2. `pnpm install`
3. `pnpm db:start` — alla prima esecuzione scarica le immagini (alcuni minuti). Stampa URL, publishable key e
   secret key.
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
- Stanza di prova: `pnpm room:create` (quando il task F0-03 esiste).

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

**Esito:**

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

**Esito:**

### F0-05 · F2-02 · F3-02 · F5-06 · Schermate su dati finti — branch hermes/c-ui

1. `pnpm dev`, poi apri <http://localhost:3000/dev/ui>.
2. Controlla a occhio: accesso (codice, password, stato dell'altro giocatore), lobby (disposizione, categorie di
   sfida, durata massima, posta in palio, prontezza dei due posti, pedina e colore), scheda (blocchi per categoria,
   contatore delle risposte, avviso se incompleta), diario (momenti della serata + archivio).
3. Le stesse viste devono restare usabili su telefono (accesso, lobby e scheda): prova a restringere la finestra.
4. In produzione anche `/dev/ui` deve rispondere 404 (come sopra).

**Esito:**

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
