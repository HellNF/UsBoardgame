# Rapporto di Hermes

Sezioni richieste da [HERMES.md](../HERMES.md) § 6: una per pacchetto, aggiunte in fondo.

> Nota di merge: le sezioni del **pacchetto A** sono in `docs/hermes-log.md` del branch `hermes/a-engine`, che ha
> creato questo file per primo. Al merge dei due branch tenere entrambe le sezioni.

## Pacchetto A · Motore completo — 2026-09-17

Branch: hermes/a-engine · Ultimo commit del pacchetto: c9e9155 (questo rapporto è in quel commit;
l'aggiornamento di questa riga è l'unica modifica successiva).

- **Fatto:** F1-01 `[x]`, F1-02 `[x]`, F1-03 `[x]`, F1-04 `[x]`, F5-01 `[x]`, F5-02 `[x]`, F5-03 `[x]`, F5-04 `[x]`;
  parte motore di F3-03, F4-02, F4-03, F4-06 e F5-05 `[~]` (mancano carte, schermate e route: pacchetti C e D).
  Il pacchetto consegna l'intero regolamento di `docs/rules.md` dentro `src/engine`, con un test per ogni riga
  delle tabelle delle regole e un test per ogni azione rifiutata.
- **Verificato da me:** comandi eseguiti davvero, con l'esito reale:
  - `pnpm install` — pnpm 11.25.0, Node 24.21.0: completato senza errori.
  - `pnpm check` (typecheck + eslint + vitest) — verde: 14 file di test, **194 test passati**.
  - `pnpm build` — verde (Next.js 16.3.5, tutte le rotte esistenti compilate).
  - `pnpm content:seed` — verde: `seed.sql: 7 domande, 3 sfide, 1 tabelloni`; `supabase/seed.sql` rigenerato con la
    disposizione `classic` ed è in questo branch.
- **Da verificare in locale:** nessun task `[L]`: il pacchetto A non tocca il database e non ci sono passi da
  aggiungere al Registro di [local-testing.md](local-testing.md). Da guardare a occhio (non da eseguire):
  1. la disposizione `classic` in `src/content/boards/classic.ts` accanto a `docs/reference/board/boardReference.png`
     (posizioni di scale, serpenti e geometrie: voce "Ancora aperte" di `decisions.md`);
  2. le regole scelte come Derivate, D-31…D-40, elencate di seguito.
- **Decisioni Derivate aggiunte:** D-31 (stato per "ancora sulla casella d'arrivo"), D-32 (`drawChallenge`
  fornisce la carta completa), D-33 (timer e rivincita delle sfide), D-34 (il raddoppio vale solo per i guadagni
  del gioco), D-35 (offerta della stella solo con le monete in mano), D-36 (prova senza "riuscita" = nessun premio),
  D-37 (Salta domanda consuma l'oggetto senza occupare il turno), D-38 (stelle dell'arrivo al primo che arriva),
  D-39 (dettagli dei minigiochi), D-40 (chi ha già finito salta i turni del round).
