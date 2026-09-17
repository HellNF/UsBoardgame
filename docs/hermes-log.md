# Rapporto di Hermes

Sezioni richieste da [HERMES.md](../HERMES.md) § 6: una per pacchetto, aggiunte in fondo.

> Nota di merge: le sezioni del **pacchetto A** sono in `docs/hermes-log.md` del branch `hermes/a-engine`, che ha
> creato questo file per primo. Al merge dei due branch tenere entrambe le sezioni.

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
