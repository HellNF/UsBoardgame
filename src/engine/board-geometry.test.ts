import { describe, expect, it } from "vitest";

import { RULES } from "@/engine/config";
import { cellToCoord } from "@/engine/board";
import { elementAngle, isBorderCell } from "@/engine/board-geometry";

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

/**
 * `elementAngle`: l'inclinazione di una linea, in gradi sull'orizzontale (docs/design.md § Tabellone).
 *
 * È la misura della soglia minima del generatore (`RULES.board.minAngleDegrees`): l'angolo fra i
 * centri delle due caselle, quello che si legge guardando il tabellone. Qui si provano i casi
 * notevoli e il numero da cui viene la soglia.
 */
describe("elementAngle: quanto sale una linea", () => {
  it("la linea più piatta della classic è la scala 51→67, 18,4°", () => {
    expect(elementAngle(51, 67)).toBeGreaterThanOrEqual(RULES.board.minAngleDegrees);
    expect(elementAngle(51, 67)).toBeCloseTo(18.43, 1);
  });

  it("una fila e una colonna è 45°, una fila e nove colonne è 6,3°", () => {
    // 1 è (riga 0, colonna 0), 19 è (riga 1, colonna 1), 11 è (riga 1, colonna 9).
    expect(cellToCoord(1)).toEqual({ row: 0, col: 0 });
    expect(cellToCoord(19)).toEqual({ row: 1, col: 1 });
    expect(elementAngle(1, 19)).toBeCloseTo(45, 1);
    expect(cellToCoord(11)).toEqual({ row: 1, col: 9 });
    expect(elementAngle(1, 11)).toBeCloseTo(6.34, 1);
  });

  it("nella stessa fila è zero, nella stessa colonna è 90", () => {
    expect(elementAngle(1, 2)).toBeCloseTo(0, 5);
    expect(elementAngle(20, 21)).toBeCloseTo(90, 5);
  });

  it("non dipende dal verso: da una casella all'altra o viceversa è lo stesso angolo", () => {
    expect(elementAngle(51, 67)).toBeCloseTo(elementAngle(67, 51), 5);
    expect(elementAngle(2, 98)).toBeCloseTo(elementAngle(98, 2), 5);
  });
});
