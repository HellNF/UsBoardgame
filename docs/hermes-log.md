# Rapporto di Hermes

Sezioni richieste da [HERMES.md](../HERMES.md) § 6: una per pacchetto, aggiunte in fondo.

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
