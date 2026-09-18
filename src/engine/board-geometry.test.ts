import { describe, expect, it } from "vitest";

import { RULES } from "@/engine/config";
import { cellToCoord } from "@/engine/board";
import { isBorderCell } from "@/engine/board-geometry";

/**
 * `isBorderCell`: le caselle della cornice (D-65, terzo vincolo).
 *
 * La cornice del tabellone è spessa e si disegna dopo le decorazioni, quindi una decorazione su
 * una casella di bordo si fonde con lei. Questa funzione è la misura che il generatore usa per
 * tenerle fuori; il conto vero e proprio (quali caselle restano decorate) è in
 * `board-generator.test.ts`.
 */

describe("isBorderCell: la cornice del tabellone", () => {
  it("riconosce le quattro caselle d'angolo", () => {
    for (const cell of [1, 10, 91, 100]) expect(isBorderCell(cell)).toBe(true);
  });

  it("riconosce la prima e l'ultima fila, la prima e l'ultima colonna", () => {
    for (const cell of [2, 5, 11, 20, 21, 81, 90, 99]) expect(isBorderCell(cell)).toBe(true);
  });

  it("lascia dentro le caselle che non toccano il bordo", () => {
    for (const cell of [12, 22, 45, 55, 82, 89]) expect(isBorderCell(cell)).toBe(false);
  });

  it("coincide con la prima o l'ultima fila o colonna, su tutte le 100 caselle", () => {
    const borders: number[] = [];
    for (let cell = 1; cell <= RULES.board.cells; cell++) {
      const { row, col } = cellToCoord(cell);
      const expected = row === 0 || row === RULES.board.size - 1 || col === 0 || col === RULES.board.size - 1;
      expect(isBorderCell(cell)).toBe(expected);
      if (expected) borders.push(cell);
    }
    // 10 + 10 per le due file, più 8 + 8 per le colonne senza gli angoli già contati.
    expect(borders).toHaveLength(36);
  });
});
