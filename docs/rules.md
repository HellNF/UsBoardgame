# Regolamento canonico

Questa è la fonte di verità per chi implementa `src/engine`. Unisce [specs.md](specs.md) e
[decisions.md](decisions.md). Ogni numero è un parametro in `src/engine/config.ts` (`RULES`): qui è indicato
tra parentesi quadre, es. [`dice.count` = 2].

Se trovi un caso non coperto: non inventare. Scegli il comportamento più semplice, aggiungi una voce
**Derivata** in `decisions.md` e aggiorna questo file.

## Obiettivo

Vince chi ha più **stelle** a fine partita. A parità di stelle vince chi ha più **monete**; a parità di entrambe
è pareggio.

## Tabellone

- Griglia 10 × 10, caselle 1-100 a serpentina: la 1 in basso a sinistra, la 100 in alto a sinistra
  (`cellToCoord` in `src/engine/board.ts`).
- [`board.ladders` = 7] scale, [`board.snakes` = 6] serpenti.
- Quantità dei tipi di casella: domanda 35, sfida 12, imprevisto 10, monete 10, stella 3, libera 28, partenza 1,
  arrivo 1. Sono parametri in `RULES.board.cellCounts`: il validatore confronta la disposizione con questi numeri.

**Vincoli di una disposizione valida** (li controlla il validatore, task F1-01):

1. Esattamente 100 celle con `n` da 1 a 100; la 1 è `start`, la 100 è `finish`.
2. Quantità per tipo come sopra. Ogni casella `question` ha categoria e illustrazione coerenti.
3. Nessuna scala o serpente parte o arriva alla 1 o alla 100.
4. Nessuna casella è estremo di più di una scala o serpente (niente scala che finisce sulla testa di un serpente).
5. Scala: `to > from`; serpente: `to < from`; nessuno dei due resta nella stessa fila.
6. Nessun serpente con la testa nelle caselle 2-12 (non si può scendere appena partiti).

## Preparazione

1. Lobby: ognuno sceglie pedina e colore (diversi); si scelgono disposizione, categorie di sfida attive, durata
   massima di una sfida e posta in palio. Si parte quando entrambi sono pronti.
