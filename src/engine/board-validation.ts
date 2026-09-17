import { rowOf } from "./board";
import { RULES } from "./config";
import type { BoardLayout, CellKind } from "./types";

/**
 * Validatore dei vincoli di una disposizione (docs/rules.md § Tabellone, task F1-01).
 * Funzione pura: la usano i test, `pnpm content:seed` e (in futuro) il generatore casuale.
 */

export type BoardValidation = { ok: true } | { ok: false; errors: string[] };

const allEndpoints = (board: BoardLayout): { cell: number; what: string }[] => [
  ...board.ladders.flatMap(({ from, to }) => [
    { cell: from, what: `base della scala ${from}→${to}` },
    { cell: to, what: `cima della scala ${from}→${to}` },
  ]),
  ...board.snakes.flatMap(({ from, to }) => [
    { cell: from, what: `testa del serpente ${from}→${to}` },
    { cell: to, what: `coda del serpente ${from}→${to}` },
  ]),
];

export function validateBoard(board: BoardLayout): BoardValidation {
  const errors: string[] = [];

  // 1. Esattamente 100 celle con n da 1 a 100; la 1 è `start`, la 100 è `finish`.
  if (board.cells.length !== RULES.board.cells) {
    errors.push(`Servono ${RULES.board.cells} celle, trovate ${board.cells.length}.`);
  }
  board.cells.forEach((cell, index) => {
    if (cell.n !== index + 1) {
      errors.push(
        `La cella in posizione ${index + 1} ha numero ${cell.n}: i numeri devono essere in ordine da 1 a 100.`,
      );
    }
  });
  const byNumber = new Map(board.cells.map((cell) => [cell.n, cell]));
  if (byNumber.get(1)?.kind !== "start") errors.push("La casella 1 deve essere di tipo `start`.");
  if (byNumber.get(100)?.kind !== "finish") errors.push("La casella 100 deve essere di tipo `finish`.");

  // 2. Quantità per tipo; ogni casella `question` ha categoria e illustrazione coerenti.
  const counts = new Map<CellKind, number>();
  for (const cell of board.cells) {
    counts.set(cell.kind, (counts.get(cell.kind) ?? 0) + 1);
    if (cell.kind === "question") {
      if (!cell.category) errors.push(`La casella ${cell.n} è una domanda senza categoria.`);
      if (!cell.illustration) errors.push(`La casella ${cell.n} è una domanda senza illustrazione.`);
    }
    if (cell.kind === "star" && !cell.illustration) {
      errors.push(`La casella ${cell.n} è una stella senza illustrazione.`);
    }
    if (cell.kind === "coins" && cell.sign !== "gain" && cell.sign !== "loss") {
      errors.push(`La casella ${cell.n} è una casella monete senza segno.`);
    }
  }
  for (const [kind, expected] of Object.entries(RULES.board.cellCounts) as [CellKind, number][]) {
    const found = counts.get(kind) ?? 0;
    if (found !== expected) errors.push(`Caselle di tipo \`${kind}\`: attese ${expected}, trovate ${found}.`);
  }

  // 3. Nessuna scala o serpente parte o arriva alla 1 o alla 100.
  for (const { cell, what } of allEndpoints(board)) {
    if (cell === 1 || cell === 100) errors.push(`${what}: non si può toccare la casella ${cell}.`);
    if (cell < 1 || cell > RULES.board.cells) errors.push(`${what}: casella fuori dal tabellone.`);
  }

  // 4. Nessuna casella è estremo di più di una scala o serpente.
  const seen = new Map<number, string>();
  for (const { cell, what } of allEndpoints(board)) {
    const previous = seen.get(cell);
    if (previous) errors.push(`La casella ${cell} è estremo di due elementi: ${previous} e ${what}.`);
    else seen.set(cell, what);
  }

  // 5. Scala: `to > from`; serpente: `to < from`; nessuno dei due resta nella stessa fila.
  for (const { from, to } of board.ladders) {
    if (!(to > from)) errors.push(`Scala ${from}→${to}: la cima deve essere più avanti della base.`);
    if (rowOf(from) === rowOf(to))
      errors.push(`Scala ${from}→${to}: resta nella stessa fila (${rowOf(from)}).`);
  }
  for (const { from, to } of board.snakes) {
    if (!(to < from)) errors.push(`Serpente ${from}→${to}: la coda deve essere più indietro della testa.`);
    if (rowOf(from) === rowOf(to))
      errors.push(`Serpente ${from}→${to}: resta nella stessa fila (${rowOf(from)}).`);
  }

  // 5-bis. Scala e serpente coprono al massimo `maxSpanRows` file (docs/rules.md § Tabellone).
  for (const { from, to } of board.ladders) {
    const span = Math.abs(rowOf(to) - rowOf(from));
    if (span > RULES.board.maxSpanRows) {
      errors.push(`Scala ${from}→${to}: copre ${span} file, il massimo è ${RULES.board.maxSpanRows}.`);
    }
  }
  for (const { from, to } of board.snakes) {
    const span = Math.abs(rowOf(to) - rowOf(from));
    if (span > RULES.board.maxSpanRows) {
      errors.push(`Serpente ${from}→${to}: copre ${span} file, il massimo è ${RULES.board.maxSpanRows}.`);
    }
  }

  // 6. Nessun serpente con la testa nelle caselle 2-12.
  for (const { from } of board.snakes) {
    if (from >= 2 && from <= 12) errors.push(`Serpente con la testa in ${from}: vietato fra la 2 e la 12.`);
  }

  // Quantità dichiarate in RULES.
  if (board.ladders.length !== RULES.board.ladders) {
    errors.push(`Scale: attese ${RULES.board.ladders}, trovate ${board.ladders.length}.`);
  }
  if (board.snakes.length !== RULES.board.snakes) {
    errors.push(`Serpenti: attesi ${RULES.board.snakes}, trovate ${board.snakes.length}.`);
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/** Come `validateBoard`, ma lancia con tutti gli errori: comodo in test e negli script. */
export function assertValidBoard(board: BoardLayout): void {
  const result = validateBoard(board);
  if (!result.ok) {
    throw new Error(`Disposizione \`${board.id}\` non valida:\n- ${result.errors.join("\n- ")}`);
  }
}
