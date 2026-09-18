import { elementFootprints, type CrossedOptions } from "./board-geometry";
import { RULES } from "./config";
import type { BoardLayout, CellNumber } from "./types";

/**
 * Il budget di leggibilità di una disposizione (F7-02, pacchetto I).
 *
 * Due numeri, uno per tipo: **quante caselle** possono avere più di una linea sopra (gli incroci) e
 * **quante linee** al massimo possono passare sulla stessa casella. Sopra quei tetti il tabellone
 * diventa illeggibile: dove due neri si sovrappongono, il numero della casella e il simbolo
 * spariscono — è la stessa ragione per cui una decorazione non si mette dove passa una scala
 * (D-65), portata alle linee fra loro.
 *
 * La misura è **l'inchiostro intero**: una linea è «sopra» una casella quando la sua forma
 * disegnata la tocca, anche solo di lato. Si conta con gli stessi ingombri e la stessa funzione del
 * disegno (`cellsAlongPath` di `board-geometry`, D-70): niente geometria nuova, niente seconda
 * verità. Il valore di partenza è quello che il proprietario ha contato sulla `classic` e sta in
 * `RULES.board` (`maxCrossings`, `maxLinesPerCell`); il conto della `classic` con questa stessa
 * misura è nel log del pacchetto I, insieme alla differenza fra i due numeri.
 */

/** I due tetti, in caselle con più di una linea e in linee sulla stessa casella. */
export type ReadabilityBudget = {
  crossings: number;
  linesPerCell: number;
};

/** Il budget in vigore: i due tetti di `RULES.board`. */
export const READABILITY_BUDGET: ReadabilityBudget = {
  crossings: RULES.board.maxCrossings,
  linesPerCell: RULES.board.maxLinesPerCell,
};

/** Il conto corrente: quante linee passano su ogni casella. */
export type ReadabilityState = {
  linesByCell: Map<CellNumber, number>;
  /** Quante caselle hanno più di una linea. */
  crossings: number;
  /** Il massimo di linee su una casella. */
  linesPerCell: number;
};

/** Il conto vuoto: nessuna linea piazzata. */
export function readabilityState(): ReadabilityState {
  return { linesByCell: new Map(), crossings: 0, linesPerCell: 0 };
}

/**
 * Aggiunge una linea al conto **se il budget la regge**, e dice se l'ha aggiunta.
 *
 * È il cuore del piazzamento (I2): si prova un candidato sul conto corrente e, se porterebbe il
 * tabellone oltre il tetto, lo si rifiuta senza aver toccato niente — il generatore pesca il
 * candidato successivo. Il conto si aggiorna una linea alla volta, quindi non si ricalcola il
 * tabellone intero a ogni tentativo.
 */
export function addLine(
  state: ReadabilityState,
  cells: Iterable<CellNumber>,
  budget: ReadabilityBudget = READABILITY_BUDGET,
): boolean {
  let crossingsAdded = 0;
  for (const cell of cells) {
    const lines = (state.linesByCell.get(cell) ?? 0) + 1;
    if (lines > budget.linesPerCell) return false;
    if (lines === 2) crossingsAdded++;
  }
  if (state.crossings + crossingsAdded > budget.crossings) return false;

  for (const cell of cells) {
    const lines = (state.linesByCell.get(cell) ?? 0) + 1;
    state.linesByCell.set(cell, lines);
    if (lines > state.linesPerCell) state.linesPerCell = lines;
  }
  state.crossings += crossingsAdded;
  return true;
}

/** Il conto di una disposizione (o di una parte: scale e serpenti sono già abbastanza). */
export type ReadabilityMeasure = ReadabilityState;

/**
 * Misura una disposizione: incroci, massimo di linee su una casella, e il dettaglio per casella.
 *
 * Con `options.inset` si può ritirare la casella prima di misurare (come fanno le decorazioni, che
 * stanno dentro un margine di 12 unità); di partenza la misura è quella dell'inchiostro intero.
 */
export function measureReadability(
  board: Pick<BoardLayout, "ladders" | "snakes">,
  options: CrossedOptions = {},
): ReadabilityMeasure {
  const state = readabilityState();
  for (const { cells } of elementFootprints(board, options)) {
    addLine(state, cells, { crossings: Number.POSITIVE_INFINITY, linesPerCell: Number.POSITIVE_INFINITY });
  }
  return state;
}

/** Vero se il conto sta dentro il budget. */
export function fitsBudget(measure: Pick<ReadabilityMeasure, "crossings" | "linesPerCell">, budget: ReadabilityBudget): boolean {
  return measure.crossings <= budget.crossings && measure.linesPerCell <= budget.linesPerCell;
}

/** Il budget in una riga, come si legge nei rapporti e nelle pagine di sviluppo. */
export function describeBudget(budget: ReadabilityBudget): string {
  return `${budget.crossings} incroci, ${budget.linesPerCell} linee per casella`;
}