2. Le schede devono essere complete (alla prima partita). Vedi [D-28](decisions.md#d-28--schede-incomplete-dopo-laggiunta-di-domande).
3. Il server sorteggia chi inizia (`firstSeat`). Entrambi partono dalla casella 1 con 0 monete, 0 stelle e 0 oggetti.

## Turno

Il turno appartiene a `state.turn`. Solo il giocatore di turno agisce, tranne quando la carta attiva richiede
l'altro (giudizio, duello, doppia conferma).

### 1. Prima del tiro (`phase = "pre_roll"`)

- **Comprare oggetti** (`BUY_ITEM`): anche più di uno, se si hanno le monete e meno di [`items.max` = 3] oggetti.
- **Usare un oggetto attivo** (`USE_ITEM`): al massimo uno per turno. Sono attivi: Dado singolo, Dado truccato,
  Scala portatile, Ladro, Scambio. Antidoto e Salta domanda sono reattivi (vedi Oggetti) e non occupano lo slot
  dell'oggetto attivo del turno ([D-37](decisions.md#d-37--salta-domanda-consuma-loggetto-senza-occupare-il-turno)).
- **Tirare** (`ROLL`).

### 2. Tiro

- Si tirano [`dice.count` = 2] dadi da 6 (uno solo con Dado singolo; con Dado truccato un dado vale il numero
  scelto, 1-6).
- **Rimonta:** se al momento del tiro l'altro è avanti di almeno [`comeback.minGap` = 20] caselle, +[`comeback.bonus` = 2].
- Nuova posizione = `min(100, posizione + totale)`.
- Se si arriva alla 100 → vedi Fine partita; nessun effetto di casella.

### 3. Effetto della casella d'arrivo

| Casella         | Effetto                                                                              |
| --------------- | ------------------------------------------------------------------------------------ |
| `question`      | Carta domanda (vedi Domande).                                                        |
| `challenge`     | Carta sfida pescata tra le categorie attive e entro la durata massima (vedi Sfide).  |
| `event`         | Carta imprevisto a caso (vedi Imprevisti).                                           |
| `coins`         | `gain`: +[`coins.cellGain` = 3]; `loss`: −[`coins.cellLoss` = 2].                    |
| `star`          | Se si hanno ≥ [`stars.price` = 10] monete, offerta facoltativa di comprare 1 stella. |
| `free`, `start` | Nessun effetto.                                                                      |

Sulla casella stella senza monete a sufficienza l'offerta non compare e la casella non ha effetto
([D-35](decisions.md#d-35--lofferta-della-stella-appare-solo-con-le-monete-in-mano)).

### 4. Scala o serpente

Si applica solo se il giocatore è **ancora sulla casella d'arrivo** del tiro (un imprevisto che lo sposta annulla
il controllo, [D-11](decisions.md#d-11--nessuna-reazione-a-catena)).

- **Base di una scala:** domanda "quanto mi conosci" della categoria della casella (se la casella non è una domanda,
  categoria a caso). Giusta → si sale in cima (e si prendono le monete del verdetto). "Quasi" → 1 moneta, non si sale.
  Sbagliata → si resta. Se la casella era già una domanda, **è la stessa domanda** ([D-07](decisions.md#d-07--casella-domanda--base-di-scala--una-sola-domanda)).
- **Testa di un serpente:**
  - con un Antidoto: si consuma e si resta;
  - altrimenti **sfida lampo** di [`challenges.snakeFlashSeconds` = 30] s (carta con `snakeFlash: true`):
    se il giocatore è dichiarato vincente resta dov'è (+1 sfida vinta, nessuna moneta), altrimenti scende alla coda
    (vale anche se la sfida è pareggio o scade: [D-36](decisions.md#d-36--prova-senza-riuscita-nessun-premio-a-nessuno)).

### 5. Fine del turno

Il turno passa all'altro. Quando hanno giocato entrambi, il round aumenta di 1. A fine round si controlla la fine
partita.

## Domande

- **Chi risponde:** il giocatore di turno, sull'altro (l'"interrogato").
- **Cosa si pesca su una casella domanda:** categoria dell'illustrazione; con probabilità
  [`questions.knowMeRatio` = 0,6] una "quanto mi conosci" (`multiple`/`short`), altrimenti una aperta (`open`).
  Se il sottoinsieme scelto è vuoto si usa l'altro.
- **Solo domande pescabili:** le "quanto mi conosci" a cui l'interrogato ha risposto nella scheda.
- **Livelli:** solo per la categoria `deep`, livello massimo 1 nelle caselle 1-30, 2 nelle 31-70, 3 nelle 71-100;
  si preferisce il livello massimo consentito e si scende se esaurito.
- **Niente ripetizioni:** le "quanto mi conosci" sono tracciate per posto, le aperte per coppia; a mazzo esaurito il
  registro di quel sottoinsieme si azzera.

| Tipo       | Flusso                                                                              | Monete                                  | Conta per Sapientone |
| ---------- | ----------------------------------------------------------------------------------- | --------------------------------------- | -------------------- |
| `multiple` | Il giocatore sceglie un'opzione → il server la confronta con la scheda              | [`coins.multipleCorrect` = 3] se giusta | Sì se giusta         |
| `short`    | Il giocatore scrive la risposta → l'interrogato giudica: giusta / quasi / sbagliata | 3 / [`coins.shortAlmost` = 1] / 0       | Solo "giusta"        |
| `open`     | Si discute in videochiamata, poi si conferma                                        | sempre [`coins.openQuestion` = 1]       | No                   |

**Salta domanda:** si usa quando la carta è visibile e prima di rispondere; la carta si chiude senza monete né
penalità (e senza salita, se era per una scala). Serve l'oggetto omonimo, che si consuma
([D-37](decisions.md#d-37--salta-domanda-consuma-loggetto-senza-occupare-il-turno)).

## Sfide

Ogni carta: nome, categoria, modalità, verdetto, durata, istruzioni, premio (`src/content/challenges.ts`).

| Modalità | Chi gioca                  | Verdetto ammesso                                     | Chi vince                     |
| -------- | -------------------------- | ---------------------------------------------------- | ----------------------------- |
| `duel`   | Entrambi                   | `automatic` (minigioco integrato) o `double_confirm` | Il vincitore prende il premio |
| `trial`  | Solo il giocatore di turno | `judge` (l'altro dichiara riuscita o fallita)        | Se riesce prende il premio    |

- **Pareggio:** nessun premio. I minigiochi integrati ripartono automaticamente (rivincita).
- **Doppia conferma:** entrambi dichiarano il vincitore (`CLAIM_CHALLENGE_RESULT`). Se coincidono vale.
  Se no, entrambi scelgono rivincita o moneta (`RESOLVE_DISPUTE`); se scelgono in modo diverso decide la moneta.
- **Prova:** l'altro dichiara la riuscita di chi ha giocato. Solo la riuscita dà il premio, che va sempre e solo a
  chi ha giocato ([D-36](decisions.md#d-36--prova-senza-riuscita-nessun-premio-a-nessuno)).
- **Timer:** il server fissa `deadlineAt` (durata massima della carta, entro il massimo della serata:
  [D-33](decisions.md#d-33--timer-e-rivincita-delle-sfide)); alla scadenza di una prova senza verdetto la prova è
  fallita; di un duello si passa alla doppia conferma (e il minigioco, se c'era, si abbandona).
- **Vittorie:** ogni sfida vinta (compresa la lampo) incrementa `challengesWon`.
- **Emulatore DS:** sfida "a punteggio" sullo stesso livello; vince il tempo migliore; doppia conferma. Nessun
  file di gioco passa dal server.

## Minigiochi integrati

Sono moduli puri in `src/engine/minigames` (`init`, `applyMove`, `result`), mossi dall'azione `MINIGAME_MOVE`.
Muove per primo chi ha pescato la carta; il pareggio fa ripartire il minigioco
([D-39](decisions.md#d-39--dettagli-dei-minigiochi-integrati)).

| Minigioco | Come si vince                    | Pareggio             |
| --------- | -------------------------------- | -------------------- |
| Tris      | tre pedine in fila (3 × 3)       | rivincita automatica |
| Forza 4   | quattro pedine allineate (7 × 6) | rivincita automatica |
| Memory    | più coppie trovate con 12 carte  | rivincita automatica |

## Economia

- **Monete doppie:** ogni **guadagno** ottenuto mentre si è in una casella ≥ [`doubleCoinsFrom` = 71] vale doppio
  (anche premi di sfida e monete delle domande, compreso il "quasi"). Le perdite non raddoppiano, e nemmeno i
  trasferimenti fra i due giocatori (Regalo, Ladro) e il prezzo della stella
  ([D-34](decisions.md#d-34--il-raddoppio-vale-solo-per-i-guadagni-del-gioco)).
- **Mai sotto zero:** perdite, Ladro e Regalo tolgono al massimo le monete disponibili.
- **Stella:** 1 per atterraggio su casella stella, al prezzo di [`stars.price` = 10], facoltativa.

## Oggetti

Massimo [`items.max` = 3]. Al quarto oggetto (Tesoro) si sceglie quale scartare, anche quello nuovo.

| Oggetto         | Prezzo | Tipo     | Effetto                                                                                                                                  |
| --------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Dado singolo    | 3      | attivo   | Il prossimo tiro usa un solo dado.                                                                                                       |
| Dado truccato   | 8      | attivo   | Scegli il valore di un dado (1-6); l'altro si tira.                                                                                      |
| Salta domanda   | 4      | reattivo | Chiude una carta domanda senza penalità.                                                                                                 |
| Antidoto        | 7      | reattivo | Si consuma da solo sul prossimo serpente: non si scende.                                                                                 |
| Scala portatile | 12     | attivo   | Vai in cima alla scala con la base più vicina davanti a te (nessun effetto, nessuna domanda), poi tiri. Se non ce n'è, non si può usare. |
| Ladro           | 6      | attivo   | Prendi [`items.thiefAmount` = 5] monete all'altro (al massimo quelle che ha).                                                            |
| Scambio         | 10     | attivo   | Scambiate le posizioni; nessun effetto per nessuno.                                                                                      |

## Imprevisti

Pescati a caso con uguale probabilità. Nessuno spostamento attiva effetti, scale o serpenti.

| Carta               | Effetto                                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| Vento a favore      | Avanti di [`events.tailwindSteps` = 5] (arrivare a 100 conta come arrivo).         |
| Sentiero sbagliato  | Indietro di [`events.wrongPathSteps` = 5], minimo 1.                               |
| Regalo              | L'altro ti dà [`events.giftCoins` = 3] monete (al massimo quelle che ha).          |
| Tesoro              | Ricevi un oggetto a caso.                                                          |
| Serpente improvviso | Vai alla coda del serpente con la testa più vicina dietro di te, se c'è.           |
| Scala fortunata     | Vai in cima alla scala con la base più vicina davanti a te, se c'è, senza domanda. |
| Pausa ghiotta       | Pausa di [`events.snackBreakSeconds` = 120] s, nessun effetto.                     |

## Fine partita

- Quando un giocatore raggiunge o supera la 100 (con il tiro o con uno spostamento speciale) si segna
  `finishedAtRound`. Le [`stars.finishBonus` = 3] stelle dell'arrivo vanno solo al **primo** che raggiunge la 100
  ([D-38](decisions.md#d-38--le-stelle-dellarrivo-vanno-solo-al-primo-che-raggiunge-la-100)).
- Il round in corso si completa ([D-05](decisions.md#d-05--si-completa-il-round)): chi ha già finito salta il turno
  ([D-40](decisions.md#d-40--chi-ha-già-finito-non-gioca-più-nel-round)).
- La partita finisce a fine round se qualcuno ha raggiunto la 100, oppure dopo [`maxRounds` = 25] round completi.
- **Stelle bonus**, rivelate una alla volta:
  - Sapientone (+[`stars.knowItAllBonus` = 1]): più `correctAnswers`;
  - Campione (+[`stars.championBonus` = 1]): più `challengesWon`;
  - in caso di pareggio la stella non va a nessuno.
- Vincitore: più stelle → più monete → pareggio. Si mostra la posta in palio.
