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

Branch: hermes/e-ui-fix (partito da `main` a 9f4477d: `main` conteneva già i pacchetti A, B e C) · Ultimo commit:
<da riempire>

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