- **Domande per il proprietario:** le cinque del rapporto finale (disposizione `classic`, raddoppio del "quasi",
  trasferimenti non raddoppiati, stelle dell'arrivo, memory).
- **Limiti noti / debito tecnico:**
  - la **pesca** delle domande e delle sfide è delegata a `EngineContext.drawQuestion` / `drawChallenge`: il
    motore decide categoria, livello e 60/40, ma registro delle domande usate e azzeramento sono dell'adattatore
    lato server (task F3-01, pacchetto D). I test usano contenuti finti.
  - i minigiochi sono pronti nel motore ma senza UI: si vedono solo nei test (F4-03, pacchetto C).
  - `F1-05` (hot seat) e tutte le carte restano ai pacchetti C e D.
  - `TODO(F7-02)` (generatore di disposizioni da seme) resta aperto, come previsto.

## Correzioni post-verifica al motore — 2026-09-17

Branch: hermes/a-engine (riparte dall'ultimo commit del pacchetto A) · Ultimo commit delle correzioni: f4bc6df
(questo rapporto è nel commit successivo).

- **Fatto:** vincolo 7 di una disposizione valida (scale e serpenti entro 5 file, D-42) con test; disposizione
  `classic` corretta (scala 28→84 → 28→72, serpente 87→24 → 87→37, 7 scale e 6 serpenti mantenuti e sparsi);
  `src/engine/simulation.test.ts` con 200 partite casuali sul tabellone `classic`; a fine partita `round` è
  l'ultimo round giocato (non più 26 su 25), documentato in rules.md § Fine partita.
  Task F1-01 e F1-03 restano `[x]`; nessun task nuovo aperto.
- **Verificato da me:**
  - `pnpm check` — verde: 15 file di test, 198 test passati (erano 194).
  - `pnpm build` — verde.
  - `npx vitest run src/engine/simulation.test.ts --reporter=verbose` — verde in 4,0 s, con questo riepilogo reale:
    `200 partite · round medi 17.2 (min 7, max 25) · fine per arrivo 183, per limite di round 17 · passi medi 105`.
    Nessuno stallo in nessuna delle 200 partite (l'assert è per partita).
- **Da verificare in locale:** rigiocare/riguardare la disposizione `classic` con le due geometrie nuove; la voce è
  nel Registro di [local-testing.md](local-testing.md) (F1-01, "disposizione classic dopo la correzione").
- **Decisioni Derivate aggiunte:** D-42 (limite di 5 file per scale e serpenti). D-31…D-40 sono ora marcate
  «Derivata, confermata dal proprietario il 2026-09-17»; D-41 (branch `hermes/b-content`) risulta confermata allo
  stesso modo, con una nota nel file, ma quel branch non è stato toccato.
- **Domande per il proprietario:** la scala 28→72 e il serpente 87→37 vanno bene anche a occhio, come disegno, o
  preferisci altre caselle? Nella simulazione 17 partite su 200 finiscono per limite di round (round medi 17,2):
  va bene, o vuoi un limite diverso da 25?
- **Limiti noti / debito tecnico:** la simulazione usa i contenuti finti di `src/engine/testing.ts` (il motore non
  dipende da `src/content` tranne che per la disposizione `classic`); le partite sono giocate da una strategia
  casuale, quindi non coprono le scelte furbe di un giocatore umano; il generatore casuale di disposizioni (F7-02)
  e il suo `TODO` restano aperti.

## Pacchetto C · Interfaccia offline — 2026-09-17

Branch: hermes/c-ui, partito da `hermes/a-engine` (dipende dal motore: il primo commit lo dice) · Ultimo commit:
vedi `git log -1 hermes/c-ui`

- **Fatto:** F1-05 `[x]` (pagina `/dev/hotseat`, partita completa per due giocatori su un solo schermo, tabellone
  SVG, dadi, pannello laterale, tutte le carte, timer, schermata finale con le stelle bonus). `[~]` per la parte
  visiva: F0-05, F2-02, F3-02, F5-06 (accesso, lobby, scheda, diario su dati finti in `/dev/ui`), F2-05
  (animazioni: pedina che salta e segue il serpente, anello del turno, ingresso delle carte), F4-03 (UI di tris,
  forza 4, memory). Quiz e riflessi (F4-04) fuori da questa sessione, come richiesto.
- **Verificato da me:** comandi eseguiti davvero:
  - `pnpm check` — verde: `next typegen && tsc --noEmit` pulito, `eslint` pulito, 15 file di test, 198 test passati.
  - `pnpm build` — verde (pagine `/dev/hotseat` e `/dev/ui` compilate).
  - `pnpm build && pnpm start` — in produzione `curl` su `/dev/hotseat` e `/dev/ui` risponde **404**, `/` risponde
    200 (l'eccezione D-43 è spenta in produzione).
  - `pnpm dev` con browser vero (Chrome via CDP): ho guardato e usato la pagina.
- **Verificato a occhio nel browser** (`pnpm dev`, http://localhost:3000/dev/hotseat): tabellone con numeri,
  decorazioni, 7 scale e 6 serpenti generati, pedine (scostate quando sono sulla stessa casella) e anello del
  turno; tiro dei dadi e movimento; casella sfida con minigioco **tris** giocato fino alla risoluzione; **memory**
  con carte che si scoprono e contatore delle coppie; **timer** che scende (3:00 → 2:48); casella domanda **breve**
  con testo vero dei contenuti, risposta scritta, verdetto dell'altro («Giusta») e **+3 monete**; casella domanda
  **aperta** con «Ne abbiamo parlato» e **+1 moneta**; schermata finale con «Rivela la prossima stella» una alla
  volta (Sapientone, Campione) e vincitore corretto; pannello con negozio e oggetti; strumenti di prova.
- **Non verificato a occhio** (da guardare in locale): domanda a scelta multipla con verdetto automatico, imprevisto
  (`ACK_EVENT`), offerta della stella, zaino pieno, doppia conferma con disaccordo, sfida lampo del serpente,
  acquisto e uso degli oggetti dal pannello, salto della pedina cella per cella, e una partita intera dall'inizio
  alla fine senza usare gli strumenti di prova.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), voci **F1-05** e
  **F0-05 · F2-02 · F3-02 · F5-06**.
- **Decisioni Derivate aggiunte:** D-43 (motore nel browser solo nelle pagine `/dev`, 404 in produzione), D-44
  (scheda di prova e due sfide di prova per i minigiochi della hot seat).
- **Domande per il proprietario:** il tabellone così va bene (numeri, celle nere, serpenti con corpo a macchie)?
  La pedina-segnaposto (cerchio col colore e l'iniziale) va bene fino ai file Rive? Le carte e la schermata finale
  vanno bene come disposizione? La pagina `/dev/hotseat` deve restare anche dopo il pacchetto D o la togliamo?
- **Limiti noti / debito tecnico:** le animazioni saltano da una casella all'altra in un salto solo (il salto
  cella per cella e le mosse dei minigiochi animate sono aperti); le schermate su dati finti non hanno ancora i
  dati veri né i testi definitivi; i minigiochi girano nel browser solo in hot seat (i turni remoti sono del
  pacchetto D); i pulsanti disabilitati usano il bordo tratteggiato invece del grigio, per restare nel bianco e nero.

## Pacchetto B · Contenuti — 2026-09-17

Branch: hermes/b-content (partito da `main`) · Ultimo commit: vedi `git log -1 hermes/b-content`

- **Fatto:** F3-04 `[L]` (150 domande), F4-01 `[L]` (17 carte sfida). Stato `[L]` e non `[x]` perché la revisione dei
  testi è del proprietario (HERMES.md § 3, Pacchetto B).
- **Verificato da me:** comandi eseguiti davvero, con l'esito reale:
  - `pnpm content:seed` — verde: `seed.sql: 150 domande, 17 sfide, 0 tabelloni` (in questo branch `main` non ha
    ancora la disposizione `classic`, che arriva con il pacchetto A).
  - `pnpm check` (typecheck + eslint + vitest) — verde: 2 file di test, 17 test passati (9 sulla griglia del
    tabellone, 8 sui contenuti).
  - `pnpm build` — verde.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), voci **F3-04**, **F4-01** e la nota
  di merge su `supabase/seed.sql`.
- **Decisioni Derivate aggiunte:** D-41 (quiz e riflessi restano duelli a doppia conferma finché F4-04 non aggiunge
  i loro moduli al motore).
- **Domande per il proprietario:** la revisione dei testi; se va bene lasciare `quiz-lampo` e `riflessi` come duelli
  a doppia conferma fino a F4-04; se i toni delle domande profonde di livello 3 vanno bene.
- **Limiti noti / debito tecnico:**
  - i testi delle 150 domande sono una **prima bozza di agente**: vanno riletti (voce F3-04 del Registro);
  - `durationSeconds` di `quiz-lampo` e `riflessi` è indicativa finché non ci sono i minigiochi a tempo;
  - i filtri della serata (categorie attive, durata massima) sono dati di lobby, non ancora usati dalla UI
    (pacchetto D).

## Correzioni all'interfaccia e scenari delle carte (task A e B) — 2026-09-17

Branch: hermes/e-ui-fix (partito da `main` a 9f4477d: `main` conteneva già i pacchetti A, B e C) · Ultimo commit
del pacchetto: e3ab31f (questo rapporto è in quel commit; l'aggiornamento di questa riga è l'unica modifica
successiva).

- **Fatto:** i cinque punti del task A (A1 numeri e simboli delle caselle sopra scale e serpenti con l'alone del
  colore della carta; A2 pedina con il numero del posto; A3 indicatore del turno; A4 partita in una schermata sola
  da 1024 × 768 in su; A5 stella della casella 15 leggibile senza spostare la scala) e il task B (`/dev/scenari`,
  25 stati di carta fissati a mano). F1-05 resta `[x]`: non nasce nessun task nuovo. La pagina degli scenari è
  registrata come derivata in D-45, la pedina e l'indicatore in D-46.
- **Verificato da me:** comandi eseguiti davvero, con l'esito reale:
  - `pnpm check` (typecheck + eslint + vitest) — verde: 16 file di test, **209 test passati**.
  - `pnpm build` — verde (Next.js 16.3.5; fra le rotte anche `/dev/scenari`).
  - `pnpm build && npx next start -p 3101` — in produzione `/dev/scenari`, `/dev/hotseat` e `/dev/ui` rispondono
    **404**, `/` risponde **200**.
  - `pnpm dev` con Chrome vero (CDP): a **1024 × 768** la pagina della hot seat ha `scrollHeight == innerHeight ==
768`, cioè non scorre; il tabellone sta in 544 px di lato; con una carta aperta (sfida Memory) la pagina resta
    ferma e scorre solo la colonna di destra. Idem a 1440 × 900 e a 1920 × 1080 (nessuno scorrimento di pagina).
  - `/dev/scenari` a 1024 × 768: 25 riquadri, 22 con una carta viva (gli altri tre sono la schermata finale),
    zero errori di console (`console.error` intercettato prima del caricamento, quindi anche eventuali disaccordi
    di idratazione).
- **Verificato a occhio** (`pnpm dev`, Chrome via CDP, viewport 1024 × 768 e 1280 × 900):
  - i numeri delle caselle coperte da scale e serpenti (12, 16, 17, 18, 54, 55, 56, 93, 96, 98…) si leggono, con
    l'alone chiaro attorno; **la stella della casella 15 si vede** sotto la scala 8→26 e la stella della 53 si vede
    sotto il serpente — la scala non è stata spostata (A1, A5);
  - le due pedine mostrano "1" e "2" (A2);
  - chi ha il turno ha riga col bordo spesso, pallino pieno ed etichetta nera "Tocca a te" (A3), su una riga sola;
  - la pagina degli scenari: indice, titoli, righe di spiegazione e carte; nessun testo tagliato o pulsante
    sovrapposto.
- **Verificato cliccando** su `/dev/scenari` (letture dopo il render, con la riga di controllo di ogni riquadro):
  domanda multipla risposta giusta +3 monete; "Quasi" +1; domanda aperta +1; domanda su base di scala 8 → 26 con
  +3 monete; vento a favore 60 → 65; sentiero sbagliato 40 → 35; regalo 5 ↔ 8 monete; tesoro +1 oggetto; serpente
  improvviso 60 → 34; scala fortunata 60 → 92; pausa nessun effetto; stella da 12 a 2 monete e +1 stella; con 4
  monete il pulsante "Compra" è spento; zaino pieno; tris giocabile; sfida lampo "Non riuscita" 62 → 18; finale con
  le tre stelle rivelate una alla volta.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), voci **F1-05 · Correzioni
  all'interfaccia della partita** e **F1-05 · Pagina `/dev/scenari`**.
- **Decisioni Derivate aggiunte:** D-45 (pagina `/dev/scenari`), D-46 (pedina con il numero del posto e turno
  segnalato da tre indizi). D-43 e D-44 sono ora marcate «confermata dal proprietario il 2026-09-17»; D-42 lo era
  già. La voce "Ancora aperte" sulle posizioni della disposizione `classic` è chiusa: il proprietario le ha
  approvate.
- **Domande per il proprietario:** le stesse di A1/A5 viste a occhio (basta un sì o un no per chiudere); se la
  pagina `/dev/scenari` va tenuta anche dopo il pacchetto D, come `/dev/hotseat`.
- **Limiti noti / debito tecnico:**
  - a 1024 × 768 la colonna di destra scorre, quindi con una carta lunga (Memory, forza 4) il fondo della carta
    richiede un piccolo scorrimento del pannello: la pagina non scorre, ma la carta non ci sta tutta. Se serve, si
    accorcia la carta o si stringe il pannello;
  - `/dev/scenari` non è collegata da nessun indice: si apre a mano;
  - il salto della pedina resta "in un salto solo" (F2-05) e gli scenari non mostrano il tabellone, solo la carta.

## Pacchetto D · Server e database — 2026-09-17

Branch: `hermes/d-server`, creato da `hermes/e-ui-fix` (portava i task A e B) e poi **ribasato su `main`** con il
lavoro del proprietario (concordanza dei numeri e `src/lib/plural.ts`) · Commit: `1544dea` (F0-01), `500971a`
(F0-02), `eed7e01` (F0-03), `225eb0d` (F0-04), `bda9468` (F2-01 e parte pura di F3-01), `fda7f6e` (F2-02, F3-02,
F3-05, F5-06), `210224d` (schermate collegate, F2-03, F2-04), più i commit di documentazione. Il primo commit del
pacchetto dice da dove nasce il branch. Il lavoro interrotto a metà sessione è su `hermes/d-wip` (b366b5b), **da
ripescare, non da unire**.

- **Fatto:** F0-01 `[L]`, F0-02 `[x]` (coperto dai test), F0-03 `[L]`, F0-04 `[L]`, F0-05 `[L]`, F2-01 `[L]`,
  F2-02 `[L]`, F2-03 `[L]`, F2-04 `[L]`, F3-01 `[L]`, F3-02 `[L]`, F3-05 `[L]`, F5-06 `[L]`. Tutto il resto `[L]`
  perché **qui il database non c'è**: le voci del Registro di [local-testing.md](local-testing.md) sono scritte
  perché il proprietario possa eseguirle senza sapere come sono fatte dentro. `supabase/tests/rls.sql` impersona i
  due posti della stanza e pretende sia il "non deve vedere niente" (rooms mai leggibile, scheda dell'altro
  invisibile, scritture rifiutate) sia il "deve vedere solo la sua stanza".
- **Verificato da me:** comandi eseguiti davvero, con l'esito reale:
  - `pnpm check` — verde a ogni commit: da 209 test (main) a **269 test su 26 file**.
  - `pnpm build` — verde, con il Proxy di Next 16 e tutte le rotte nuove (`/api/rooms/[code]/games`,
    `/api/sheet/[questionId]`, `/api/rooms/leave`, le quattro pagine `/r/[code]/*`).
  - `pnpm room:create --help`, con argomenti sbagliati e senza `.env.local`: stampa l'uso o l'errore giusto e non
    tocca il database.
  - `pnpm content:push` senza variabili: esce con il messaggio sulle variabili mancanti e non pubblica nulla.
  - `pnpm build && pnpm start`: in produzione `/dev/scenari`, `/dev/hotseat` e `/dev/ui` rispondono **404** e `/`
    risponde **200** (le pagine di sviluppo restano spente).
- **Non verificato da me** (serve Docker e Supabase, cioè le voci del Registro): migrazione applicata davvero,
  `pnpm db:types`, `supabase/tests/rls.sql`, l'accesso da due browser, il `409` con due clic quasi simultanei,
  Realtime e Presence, la pesca delle domande dal catalogo vero, il salvataggio della scheda, il diario.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), sezione "Pacchetto D": F0-01,
  F0-03, F0-04, F0-05 · F2-02, F2-01, F2-03, F2-04, F3-01, F3-02, F3-05, F5-06, più la voce finale sulle pagine
  `/dev`.
- **Decisioni Derivate aggiunte:** D-47 (hash della password fuori dal marcatore `server-only`, per gli script),
  D-48 (le pagine della stanza si riparano da sole e rimandano alla fase), D-49 (pesca delle domande: scelta pura,
  adattatore, registrazione nella transazione), D-50 (ritardo sui tentativi in memoria del processo, con la riga in
  "Ancora aperte").
- **Domande per il proprietario:**
  1. `src/lib/supabase/database.types.ts` non esiste nel repo: lo generi con `pnpm db:types` e vuoi che sia
     committato? (Passare i client Supabase ai tipi generati è un lavoro piccolo ma a parte.)
  2. Il `409` consigliato nel Registro è quello "da Studio" (alzi `games.version` a mano e premi un pulsante): la
     prova con due clic veri dipende dai tempi e può non capitare. Va bene, o vuoi una via più diretta?
  3. La scheda incompleta porta a `sheets` con il pulsante "Gioca lo stesso": preferisci che la lobby parta da
     sola quando la scheda è solo parzialmente piena?
- **Limiti noti / debito tecnico:**
  - **niente tipi generati**: i client Supabase sono senza schema e le righe lette sono riportate a mano;
    `pnpm db:types` più un giro di tipi è il lavoro successivo;
  - **layout del gioco duplicato in parte**: `features/game/online-table.tsx` ripete la griglia di
    `game-table.tsx` (tabellone a sinistra, colonna di destra scorrevole) invece di estrarla: i componenti sono gli
    stessi, la cornice no;
  - **la pesca delle domande legge l'intero catalogo** a ogni azione (150 righe: va bene ora, non a mille);
  - **Presence** alimenta l'indicatore "connesso", non ancora "connesso ma in un'altra schermata";
  - **`quiz-lampo` e `riflessi`** restano duelli a doppia conferma (D-41); F4-04, i file `.riv`, l'emulatore e gli
    account Vercel/Supabase restano fuori da questa sessione, come richiesto.

## Pacchetto E · La partita su due schermi — 2026-09-17

Branch: `hermes/e-two-screens` (da `main` a `2b2983d`) · Un commit per punto, ognuno con `pnpm check` verde prima
del push: `e6e3675` (E1, le carte per posto), `7c74a20` (E2, lobby atomica), `58770c2` (E4, diario), `91fae50`
(E3, minigiochi a tempo e pausa esterna), più il commit di questa documentazione (E5 dentro).

- **Fatto:**
  - **E1 (F3-03, F4-02, F4-06, F5-05)** `[L]`: `CardPanel` riceve il posto di chi guarda (`viewerSeat`), le regole
    stanno in `src/features/cards/viewer.ts` (puro, 12 prove) e ogni carta mostra i comandi propri oppure una
    riga di attesa. Hot seat e `/dev/scenari` passano `"all"` (comportamento di prima); `/dev/scenari` ha
    l'interruttore «Guarda come posto 1 / posto 2 / Tutti e due» (D-56).
  - **E2 (F2-02)** `[L]`: il pronto è una transazione SQL (`set_lobby_ready`, `start_lobby_game`, migrazione
    `20260918120000_lobby_atomic.sql`); `readyOutcome` in TypeScript con 5 prove sulla doppia chiamata;
    `supabase/tests/lobby.sql` per il controllo in Studio (D-53). Da F2-02 è sparito `.single()`.
  - **E3 (F4-03, F4-04, F4-05)** `[L]`: quiz-lampo e riflessi sono minigiochi a tempo del motore (D-55, D-41
    superata): `src/engine/minigames/quiz.ts` (domande nelle carte, contenuto pubblico) e `reflex.ts` (segnale
    dall'orologio del server, partenza falsa = punto all'altro, meglio di cinque); moduli con orologio
    (`MinigameClock`) e `turn` che può valere `"both"`. UI in `src/features/minigames/quiz.tsx` e `riflessi.tsx`.
    Sfide esterne: link, pausa e «Chi ha vinto?» (F4-05). `pnpm content:seed` rigenerato (quiz nelle sfide).
  - **E4 (F5-06)** `[L]`: il diario scrive il testo della domanda e il nome della sfida dal catalogo nel bundle,
    non registra le monete a zero, testi riletti (D-54).
  - **E5 (F2-05)** `[L]`: percorso della pedina cella per cella (`src/features/board/route.ts`, 7 prove) e coda
    dei movimenti (`use-move-queue.ts`) usata da hot seat e partita online; ingresso della carta animato (D-57).
- **Verificato da me:** comandi eseguiti davvero, con l'esito reale:
  - `pnpm check` — verde: da 269 prove (26 file di `main`) a **318 prove su 30 file**.
  - `pnpm build` — verde, con tutte le rotte (comprese `/dev/scenari`, `/dev/hotseat`, `/dev/ui`).
  - `npx next start -p 3101` + `curl`: `/` → **200**, `/dev/scenari`, `/dev/hotseat`, `/dev/ui` → **404**.
  - `pnpm content:seed` — verde: `seed.sql: 150 domande, 17 sfide, 1 tabelloni` (le due sfide a tempo portano il
    loro minigioco e il quiz le sue domande).
  - `pnpm dev` con Chrome vero (CDP): `/dev/scenari` con i **27 riquadri**, l'interruttore «chi guarda» provato su
    11 riquadri (domanda multipla, breve, aperta, imprevisto, stella, zaino pieno, tris, prova a giudizio, doppia
    conferma, disaccordo, e i due nuovi a tempo), zero errori in console; successivamente quiz giocato fino al
    terzo turno (punti e turno corretti, riga di attesa per l'altro posto) e riflessi con «Tocca!» dopo il
    segnale («Punto a Leo.») e partenza falsa («Partenza falsa: il punto va a Marta.»).
  - Animazione della pedina campionata in hot seat ogni 40 ms durante un tiro da 4 caselle: **quattro saltelli**
    (~160 ms l'uno, uno per casella), non un arco solo.
- **Non verificato da me** (serve Docker e Supabase, cioè le voci del Registro): la migrazione applicata e
  `supabase/tests/lobby.sql`, i due «Sono pronto» quasi simultanei su due finestre, i minigiochi a turni online,
  la pausa della sfida esterna in due finestre, il diario letto dal database, la coda delle animazioni con due
  righe di tempo reale insieme.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), sezione «Pacchetto E»:
  F2-02 (lobby atomica), F3-03 · F4-02 · F4-06 · F5-05 (le due viste), F4-03 · F4-04 (minigiochi), F4-05 (pausa
  esterna), F5-06 (diario), F2-05 (animazioni), più la voce finale sulle pagine `/dev`.
  **Prima di tutto:** `pnpm db:reset`, poi `pnpm db:types` e commit del file rigenerato (i tipi guadagnano le due
  funzioni nuove).
- **Decisioni Derivate aggiunte:** D-53 (lobby atomica), D-54 (testi del diario dal catalogo nel bundle),
  D-55 (quiz-lampo e riflessi minigiochi a tempo, sostituisce D-41), D-56 (la carta sa chi la guarda),
  D-57 (animazioni cella per cella e in coda). Chiuse nelle «Ancora aperte»: carte per due schermi, diario con
  l'id della domanda e monete a zero, `[analytics]` in `config.toml`.
- **Domande per il proprietario:**
  1. Nei **riflessi** il pulsante è sempre acceso e chi tocca prima del segnale regala il punto all'altro: è la
     regola che ho scelto (D-55). Va bene, o preferisci che il pulsante si accenda solo col segnale (e allora non
     si può sbagliare)?
  2. Nel **quiz-lampo** le cinque domande sono di cultura generale e stanno nella carta: vanno bene, o preferisci
     domande sulla coppia (servirebbe un'altra strada: la risposta giusta non può stare nel bundle)?
  3. Nella hot seat i **riflessi** non hanno due schermi: preme il posto di turno. Va bene per la prova, o la
     carta va nascosta fuori dalla partita online?
  4. Il diario non registra le monete a zero: resta così anche per gli **oggetti** comprati a zero monete (non
     succede nel gioco, ma il caso esiste nel registro)?
  5. `/dev/scenari` ha ora 27 riquadri e l'interruttore «chi guarda»: la pagina resta anche dopo questo pacchetto?
- **Limiti noti / debito tecnico:**
  - **le pedine dei minigiochi non si animano**: gli eventi `MINIGAME_MOVED` arrivano ma tris, forza 4 e memory
    ridisegnano lo stato senza transizione (resta aperto in F2-05);
  - i **riflessi** dipendono dall'orologio del browser per _mostrare_ il segnale (il giudizio è del server): con
    due dispositivi con orologi diversi di qualche secondo la sfida resta corretta, ma il segnale può apparire
    prima a uno dei due;
  - la **coda delle animazioni** è per posto: se due movimenti riguardano lo stesso posto si animano uno dopo
    l'altro, quindi un tiro che finisce su una scala dura due animazioni (~2 s);
  - il **diario** legge l'intero catalogo delle domande all'avvio del server (150 righe in memoria: va bene ora);
  - `quiz-lampo` e `riflessi` hanno una durata della carta (`durationSeconds`) che resta indicativa: il quiz lo
    chiudono le domande, i riflessi i cinque round;
  - l'accesso con ritardo crescente (D-50), la presenza non protetta e i valori di verde bosco e ocra restano
    come erano: fuori da questo pacchetto.

## Pulizia dei branch — 2026-09-17

`hermes/d-wip` (commit `b366b5b`, "Save the work in progress on the online wiring") è stato **cancellato** da
GitHub e in locale, come indicato dal proprietario. Controllato prima di buttarlo: il commit dice di sé che non
compila ("saved as a workbench to pick from, not to merge") e tocca sei file — `online-table.tsx`,
`lobby-container.tsx`, `use-room-realtime.ts`, `sheet-container.tsx`, `room/current.ts`, la route dei giochi —
che in `main` esistono in versione riscritta e verificata dal vivo (pacchetto D). Nessun pezzo rimasto indietro:
niente da ripescare. Stessa pulizia per i branch locali ormai uniti (`hermes/a-engine`, `hermes/b-content`,
`hermes/c-ui`, `hermes/d-server`, `hermes/e-ui-fix`).

## Pacchetto G · L'estetica finale — 2026-09-18

Branch: `hermes/g-estetica` (da `main` a `1dcd66d`) · Un commit per punto, ognuno con `pnpm check` verde prima del
commit e pushato subito: `94e2a44` (G1, le decorazioni del tabellone), `383cfbb` (G2, tre disegni rifatti), `d294175`
(G3, i riquadri memory e forza 4 in `/dev/scenari`), `476d933` (G4, i wrapper Rive), più il commit di questa
documentazione. Nessuna migrazione: il pacchetto non tocca il database, quindi niente `db:reset` e niente `db:types`.

- **Fatto:**
  - **G1 (F6-02)** `[L]`: le quattro decorazioni multi-cella non sono più i segnaposto a filo del pacchetto C. Sono
    forme **piene** in inchiostro, della pasta dei disegni nuovi, e stanno dentro il gruppo di caselle che la
    disposizione indica con un margine di 12 unità dal bordo: `disc` (caselle 4-5), `crescent` (9), `hill` (23),
    `diamond` (26). I nomi vecchi sono spariti dal tipo `BoardDecoration` (`src/engine/types.ts`), il disegno è in
    `board.tsx` e la scelta in `src/content/boards/classic.ts` (D-65). Le illustrazioni delle caselle e l'alone dei
    numeri restano sopra: nessuna modifica a posizioni, scale o serpenti.
  - **G2 (F6-02)** `[L]`: rifatti i tre disegni che a 48 px non si leggevano — `deep-mirror` (cornice ovale su due
    zampe con il piede), `deep-roots` (tronco che si apre in forcelle sotto una linea di terra tratteggiata),
    `memories-phone` (telefono a disco: corpo, disco, cornetta appoggiata sopra).
  - **G3 (F2-05)** `[L]`: in `/dev/scenari` ci sono i due riquadri che mancavano, memory e forza 4: usano le carte di
    prova della hot seat (`dev-forza-4`, `dev-memory`, D-44), che prima non erano raggiungibili dagli scenari — il
    mazzo degli scenari è ora il catalogo vero più `HOTSEAT_CHALLENGE_CONTENT` (D-66). Riquadri: da 27 a **29**.
  - **G4 (F6-04, F6-05)** `[L]`: i cinque wrapper Rive esistono in `src/art/rive/` (`PawnView`, `DieView`, `CardView`,
    `MascotView`, `FinaleView`), ognuno col suo segnaposto che regge da solo e con la sonda che prende il file appena
    c'è in `public/rive/` (una richiesta per file per sessione, esito fuori da React con `useSyncExternalStore`,
    D-67). Nessun `.riv` creato o modificato: i nomi attesi stanno in `src/art/rive/files.ts` e la lista per l'editor
    è nella voce F6-04 · F6-05 del Registro. Corretto anche il contratto in `docs/design.md`: l'ingresso `winner` di
    `finale.riv` è un **numero** (0 pareggio, 1, 2), non un trigger. I segnaposto si guardano in fondo a `/dev/art`.
- **Verificato da me:** comandi eseguiti davvero, con l'esito reale:
  - `pnpm check` — verde a ogni commit: **360 prove su 34 file** (il numero di `main`), `tsc` e `eslint` puliti anche
    sui file nuovi dei wrapper.
  - `pnpm dev` + Chrome vero (CDP):
    - **tabellone** (`/dev/hotseat`) guardato a tre ingrandimenti: le quattro forme nuove si leggono come forme volute,
      i numeri 4, 5, 9, 23, 26 restano leggibili, scale e serpenti passano sopra le decorazioni. Effetto collaterale
      visto e dichiarato: il disco delle caselle 4-5 copre il bordo fra le due (si vedono i numeri, non la linea).
    - **`/dev/art`**: i tre disegni rifatti guardati a **48 px** (ingranditi 3×) e a 200 px, uno per uno, in più giri:
      il telefono ora si legge come un telefono a disco, le radici come radici, lo specchio come uno specchio da
      tavolo (è quello che mi convince di meno: a 48 px si può leggere anche come un cavalletto — vedi le domande).
    - **`/dev/scenari`**: i 29 riquadri; nel riquadro memory due clic a 90 ms con la traccia raccolta ogni 250 ms →
      le carte si scoprono **una dopo l'altra** (`su: [1]`, poi `su: [1,2]`), mai insieme, e la coppia sbagliata resta
      scoperta; in forza 4 una pedina per clic, nella colonna giusta e del colore giusto.
    - **`/dev/art`, sezione «Segnaposto Rive»**: i cinque segnaposto a schermo (sei pedine, dado, carta davanti e
      dietro, sei mascotte, tre finali), **zero** elementi `canvas` in pagina e una sonda per file (`pawns`, `dice`,
      `card`, `mascots`, `finale` → 404, come deve essere finché i `.riv` non ci sono).
  - `curl` sulle rotte di sviluppo: `/dev/hotseat`, `/dev/art`, `/dev/scenari` → **200** in sviluppo.
- **Non verificato da me / non verificabile da qui:**
  - il comportamento dei wrapper **con** il file `.riv`: senza i file non c'è niente da caricare. La prova è del
    proprietario, appena esporta il primo (il segnaposto deve sparire da solo);
  - i **tempi in millisecondi** delle animazioni dei minigiochi: Chrome strozza `setTimeout` e
    `requestAnimationFrame` nella scheda guidata da qui, quindi l'ordine è verificato e la durata no (stesso limite
    del pacchetto E);
  - i **wrapper non sono collegati alle schermate**: F6-04 e F6-05 chiedevano solo i wrapper, quindi il tabellone usa
    ancora la pedina di `features/board/pawn.tsx` e il dado e la carta i loro segnaposto attuali. Il collegamento è un
    passo che non era in questo pacchetto: va fatto quando i `.riv` esistono (o subito, se preferisci vedere i
    segnaposto in partita al posto dei disegni di adesso);
  - **nessun test nuovo**: le decorazioni sono disegno puro (i test geometrici coprono scale e serpenti, non le
    decorazioni), i due riquadri degli scenari e i wrapper Rive sono componenti React e il progetto non ha un ambiente
    DOM per provarli (`vitest` gira in `node` e include solo `*.test.ts`). La prova sta nelle pagine.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), sezione «Pacchetto G»:
  **G1** (le decorazioni del tabellone), **G2** (i tre disegni a 48 px), **G3** (i due riquadri, che è F2-05),
  **G4** (i segnaposto Rive e la lista dei file da disegnare). Non serve Docker né Supabase: tutto in `pnpm dev`.
