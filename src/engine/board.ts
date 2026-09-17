import { RULES } from "./config";
import type { CellNumber } from "./types";

/**
 * Coordinate di una casella sulla griglia a serpentina.
 * Riga 0 = fila in basso (1-10, da sinistra a destra), riga 9 = fila in alto
 * (91-100, da destra a sinistra: la 100 è in alto a sinistra).
 * `col` 0 = colonna di sinistra.
 */
export function cellToCoord(n: CellNumber): { row: number; col: number } {
  const size = RULES.board.size;
  if (!Number.isInteger(n) || n < 1 || n > RULES.board.cells) {
    throw new RangeError(`Casella fuori dal tabellone: ${n}`);
  }
  const row = Math.floor((n - 1) / size);
  const offset = (n - 1) % size;
  const col = row % 2 === 0 ? offset : size - 1 - offset;
  return { row, col };
}

/** Inverso di `cellToCoord`. */
export function coordToCell(row: number, col: number): CellNumber {
  const size = RULES.board.size;
  const offset = row % 2 === 0 ? col : size - 1 - col;
  return row * size + offset + 1;
}

/** Fila (1-10) di una casella, dal basso. */
export const rowOf = (n: CellNumber): number => cellToCoord(n).row + 1;

export const clampCell = (n: number): CellNumber => Math.min(RULES.board.cells, Math.max(1, n));
