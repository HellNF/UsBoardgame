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
