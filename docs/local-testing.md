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