- **Decisioni Derivate aggiunte:** D-65 (le decorazioni sono forme piene), D-66 (un riquadro in `/dev/scenari` per
  ogni minigioco che si vuole guardare), D-67 (i wrapper Rive con il segnaposto e la sonda una volta per sessione).
  D-64 era tua (la serata conclusa che resta raggiungibile): non l'ho toccata.
- **Domande per il proprietario:**
  1. **Le decorazioni restano?** Le ho rifatte come forme piene e secondo me il tabellone ci guadagna (D-65), ma è la
     pagina più piena del progetto: se ti sembrano di troppo si tolgono con `decorations: []` in
     `src/content/boards/classic.ts`, una riga. E se il disco sulle caselle 4-5 che copre il bordo fra le due non ti
     piace, si cambia con una forma che non attraversa il bordo.
  2. **`deep-mirror` basta?** È l'unico dei tre che non mi convince del tutto a 48 px: si legge come uno specchio da
     tavolo, ma anche come un cavalletto. Se vuoi lo rifaccio, ma mi serve sapere **cosa deve sembrare a chi guarda**
     (uno specchio a mano? da tavolo? di profilo?) — la prima volta l'ho sbagliato perché pensavo all'oggetto e non al
     segno.
  3. **I wrapper Rive li collego subito o quando ci sono i file?** Adesso in partita si vedono i segnaposto vecchi
     (pedina del tabellone, dado, carta); i wrapper nuovi non sono chiamati da nessuna schermata. Posso collegarli
     quando vuoi, anche prima dei `.riv` (cambierebbe l'aspetto di pedine, dado e carta con i segnaposto nuovi).
- **Limiti noti / debito tecnico:**
  - finché i `.riv` mancano, la console mostra **una riga di rete per file** (`GET /rive/pawns.riv 404`): è il browser
    che registra la richiesta della sonda, non un errore dell'applicazione. Se preferisci zero righe, si può togliere
    la sonda e dichiarare i file disponibili in una costante da aggiornare a mano;
  - le **mascotte** sono sei teste disegnate in codice come segnaposto (le stesse sei forme delle pedine): quando
    arrivano i `.riv` le sostituiscono per intero, espressioni comprese;
  - il `mood` della mascotte, l'`active` della pedina e gli altri ingressi sono passati al `.riv` ma **non hanno
    effetto sul segnaposto**: è voluto (il segnaposto è fermo per contratto, `docs/design.md`);
  - la lista dei `.riv` è un contratto scritto in due posti (`src/art/rive/files.ts` e la tabella di
    `docs/design.md`): se cambi un nome, vanno cambiati tutti e due (e la voce del Registro).

## Pacchetto H · Le rifiniture — 2026-09-18

Branch: `hermes/h-rifiniture` (da `main` a `56e02b8`) · Un commit per punto, ognuno con `pnpm check` verde prima del
commit e `pnpm build` verde prima del push, pushato subito: `25b5dc2` (H1, i due disegni rifatti), `d0b6d7e` (H2, i
wrapper collegati), `e907485` (H3, il generatore da seme), più il commit di questa documentazione. Nessuna
migrazione: il pacchetto non tocca il database, quindi niente `db:reset` e niente `db:types`.

- **Fatto:**
  - **H1 (F6-02)** `[L]`: rifatti i due disegni che il proprietario aveva respinto, guardandoli **a 48 px** a ogni
    giro di lavoro. `deep-roots` è ora terra vista in sezione: campitura piena in alto (non più tratteggio — a 48 px
    un tratto da 2,5 unità è sotto il minimo di 3 di `design.md`), nessun tronco sopra, quattro radici asimmetriche
    con basi distanti almeno 8 unità di carta, che si assottigliano **a gradini** da 11 a 3,5 unità con la punta
    tonda. `deep-mirror` è uno specchio a mano visto di fronte: ovale **più alto che largo** (un cerchio con un
    manico sotto è un lecca-lecca), cornice spessa in inchiostro, manico corto e largo, e dentro una fascia
    diagonale di carta su fondo di inchiostro — il riflesso è il segno che dice «superficie che riflette». Fra
    cornice e fondo restano 4 unità di carta, perché due inchiostri a contatto si fondono in una macchia (D-65).
    Due tentativi buttati e dichiarati: radici parallele di lunghezza simile tornavano a leggersi come zampe
    (quattro radici larghe quasi a contatto = le zampe di una cosa sola), e un cuneo appuntito sotto una campitura
    piena si legge come un dente.
  - **H2 (F6-04, F6-05)** `[L]`: i wrapper Rive di `src/art/rive/` sono **collegati alle schermate** — pedina del
    tabellone, dado, carta, schermata finale — con la regola che finché i `.riv` mancano non cambia niente di quello
    che si vede (D-68). Ogni wrapper prende un `placeholder` e le schermate ci passano il componente attuale: la
    pedina il cerchio SVG di prima (dentro l'SVG il canvas Rive entra solo con un `foreignObject`), il dado
    `DieFace` (il dado a **pallini**, non la cifra di `/dev/art`), la carta i suoi figli (`placeholder="children"`,
    perché l'ingresso è già Motion, D-57). La **finale** è un **ornamento** in uno spazio nuovo in testa alla
    sezione, con segnaposto «niente»: le tre rivelazioni e le loro frasi restano identiche (D-69). La **mascotte**
    non è collegata: non ha un posto nell'interfaccia (vedi le domande). Il numero di posto dell'animale lo porta
    `Board` con la nuova prop `pawns`, e il dado riceve `rollCount` — il contatore dei `ROLLED` che conta il tavolo,
    perché il trigger di `Roll` è un contatore e nessun componente deve tenere stato per costruirlo.
  - **H3 (F7-02)** `[L]`: `generateBoard(seed)` in `src/engine/board-generator.ts`. Funzione pura e deterministica
    (generatore congruenziale a interi: niente `Math.random`, niente orologio), con i vincoli del validatore e la
    regola delle decorazioni di D-65. Per misurarla è nato `src/engine/board-geometry.ts`, il modulo puro condiviso
    con il disegno del tabellone (D-70). 17 prove nuove in `board-generator.test.ts`; la pagina
    **`/dev/disposizioni`** mostra quattro semi fissi più quello che si scrive nel campo.
- **Verificato da me:** comandi eseguiti davvero, con l'esito reale:
  - `pnpm check` verde a ogni commit: **377 prove su 35 file** (erano 360 su 34), `tsc` ed `eslint` puliti. `pnpm
build` verde prima di ogni push.
  - **H1, guardato a occhio** in `pnpm dev` (`/dev/art`, Chrome via CDP): i due disegni rasterizzati **a 48 px veri**
    (`deviceScaleFactor: 1`, poi ingranditi ×8 a blocchi) e riguardati a 200 px a ogni giro — **sette giri** in
    tutto, di cui due buttati. Il verdetto mio: a 48 px lo specchio si legge come specchio a mano (l'ovale in piedi,
    la cornice, il manico corto e la fascia chiara dentro) e le radici come radici sotto la terra, senza più la
    silhouette di un omino.
  - **H2, verificato per differenza** (è la prova che chiedeva la regola «non deve cambiare nulla»): con il codice
    nuovo e con `git stash` (H2 tolto) ho scattato gli stessi ritagli di `/dev/hotseat` e `/dev/scenari` e li ho
    confrontati pixel per pixel — **tabellone, riga dei dadi e schermata finale identici al byte** (0 pixel diversi
    su 365.600, 25.664 e 233.940), e il markup della carta identico all'md5 (1.813 byte). In più: **zero** elementi
    `canvas` in pagina, e le sole richieste `/rive/` sono le sonde `HEAD` (`pawns.riv`, `dice.riv`, `card.riv`,
    `finale.riv` → 404), una per file per sessione.
  - **H3, verificato con i test e a occhio**: 17 prove (determinazione, distribuzione di tipi contata dalla
    `classic`, monete metà guadagni e metà perdite, scale che salgono e serpenti che scendono, estremi tutti diversi,
    niente sulla 1 e sulla 100, nessuna testa fra la 2 e la 12, validatore verde su dodici semi, decorazioni solo su
    caselle libere non attraversate, disco su due caselle attaccate, errore chiaro quando i disegni non bastano). Su
    **200 semi** misurati a parte: tutte le disposizioni valide, quattro decorazioni in 198 casi, tre in uno e due in
    uno, con una sola casella decorabile in un caso (la regola viene prima del numero). `/dev/disposizioni` guardata
    a schermo: 4 tabelloni, 0 canvas, riepiloghi coerenti.
  - **Trovato e corretto durante la verifica:** React segnalava in console un **disallineamento di idratazione** sui
    tabelloni generati (`Math.hypot`/`Math.sin` non danno a Node e al browser gli stessi ultimi bit, quindi un `cx`
    differiva nell'ultima cifra). I punti si arrotondano a due decimali e gli angoli a uno, dove nascono (D-71); dopo
    la correzione `/dev/disposizioni` ricaricata **non ha più messaggi in console**.
- **Non verificato / non verificabile da qui:**
  - il comportamento dei wrapper **con** i `.riv`: senza i file non c'è niente da caricare. Resta la prova del
    proprietario al primo export (il segnaposto deve sparire da solo). In particolare **non ho potuto guardare la
    pedina dentro il `foreignObject`**: l'unico pezzo di H2 che cambia aspetto quando il file arriva;
  - i **tempi in millisecondi** delle animazioni (Chrome strozza i timer nella scheda guidata da qui: l'ordine si
    verifica, la durata no — stesso limite dei pacchetti E e G);
  - la **mascotte**: non è collegata da nessuna parte, quindi non c'è niente da guardare;
  - l'**aspetto dei tabelloni generati in partita**: si vedono in `/dev/disposizioni`, non in una serata vera, perché
    la disposizione di una stanza resta `classic`.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), sezione «Pacchetto H»: **H1** (i due
  disegni a 48 px), **H2** (i wrapper collegati e il segnaposto che non cambia niente), **H3** (il generatore in
  `/dev/disposizioni`). Non serve Docker né Supabase: tutto in `pnpm dev`.
- **Decisioni Derivate aggiunte:** D-68 (in partita il segnaposto è il componente attuale della schermata), D-69 (un
  animazione decorativa non può mangiare informazione di gioco), D-70 (il disegno e il generatore misurano l'ingombro
  con lo stesso modulo), D-71 (i numeri che finiscono nel disegno si arrotondano). `docs/design.md` § Animazioni Rive
  e § Illustrazioni aggiornati di conseguenza.
- **Domande per il proprietario:**
  1. **Dove sta la mascotte, e cosa le fa cambiare espressione?** È l'unico asset Rive senza un posto
     nell'interfaccia: servono una schermata (la lobby? la carta? il diario?) e i momenti che devono muoverle il
     `mood` (0 neutro, 1 felice, 2 sorpreso, 3 triste, 4 esultante). Finché non c'è una risposta non la collego: un
     personaggio messo a caso è peggio di un personaggio fermo.
  2. **I tabelloni generati hanno più incroci della `classic`.** Nessun vincolo di `rules.md` lo vieta, ma a occhio la
     `classic` è più ordinata perché le posizioni sono state scelte a mano. Se vuoi, il generatore può preferire
     scale e serpenti distanziati (una regola in più, da documentare): dimmi se è un problema o se va bene così.
  3. **Una decorazione accanto a una casella sfida** (che è nera piena) la tocca con il nero. D-65 parla di scale e
     serpenti, non dei vicini: il generatore oggi non guarda il tipo delle caselle attorno. Si aggiunge in una riga se
     dà fastidio.
  4. Restano le tue tre di prima, che non ho toccato: la **durata della carta del quiz**, se la **pausa della sfida
     esterna** debba fermare il timer, e dove va la **mascotte** (punto 1 di questo elenco).
- **Limiti noti / debito tecnico:**
  - il generatore è più lento di quanto serva (circa 90 ms per tabellone: la misura delle caselle attraversate è
    O(caselle × punti del tratto) e si rifà a ogni tentativo). Va bene per una pagina di sviluppo e per un seme
    scelto una volta; se un giorno si generasse a ogni serata, conviene calcolare prima le caselle occupate e
    pescare solo fra le libere;
  - `DECORATION_SHAPES` sta in `src/engine/board-generator.ts` e le forme si disegnano in `board.tsx`: aggiungere una
    forma vuol dire toccare due file (e il tipo `DecorationShape` in `types.ts`);
  - i tabelloni generati **non sono contenuti versionati**: non finiscono in `supabase/seed.sql` e la lobby non li
    offre. È voluto (F7-02 è una funzione e un modo per guardarla), ma significa che un seme che ti piace oggi non è
    conservato da nessuna parte: dirlo a voce e lo salvo come disposizione con un nome.

## Pacchetto I · Il generatore che si legge — 2026-09-18

Branch: `hermes/i-disposizioni` (da `main` a `f361e37`) · Un commit per punto, ognuno con `pnpm check` verde prima
del commit e `pnpm build` verde prima del push, pushato subito: `1790646` (I1, il vincolo di bordo), `9e14ebc` (I2, il
budget di leggibilità), `3518423` (I3, il congelamento), più il commit di questa documentazione. Nessuna migrazione:
il pacchetto non tocca il database, quindi niente `db:reset` e niente `db:types`. Nessuna illustrazione toccata,
nessun `.riv`, nessun suono, nessuna modifica a `src/content/questions/`, a F0-06, a Vercel o ai file `.env`, e
nessun merge in `main`.

- **Fatto:**
  - **I1 (D-65, terzo vincolo)** `[L]`: `chooseDecorations` filtrava su «libera e non attraversata» e lasciava passare
    le caselle di bordo, dove la cornice (spessa, disegnata **dopo** le decorazioni) si mangia il margine di 12 unità
    e i due neri diventano uno. Ora il vincolo è una **misura**: `isBorderCell` in `src/engine/board-geometry.ts`
    (prima o ultima riga, prima o ultima colonna), accanto a `crossedCells` che c'era già. La prova è come le altre
    due: «non si decora mai una casella di bordo» su dodici semi, più il conto delle caselle decorabili. La `classic`
    **non è stata toccata** (le sue tre decorazioni erano già interne) e nemmeno gli altri vincoli.
  - **I2 (F7-02, D-72)** `[L]`: il budget di leggibilità del proprietario — **6 caselle con più di una linea, 2
    linee al massimo sulla stessa casella** — sta ora **dentro il piazzamento**: `pickWithinBudget` aggiunge una
    scala o un serpente alla volta e rifiuta il candidato che porterebbe il tabellone oltre il tetto, pescando il
    successivo. La misura è `src/engine/board-readability.ts` (`measureReadability`, `addLine`,
    `fitsBudget`), costruita su `elementFootprints` di `board-geometry.ts`: la stessa geometria che disegna il
    tabellone, **niente misura nuova**. Il conto si aggiorna una linea alla volta, e gli ingombri dei ~5.000
    candidati restano in una memoria (rifare la misura da capo faceva scadere i test: da secondi a ~50 ms per
    tabellone). I due tetti sono in `RULES.board` e il budget è un **parametro**: `budget: null` dà il piazzamento di
    prima, per confronto. Se un tetto non lasciasse arrivare a 7 e 6, il generatore **lancia dicendo a quanto si è
    fermato e con che tetto** invece di restituire una disposizione che il validatore rifiuterebbe.
  - **I3 (F7-03, metà meccanica, D-73)** `[L]`: `pnpm board:freeze <seme> <nome>` (`scripts/board-freeze.ts`) scrive
    `src/content/boards/<nome>.ts` con la disposizione **intera come dato** — 100 caselle, 7 scale, 6 serpenti, le
    decorazioni — e riscrive `src/content/boards/frozen.ts`, l'elenco delle congelate. Una disposizione congelata
    **non si rigenera**: se un giorno cambia il generatore, quella non si muove. Lo script **rifiuta** di
    sovrascrivere un file che esiste, e **non ho congelato niente**: i semi e i nomi sono tuoi. Le congelate le
    validano gli stessi test della `classic` (`boards.test.ts` gira su `boards` e su `frozenBoards`) e si guardano in
    `/dev/disposizioni`, che ha una sezione per loro; `boards` resta la `classic`, quindi **la lobby non cambia e la
    scelta non è collegata alla creazione della serata**.
  - **I4 (F6-05, D-74)** decisione scritta, non collegata: la mascotte sta nel **pannello di destra**, è **lo stesso
    animale della pedina**, il `mood` lo muovono **gli stessi `GameEvent[]`** che guidano le animazioni, e non è mai
    l'unico canale di un'informazione (D-69). La mappa evento → mood (5 valori) è in D-74.
- **Verificato da me, con i comandi e i risultati veri:**
  - `pnpm check` verde prima di ogni commit: **413 prove su 38 file** con il pacchetto completo (erano 377 su 35 in
    `main`; 419 con tre disposizioni di prova congelate, sei prove in più che spariscono cancellandole), `pnpm build`
    verde prima di ogni push. Nessun test disattivato, nessuna regola ESLint spenta.
  - **I1**: le prove nuove su `board-geometry.test.ts` (4) e su `board-generator.test.ts` (24 in tutto) sono verdi.
    Correzione dichiarata: la prova «le decorazioni sono quattro, come nella classic» **non poteva più valere** — il
    vincolo di bordo toglie 36 caselle dalle candidate — ed è diventata «al massimo quattro, almeno una» più «non si
    mettono più decorazioni delle caselle decorabili». La `classic` non è toccata, quindi la partita resta identica.
  - **I2**: **incroci e linee per casella dei semi da 1 a 20, prima (il generatore di `main`, `f361e37`) e dopo**
    (misurati con la stessa formula su una copia del generatore di `main` e sul modulo nuovo; la misura è «caselle
    con più di una linea / massimo di linee su una casella»):

    | seme | prima | dopo | seme | prima | dopo |
    | ---- | ----- | ---- | ---- | ----- | ---- |
    | 1    | 36/6  | 6/2  | 11   | 24/4  | 6/2  |
    | 2    | 32/4  | 6/2  | 12   | 38/7  | 6/2  |
    | 3    | 33/6  | 6/2  | 13   | 29/4  | 6/2  |
    | 4    | 35/5  | 6/2  | 14   | 35/4  | 6/2  |
    | 5    | 29/3  | 6/2  | 15   | 33/5  | 6/2  |
    | 6    | 34/4  | 6/2  | 16   | 33/5  | 6/2  |
    | 7    | 34/5  | 6/2  | 17   | 43/7  | 6/2  |
    | 8    | 34/4  | 6/2  | 18   | 36/7  | 6/2  |
    | 9    | 28/4  | 6/2  | 19   | 31/7  | 6/2  |
    | 10   | 32/5  | 6/2  | 20   | 35/6  | 6/2  |

    Prima: incroci **24-43**, linee per casella **3-7**. Dopo: incroci **6**, linee **2** su tutti e venti i semi
    (cioè il tetto, mai superato). Su **200 semi**: incroci massimi 6, linee massime 2, **nessun seme si ferma sotto
    7 scale e 6 serpenti** (il ramo che lancia non è mai servito con i tetti veri; è provato con un tetto impossibile
    — 0 incroci, 0 linee — e il messaggio dice a quanto si ferma).

  - **I2, il conto della `classic` con questa misura è 17 caselle con più di una linea e 2 linee per casella**, non 3
    come l'avevi contato. Non è un tabellone diverso: è la misura — l'inchiostro di una scala è largo 62 unità e tocca
    anche le caselle che sfiora soltanto, mentre a occhio si contano gli attraversamenti che si vedono (nella
    `classic` sono 2, e il massimo di linee per casella è 2 anche per lei). **Conseguenza dichiarata: i tetti che hai
    dato sono più stretti della `classic`** (17 > 6), quindi i tabelloni generati escono più ordinati di lei. Ho
    tenuto i tuoi numeri (sono una decisione di prodotto) e ho lasciato la manopola:
    `RULES.board.maxCrossings` / `maxLinesPerCell`, più `budget: null` per spegnere il budget del tutto.
  - **I2, la decorazione che si paga**: le linee piazzate senza sovrapporsi coprono **più** caselle di linee
    sovrapposte, quindi restano meno caselle libere. Sui semi 1-20 le decorazioni sono 2,4,2,4,3,2,2,4,4,3,1,4,4,4,4,
    4,4,4,4,1 (prima erano 4 in 19 semi su 20). Su **200 semi**: quattro in **130** casi, tre in 43, due in 21, una
    in 5, **nessuna in uno** (il seme 113, che non lascia nemmeno una casella decorabile). **Non è il budget a
    togliere le decorazioni**: con il solo vincolo di bordo e senza budget i semi 1-20 davano 2,4,3,3,4,3,3,3,3,4,4,
    4,3,4,4,1,3,4,2,4 — è il bordo che toglie le 36 caselle di cornice dalle candidate. Non ti dico se si vede
    meglio: quello lo guardi tu (Registro I1 e I2).
  - **I3**: lo script è stato **provato per davvero**, prima di consegnarlo: congelati tre semi di prova
    (`pnpm board:freeze 7 "Prova di congelamento"`, `12 "Seconda prova"`, `3 "Terza prova"`), `pnpm check` verde con i
    file nuovi (validati dagli stessi test della `classic`), `prettier --check` pulito sui file generati, il rilancio
    con lo stesso nome **rifiutato** con il messaggio giusto, e in `/dev/disposizioni` la sezione «Disposizioni
    congelate» con i tre tabelloni, i loro numeri e la riga di leggibilità. Poi i tre file sono stati cancellati e
    l'elenco rigenerato: **nel branch non è congelata nessuna disposizione**. 17 prove in
    `scripts/lib/board-freeze.test.ts` (slug e nomi, determinazione, il file senza chiamate al generatore, i numeri
    dentro, il barrel mai stantio rispetto alla cartella, il rifiuto di un nome che esiste già).
  - **La pagina**, guardata a schermo con `pnpm dev`: `/dev/disposizioni` risponde **200**, 7 righe di leggibilità
    (3 congelate di prova + 4 semi), tutte `6 caselle con più di una linea, al massimo 2 linee su una casella — il
tetto è 6 incroci, 2 linee per casella ✓`, il paragrafo in testa con il conto della `classic` (**17** e 2),
    **zero** elementi `canvas`, e **zero messaggi in console** dopo un ricaricamento con il raccoglitore di
    `console.error` installato prima della navigazione (la lezione di D-71).
  - **Non verificato da me:** l'aspetto dei tabelloni generati **in partita** (la disposizione di una stanza resta la
    `classic`, e nessuna congelata è offerta), i tempi in millisecondi (Chrome strozza i timer nella scheda guidata:
    l'ordine si verifica, la durata no), e la mascotte, che non è collegata da nessuna parte.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), sezione «Pacchetto I»: **I1** (le
  decorazioni fuori dalla cornice, sui tabelloni e sulla `classic`), **I2** (i due numeri della leggibilità per
  tabellone, con il conto della `classic` per confronto, e le decorazioni che calano), **I3** (`pnpm board:freeze`
  con un seme e un nome tuoi, la sezione in pagina, il rifiuto a sovrascrivere), **I4** (solo da approvare: niente da
  guardare in partita). Non serve Docker né Supabase: tutto in `pnpm dev`.
- **Decisioni Derivate aggiunte:** D-72 (il budget di leggibilità dentro il piazzamento, e la misura a inchiostro
  intero, con il conto della `classic` che non è quello a occhio), D-73 (una disposizione congelata è un file di
  dati, non un seme — più la conseguenza sui dati: il tabellone va salvato sulla riga della partita), D-74 (il posto
  della mascotte e la mappa evento → mood, con la regola di D-69). `docs/design.md` § Tabellone e § Animazioni Rive,
  e `docs/roadmap.md` (F7-02, F7-03, F6-05) aggiornati di conseguenza.
- **Domande per il proprietario:**
  1. **Il tetto degli incroci è troppo stretto?** Con la misura a inchiostro la `classic` ne ha 17 e il tetto è 6:
     i tabelloni generati escono più ordinati di lei, e in pagina si vede subito. Guardali e dimmi se il numero da
     girare è `maxCrossings` (una riga in `RULES.board`) — oppure se preferisci che il budget si applichi con il
     **tuo** conto (gli attraversamenti che si vedono: nella `classic` 2, e i semi prima ne stavano fra 6 e 26).
  2. **Le decorazioni**: con il vincolo di bordo quattro forme restano solo in 130 semi su 200. La regola viene prima
     del numero (D-65) e non ho toccato niente per rimediare; se per te quattro forme sono un minimo, le strade sono
     tre — allargare il margine di 12 unità, assottigliare la cornice, o decorare anche le caselle di bordo
     disegnando la cornice **prima** delle decorazioni. Tutte e tre sono di disegno, quindi tue.
  3. **Il tabellone sulla riga della partita**: la conseguenza sui dati è scritta in D-73. La decisione (e la
     migrazione) non sono di questo pacchetto: quando scegli quali disposizioni entrano in gioco, dimmi se il
     tabellone va **copiato** sulla riga della partita o se basta l'id con l'impegno a non rigenerare mai quell'id.
  4. **Il posto della mascotte** (D-74): pannello di destra, un animale per posto. Se il pannello di destra è
     occupato dalle carte, il posto alternativo è dentro la carta — ma allora la mascotte diventa il canale di
     qualcosa, e la regola di D-69 la esclude.
- **Limiti noti / debito tecnico:**
  - il generatore con il budget costa circa **50 ms per tabellone** (200 semi misurati in 11 s con lo script di
    misura, compreso il primo tabellone che riempie la memoria degli ingombri), ed è una funzione pura: se un giorno
    si generasse a ogni serata, i candidati andrebbero misurati una volta e messi in una tabella fuori dal ciclo;
  - la memoria degli ingombri (`footprintCache` in `board-generator.ts`) è stato di modulo: cresce fino a ~5.000
    insiemi di numeri e non si svuota. In una funzione pura è accettabile (è una memoizzazione dello stesso calcolo),
    ma è un pezzo di stato fuori dal seme: se un giorno il generatore girasse su più tabelloni in parallelo, va
    legata all'istanza;
  - `/dev/disposizioni` disegna ogni tabellone con il componente vero della partita: con molte disposizioni congelate
    la pagina diventa lunga (ogni tabellone è un SVG completo) e la prima compilazione è lenta su questo host (~100 s
    per una pagina `/dev` nuova, come dice il Registro del pacchetto E);
  - la mappa evento → mood di D-74 è scritta e non provata: quando la collegheremo, la mappa va in una funzione pura
    con i suoi test (oggi non c'è codice, quindi non c'è niente da testare).

## Pacchetto J · Prima della prima serata — 2026-09-18

Branch: `hermes/j-integrita` (da `main` a `aeeed06`) · Un commit per punto, ognuno con `pnpm check` verde prima del
commit e `pnpm build` verde prima del push, pushato subito: `53be3b7` (J1, l'inclinazione minima), `210c7f8` (J2, un
tabellone pubblicato non si riscrive), `62e8dc3` (J3, il canale privato), più il commit di questa documentazione.
Niente merge in `main`. Nessuna illustrazione toccata, nessun colore, nessun `.riv`, nessuna disposizione congelata,
nessuna modifica a F0-06, Vercel o ai file `.env`. **Niente di visivo da giudicare**: il pacchetto è misura, script e
una migrazione — se un punto del prompt chiedesse un giudizio, sarebbe un errore del prompt.

- **Fatto:**
  - **J1 (F7-02)** `[L]`: la **soglia di inclinazione** di `docs/design.md` § Tabellone (18° sull'orizzontale, per
    scale e serpenti) è diventata un vincolo del generatore. La misura è `elementAngle` in
    `src/engine/board-geometry.ts` — l'angolo fra i **centri** delle due caselle, cioè quello che si legge guardando
    (la scala 51→67 della `classic` sta a 18,4°) — e il numero è in `RULES.board.minAngleDegrees`. Come per il budget
    di leggibilità il vincolo si applica **mentre pesca i candidati**: una scala sotto soglia non entra nemmeno
    nell'elenco, quindi non si scarta mai un tabellone finito. Con la soglia in mano, l'elenco dei candidati perde
    le scale «lunghe e piatta» (una fila e cinque colonne: 11°).
  - **J2 (F3-05, D-78)** `[L]`: `pnpm content:push` non riscrive più un tabellone pubblicato. Legge prima i tabelloni
    dal database e **confronta** ognuno con il file locale: stesso id, stesso layout e stesso nome vuol dire niente
    da fare; un layout diverso **ferma lo script** (uscita 3) dicendo quale id è cambiato e le due strade (id nuovo,
    oppure `pnpm content:push -- --force`). Il confronto è su **JSON canonico** (chiavi in ordine) perché `jsonb` non
    conserva l'ordine delle chiavi: un confronto testuale direbbe «diverso» a ogni ripubblicazione identica. Il
    controllo viene **prima** della prima scrittura, quindi un fermo non lascia mezzo contenuto pubblicato. Domande e
    sfide restano con l'upsert normale: i testi si correggono. La sequenza sta in `scripts/lib/content-publish.ts`
    (con i suoi test); `scripts/push-content.ts` è il guscio.
  - **J3 (F2-03, F2-04, D-79)** `[L]`: il canale della stanza è **privato** (`private: true`) e una **migrazione
    nuova** (`supabase/migrations/20260918180000_private_realtime.sql`) mette due policy su `realtime.messages`: una
    per ricevere e una per inviare (la presenza fa `channel.track`), entrambe con
    `realtime.topic() = 'room:' || public.current_room_id()` — l'helper RLS che dice in che stanza sta chi chiede,
    letto dal database da `auth.uid()`: **il client non manda nessun dato in più** (l'id del giocatore non serve).
    La migrazione è reversibile (due `drop policy` e `private: false`).
- **Verificato da me, con i comandi e i risultati veri:**
  - `pnpm check` verde prima di ogni commit: **438 prove su 40 file** (erano 413 su 38 in `main`), `pnpm build` verde
    prima di ogni push. Nessun test disattivato, nessuna regola ESLint spenta, `prettier --check` pulito sui file
    toccati (prettier non è in `pnpm check`: i file nuovi devono uscire già formattati).
  - **J1, i numeri (prima = `main` a `aeeed06`, dopo = questo branch)**, misurati con lo stesso script
    autosufficiente su due alberi (`git worktree add /tmp/jprima aeeed06`):

    | seme | inclinazione minima prima | dopo        | decorazioni prima → dopo |
    | ---- | ------------------------- | ----------- | ------------------------ |
    | 1    | 8,1°/18,4°                | 36,9°/63,4° | 2 → 0                    |
    | 2    | 18,4°/14,0°               | 18,4°/26,6° | 4 → 4                    |
    | 3    | 18,4°/90,0°               | 26,6°/63,4° | 2 → 4                    |
    | 4    | 18,4°/11,3°               | 18,4°/18,4° | 4 → 4                    |
    | 5    | 18,4°/18,4°               | 18,4°/18,4° | 3 → 3                    |
    | 6    | 8,1°/45,0°                | 23,2°/26,6° | 2 → 4                    |
    | 7    | 14,0°/26,6°               | 26,6°/26,6° | 2 → 4                    |
    | 8    | 18,4°/26,6°               | 18,4°/26,6° | 4 → 4                    |
    | 9    | 26,6°/18,4°               | 26,6°/45,0° | 4 → 4                    |
    | 10   | 8,1°/26,6°                | 33,7°/18,4° | 3 → 3                    |
    | 11   | 14,0°/71,6°               | 23,2°/45,0° | 1 → 4                    |
    | 12   | 11,3°/45,0°               | 21,8°/26,6° | 4 → 3                    |
    | 13   | 26,6°/45,0°               | 33,7°/26,6° | 4 → 4                    |
    | 14   | 31,0°/26,6°               | 26,6°/45,0° | 4 → 4                    |
    | 15   | 8,1°/45,0°                | 26,6°/45,0° | 4 → 4                    |
    | 16   | 7,1°/26,6°                | 26,6°/45,0° | 4 → 4                    |
    | 17   | 9,5°/26,6°                | 38,7°/26,6° | 4 → 4                    |
    | 18   | 23,2°/18,4°               | 26,6°/33,7° | 4 → 4                    |
    | 19   | 18,4°/8,1°                | 18,4°/33,7° | 4 → 3                    |
    | 20   | 11,3°/90,0°               | 26,6°/26,6° | 1 → 4                    |

    **Le scale e i serpenti restano 7 e 6 su tutti e venti i semi** e su **200 semi nessuno si ferma corto** (il ramo
    che lancia non è mai servito). Prima: 13 semi su 20 avevano almeno una linea sotto i 18°, il minimo assoluto era
    6,3° (le scale) e 7,1° (i serpenti), e il 15,8% delle scale stava sotto i 20° (221 su 1.400). Dopo: **nessuna
    linea sotto i 18°**, minimo 18,4° per scale e serpenti, e solo il 4,8% sotto i 20° (67 su 1.400, tutte a 18,4°,
    cioè la pendenza della `classic`).

  - **J1, la decorazione che si paga di nuovo** (dichiarata): linee più ripide coprono più caselle, quindi le
    caselle decorabili diminuiscono ancora. Su 200 semi: quattro in **146** casi, tre in 33, due in 12, una in 7,
    **nessuna in 2** (era 130/43/21/5/1 dopo il pacchetto I). Il seme 1, che prima aveva due decorazioni, ora **non
    ne ha nessuna**: non gli resta una casella libera, interna e che nulla attraversa. La regola viene prima del
    numero (D-65) e il proprietario ha già detto che quattro non è un minimo.
  - **J1, la correzione di una prova, dichiarata**: «le decorazioni sono al massimo quattro, **almeno una**» perde
    l'«almeno una» (il seme 1 non ne ha più) e diventa «al massimo quattro, una per forma»; al suo posto la prova
    dice la proprietà del meccanismo: **se una casella decorabile c'è, si decora** (e non se ne mettono più di
    quelle).
  - **J2, cosa ho potuto provare da qui:** che lo script **esce prima di toccare il database** quando mancano le
    variabili (`Variabili Supabase mancanti`, uscita 2 — su questa macchina non c'è `.env.local`), e la **sequenza
    con un client finto**: un tabellone cambiato ferma tutto **prima** di ogni upsert (nessuna scrittura: la prova
    controlla le chiamate fatte al finto client), `--force` arriva fino in fondo, un errore di lettura non scrive.
    Le **18 prove nuove** stanno in `scripts/lib/board-publish.test.ts` (12) e
    `scripts/lib/content-publish.test.ts` (6). Provato
    anche **a mano** che `pnpm board:freeze --force` **non** passa il flag allo script e `pnpm board:freeze --
--force` sì: per questo la scappatoia si scrive con il `--`.
  - **J3, cosa ho potuto provare:** niente di RLS/Realtime (servono due sessioni vere, e il database qui non c'è
    nemmeno in Docker). La migrazione è scritta sulla documentazione Supabase (Realtime Authorization:
    `realtime.topic()`, `realtime.messages.extension`, RLS già attiva su `realtime.messages`), le policy sono due e
    reversibili, e il client cambia di una riga (`private: true`). `pnpm check` e `pnpm build` verdi dicono solo che
    il codice compila: **il comportamento lo vedi tu**.
  - **Non verificato da me:** tutto J3 (RLS, Realtime, presenza, sincronia con due sessioni), e J2 contro un database
    vero (l'ordine delle scritture è provato con un client finto, non con Supabase).
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), sezione «Pacchetto J»: **J1** (la
  riga Inclinazione ≥ 18° su tutti i tabelloni, e guardare le scale che salgono di una fila), **J2** (il push che si
  ferma su un tabellone modificato, senza scrivere, e la scappatoia `-- --force`), **J3** (due sessioni vere: la
  presenza e le mosse con il canale privato, e come riconoscere una policy troppo stretta — l'elenco è scritto lì).
- **Decisioni Derivate aggiunte:** D-78 (un tabellone pubblicato è immutabile, e `content:push` lo fa rispettare:
  JSON canonico, controllo **prima** di ogni scrittura, uscita 3, `-- --force`) e D-79 (si entra nel canale della
  stanza solo con una sessione in quella stanza: due policy su `realtime.messages`, `realtime.topic()` contro
  `current_room_id()`). Aggiornati anche **D-73** e **D-74** con le risposte del proprietario (sulla riga della
  partita va solo l'id; la mascotte sta nella riga del giocatore di `SidePanel`). `docs/architecture.md` § Tempo
  reale, `docs/content.md` § Pubblicare i contenuti, `docs/design.md` § Tabellone (la soglia non manca più al
  generatore), `docs/roadmap.md` (F7-02, F3-05, F2-04, F0-06) e la voce «Ancora aperte» della presenza (che resta
  aperta: si chiude con la tua verifica).
- **La `classic` locale e quella sul remoto: analisi, non implementata (la decisione è tua).** Il tabellone è stato
  pubblicato una volta (F0-06, 2026-09-18) e **le decorazioni della `classic` sono state spostate dopo** (l'ultimo
  commit su `classic.ts` è `02f94ba`, il tuo, della correzione del bordo). Quindi oggi le due righe non coincidono, e
  il primo `content:push` con la regola nuova **si fermerà su `classic`**. Le due strade:
  1. **ripubblicare una volta con la scappatoia** (`set -a; source .env.remoto; set +a; pnpm content:push -- --force`),
     perché nessuna serata vera è ancora stata giocata: la riga remota non ha **storia da proteggere** (il diario di
     una partita vecchia è l'unica cosa che la regola difende, e non esiste);
  2. **un id nuovo** (`classic-2`): la regola vale dal primo giorno senza eccezioni, ma resta una riga `classic`
     inutilizzata sul remoto, e cambiano `defaultBoardId`, i riferimenti nei documenti e nei test — churn per
     proteggere una storia che non c'è.
     **Consiglio mio: la strada 1, una volta sola, e adesso.** La sequenza esatta, che non richiede né migrazioni né
     modifiche al codice:
  3. `set -a; source .env.remoto; set +a; pnpm content:push` — **aspettati il fermo** (uscita 3) con
     `• classic (Classico)`: è la conferma che il remoto è quello vecchio e che la regola funziona sul remoto;
  4. la stessa riga **con la scappatoia**: `pnpm content:push -- --force` — scrive il tabellone corrente e lo dice
     (`Riscritto con --force: classic`); domande e sfide si riallineano come sempre;
  5. rilanciare `pnpm content:push` **senza** flag: deve dire `1 già identici · nessuno riscritto` — è la prova che
     le due copie ora coincidono;
  6. da lì in poi la regola vale: se un giorno cambi la `classic`, il push si ferma e la scelta è fra `--force` (che
     sai cosa riscrive) e un id nuovo. Il momento buono è **prima della prima serata**: dopo, la strada 1 non è più
     gratuita.
     Una nota: la stanza vera sul remoto non esiste ancora (F0-06), quindi la finestra per farlo senza conseguenze è
     aperta fino alla prima partita giocata davvero.
- **Domande per il proprietario:**
  1. **La strada 1 o la 2** per riallineare la `classic` (sopra): io farei la 1, una volta, adesso.
  2. **Le decorazioni che calano ancora**: il seme 1 non ne ha più nessuna, e su 200 semi due casi restano senza
     forme. La soglia di 18° è tua e non la tocco; se ti dà noia vedere un tabellone senza decorazioni, le strade
     sono le stesse di prima (margine, cornice, decorare anche il bordo) — tutte di disegno.
  3. **`pnpm board:freeze 5 --pippo` crea una disposizione chiamata «--pippo»** (un flag digitato male diventa un
     nome). Non l'ho corretto — non è nel pacchetto: vuoi che rifiuti un nome che comincia con `-`?
  4. **L'interruttore «Allow public access»** di Realtime Settings sul progetto remoto (dashboard): senza quello
     spento la chiusura della presenza è **a metà**, perché un canale non privato con lo stesso topic resta
     raggiungibile. È l'ultimo pezzo che non passa da una migrazione.
- **Limiti noti / debito tecnico:**
  - la soglia di inclinazione è un vincolo del **generatore**, non del validatore: una disposizione scritta a mano
    (come la `classic`) può stare sotto i 18° senza che niente se ne accorga. La `classic` è a 18,4°, quindi il
    caso non si dà; se un giorno si scrivesse a mano una disposizione più piatta, il posto giusto per accorgersene
    è `validateBoard` (una riga, ma è una regola di `rules.md` e non di `design.md`: non l'ho preso io);
  - `content:push` confronta **tutto** il layout, nome compreso: un ritocco al solo nome di un tabellone già
    pubblicato ferma lo script, e per riallineare serve `--force` (o un id nuovo). È voluto — anche il nome entra
    nel diario — ma è una cosa da sapere prima di rinominare qualcosa;
  - le policy su `realtime.messages` sono le prime del progetto e non hanno test automatici: l'unica prova possibile
    è la tua con due sessioni (Registro J3). Se un giorno cambia il formato del topic (`room:<id>`), la policy e il
    client vanno cambiati **insieme**;
  - J1 non ha toccato le decorazioni del bordo né la cornice: il secondo punto delle domande è la conseguenza
    dichiarata, non un difetto da correggere da qui.

## Pacchetto K · Quello che serve per giocare davvero — 2026-09-18

Branch: `hermes/k-prima-serata` (da `main` a `5d408c2`) · Un commit per punto, ognuno con `pnpm check` verde prima
del commit e `pnpm build` verde prima del push, pushato subito: K4 (`2e92bbf`, due guardie), K2 (`b22a211`, la
scelta in lobby), K1 (`abd0c24`, la prova a due sessioni), K3 (`b965590`, il controllo dell'ambiente), più il
seguito di K2 e la documentazione. Niente merge in `main`. Nessun disegno, nessun colore, nessun `.riv`, nessuna
disposizione congelata, nessun testo delle domande toccato, nessuna ripubblicazione sul remoto (la `--force` sulla
`classic` la lanci tu).

- **Fatto:**
  - **K1 (F2-03, F2-04, D-79)** `[L]`: la prova a due sessioni è diventata **`pnpm check:realtime`**. Crea una
    stanza usa e getta con codice e password generati (`hashPassword`, nessun terminale), apre due sessioni
    anonime, le fa entrare una per posto con `joinRoom` (la funzione della route), le iscrive al canale privato
    **con la stessa configurazione del client** (`private: true`, presenza con la chiave del posto, gli stessi
    `postgres_changes` su `games` e `game_events`), fa giocare una **mossa vera** dal posto di turno con
    `applyAction` (la pipeline di `POST /api/games/[gameId]/actions`) e aspetta che l'**altra** sessione la
    riceva, con un tempo massimo. Poi tre cose: la presenza nei due sensi, che una **terza** sessione senza posto
    resti fuori dal canale privato, e che la stessa terza sessione **non veda nessuno** nemmeno aprendo un canale
    **pubblico** con lo stesso topic (è la metà che dipende dall'interruttore del dashboard). Pulisce sempre,
    anche quando fallisce — canali, utenti anonimi, `player_sessions`, `players`, partita e stanza — e **verifica**
    di aver pulito rileggendo la stanza. Esce 0 se tutto torna, 1 se no, 2 senza variabili.
  - **K2 (D-77)** `[L]`: la scelta del tabellone in lobby era già in `main` (la tua metà: la riga «Disposizione»,
    `boardId` nella scheda della serata); mancava **l'elenco che legge**. Ora `boards` in
    `src/content/boards/index.ts` è `[classic, ...frozenBoards]`: **congelare una disposizione è quello che la fa
    comparire in lobby**, senza toccare il codice. La riga compare solo quando c'è più di una disposizione
    (con una sola non è una scelta), e la lobby offre **solo le disposizioni pubblicate** — una congelata appena
    scritta e non ancora nel database sarebbe una scelta che porta a una partita che non si ridisegna. Due prove
    tengono il punto: la `classic` resta la prima (è `defaultBoardId`) e ogni congelata compare nell'elenco.
  - **K3 (F0-06)** `[L]`: **`pnpm check:ready`** — non `pnpm doctor`, perché `doctor` è un comando di pnpm e il
    nostro script non verrebbe mai eseguito (l'ho scoperto eseguendolo: stampava i controlli di pnpm, uscita 0).
    Sei domande in un comando: migrazioni applicate, accesso anonimo attivo, contenuti pubblicati e identici ai
    file (lo stesso confronto canonico di J2, sulle sole colonne che `content:push` scrive: `active` fuori,
    perché spegnere una domanda a mano non è una disallineatura), almeno una stanza con due posti, RLS (le tre
    prove con una sessione anonima vera), canale (che rimanda a `check:realtime` invece di fingere). Le migrazioni
    si controllano una per una provando gli oggetti che creano: una tabella si legge, una funzione si chiama con
    **argomenti finti e innocui** (un id che non esiste, quindi la funzione non trova nessuna riga e non scrive) —
    senza argomenti PostgREST direbbe «funzione inesistente» anche su un database sano. Una tabella in
    `scripts/lib/doctor.ts` associa ogni migrazione ai suoi oggetti, e **una prova confronta quella tabella con i
    file sul disco**: aggiungere una migrazione senza il suo controllo fa fallire `pnpm check`.
  - **K4 (F7-03, F0-06)**: le due guardie. `pnpm board:freeze 5 --pippo` ora **rifiuta** un nome che comincia con
    `-` («sembra un flag scritto male»), con gli spazi tagliati e il trattino in mezzo ancora ammesso; e
    `supabase/seed.sql` non può più restare indietro: il generatore è in `scripts/lib/seed.ts` (`seedSource()`) e
    un test lo confronta con il file su disco, quindi cambiare un contenuto senza `pnpm content:seed` fa fallire
    `pnpm check` invece di lasciare la disallineatura in giro fino al prossimo push.
- **Verificato da me, con i comandi e i risultati veri:**
  - `pnpm check` verde prima di ogni commit: **487 prove su 44 file** (erano 438 su 40 in `main`), `pnpm build`
    verde prima di ogni push, `prettier --check` pulito sui file toccati.
  - **Quello che ho potuto far girare dei due script nuovi:** senza variabili escono **2** con il messaggio sulle
    variabili mancanti; con un database irraggiungibile entrambi escono **1** dicendo «Il database non risponde»
    (`check:realtime`: «Creazione della stanza di prova fallita», con la riga della pulizia a «niente da pulire»).
    La prova di K1 è partita davvero, ha parlato con Supabase, ha fallito al primo passo e si è fermata pulita.
  - **I due resoconti che il prompt chiede** (cosa stampa `check:realtime` quando va bene e quando la policy è
    rotta), generati chiamando la funzione di diagnosi vera con quegli esiti — le righe, i rimedi e l'uscita sono
    quelli che lo script produrrebbe:
    - tutto a posto: `azione di prova` / `le mosse arrivano all'altro posto (ricevute in 187 ms dal posto che non
ha giocato)` / `presenza` / `canale chiuso a chi non è della stanza (rifiutata (CHANNEL_ERROR))` / `canale
pubblico con lo stesso topic (una terza sessione non vede nessuno)` / `pulizia` → **6 ok**, uscita 0;
    - **policy di lettura commentata** («mosse ferme», il caso che conta): `le mosse arrivano all'altro posto` →
      **KO «niente entro 15 s»** con il rimedio che dice _perché_ («sul canale `room:…` viaggiano mosse ed eventi
      E la presenza, quindi «non arriva niente» non è la presenza — è la partita a distanza»), `presenza` → KO con
      il rimedio che **rimanda alla riga sopra** invece di mandarti a caccia di `channel.track`, la riga del canale
      chiuso resta verde → **4 ok · 2 KO**, uscita 1;
    - **policy di invio commentata**: le mosse **arrivano** (riga verde con i millisecondi) e **solo la presenza**
      è rossa («è l'`insert` su realtime.messages con `extension = 'presence'`… oppure `channel.track`») → **5 ok
      · 1 KO**, uscita 1;
    - **canale pubblico aperto** (interruttore del dashboard ancora acceso): tutto verde tranne `canale pubblico
con lo stesso topic` → KO «una terza sessione vede 2 posti collegati», con il rimedio che nomina
      l'interruttore → **5 ok · 1 KO**, uscita 1.
  - **Non verificato da me, e va detto chiaro:** la prova **vera** di K1 — cioè un giro verde su un database vivo e
    i due rossi _osservati rompendo le policy_ — non l'ho girata: su questa macchina non c'è Docker né Supabase,
    quindi non ho potuto commentare una policy e farla applicare. Quelli qui sopra sono i resoconti che il codice
    produce per quelle situazioni, non rossi visti. Nel Registro («Pacchetto K», K1) ci sono i passi esatti per
    farla: quale policy commentare, cosa aspettarsi, e come rimettere a posto. Anche K3 non è mai girato verde:
    l'ho visto fermarsi bene su un database che non c'è.
  - K2 e K4 sono provati dai test che girano qui (compreso il confronto fra la tabella dei controlli delle
    migrazioni e i file sul disco) e dal percorso di uscita dei due script; la riga «Disposizione» in lobby con
    due disposizioni richiede due disposizioni congelate **e** pubblicate, quindi si guarda da te.
- **Da verificare in locale:** Registro di [local-testing.md](local-testing.md), sezione «Pacchetto K»: **K1** (i
  sei verdi, e i due rossi rompendo di proposito la policy di lettura e poi quella di invio: due rimedi diversi),
  **K2** (la riga che non c'è con una disposizione sola e che compare quando ne congeli una, la `Classica`
  preselezionata), **K3** (tutto verde, e il rosso unico con il database spento), **K4** (le due guardie).
- **La risposta alla domanda di K2 — una serata vecchia che punta a un `boardId` che non c'è più nell'elenco:**
  **regge, e non è un caso.** L'elenco `boards` è il **menù**; il tabellone di una serata lo legge `loadBoard` dal
  database **per id** (`games.settings.boardId` → `public.boards`), quindi togliere una disposizione dall'elenco
  non tocca le serate che l'hanno già usata: continuano a ridisegnare il loro tabellone e il diario resta quello
  che è stato giocato (è il motivo per cui D-77 ha scelto questa strada: solo l'id sulla riga, nessuna
  migrazione). Le due cose che ho comunque sistemato perché il caso non si veda: la lobby offre **solo le
  disposizioni pubblicate** (una congelata non ancora nel database non si può giocare, quindi non si offre), e se
  l'id sparisce **anche dal database** la pagina della partita lo dice con il nome dell'id mancante e il comando
  per ripubblicare, invece di dire «la partita non è ancora cominciata» — che era la risposta di prima ed era
  falsa. `pnpm check:ready` copre il caso intermedio: «contenuti · boards: 1 da pubblicare».
- **Decisioni Derivate aggiunte:** **D-80** (la prova che non si può fare in CI è uno script con un nome suo:
  `check:realtime` e `check:ready`, e il perché del nome) e **D-81** (`supabase/seed.sql` è generato e un test lo
  tiene allineato: la stessa idea del guard di J2, spostata al commit). Aggiornati anche **D-73** (le congelate
  ora entrano in lobby: era il pacchetto I a dire il contrario) e **D-77** (chiarimento: l'elenco offerto e il
  tabellone usato sono due cose diverse), più la voce «Ancora aperte» della presenza — che resta **aperta** e ora
  dice che la prova è `pnpm check:realtime`. `docs/architecture.md` (§ Tempo reale) e `docs/roadmap.md`.
- **Domande per il proprietario:**
  1. **Il nome del comando di K3**: `pnpm doctor` non si può usare (è di pnpm). Ho scelto `pnpm check:ready`; se
     preferisci `pnpm pronto` o altro, è una riga in `package.json` e il nome del file.
  2. **La lobby offre solo quello che è pubblicato**: se congeli una disposizione e non la pubblichi, non la vedi
     in lobby (e `check:ready` te lo dice). È la scelta che ho fatto per non offrire una partita che non si può
     ridisegnare; se preferisci vederla comunque e scoprire il problema solo al momento di giocare, si toglie il
     filtro.
  3. **`pnpm check:realtime` cancella anche gli utenti anonimi** che crea (tre per giro, con l'API di admin).
     Se preferisci lasciarli (sono righe in `auth.users` che si accumulano a ogni lancio), si toglie.
  4. **La riga della pulizia** è `warn` e non `KO` se qualcosa resta: la prova può essere verde anche se la stanza
     è rimasta. Se preferisci che una pulizia incompleta faccia uscire 1, è un `fail` invece di un `warn`.
- **Limiti noti / debito tecnico:**
  - **la prova di K1 non è mai girata verde** (non c'è Docker qui): è lo stato della voce «Presenza non protetta»,
    che resta aperta per questo. Il primo giro sul tuo database vale più di tutte le mie righe;
  - le due aspettative del Registro sui rossi di K1 (quale policy commentare → quale riga rossa) vengono dalla
    documentazione Supabase (una sessione con solo il permesso di scrittura entra nel canale ma non riceve) e non
    da una prova: se al primo giro il rosso arrivasse da un'altra riga, il Registro va corretto — e dimmelo;
  - `check:realtime` usa la scrittura dello stato **dal processo** (`applyAction`), non da HTTP: contro il remoto
    non c'è un server dell'applicazione da chiamare, quindi passa la stessa pipeline della route ma senza il giro
    HTTP. Vuol dire che la prova non copre il cookie di sessione né il `409`;
  - `pnpm check:ready` non può distinguere una migrazione che **rimpiazza** una funzione (`create or replace`) da
    quella originale: quelle due righe restano «a mano» e lo dicono;
  - il filtro della lobby sui tabelloni pubblicati aggiunge una lettura a ogni caricamento della lobby: se il
    database non risponde si offre la lista intera del codice (e la pagina della partita dirà cosa manca);
  - **`pnpm doctor` non esiste**: se un giorno lo cerchi fra gli script, il suo contenuto è `pnpm check:ready`.
