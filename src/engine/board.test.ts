import { describe, expect, it } from "vitest";
import { cellToCoord, coordToCell, rowOf } from "./board";

describe("griglia a serpentina", () => {
  it("la 1 è in basso a sinistra", () => {
    expect(cellToCoord(1)).toEqual({ row: 0, col: 0 });
  });

  it("la 11 sta sopra la 10, a destra", () => {
    expect(cellToCoord(10)).toEqual({ row: 0, col: 9 });
    expect(cellToCoord(11)).toEqual({ row: 1, col: 9 });
  });

  it("la 100 è in alto a sinistra", () => {
    expect(cellToCoord(100)).toEqual({ row: 9, col: 0 });
  });

  it("coordToCell è l'inverso di cellToCoord", () => {
    for (let n = 1; n <= 100; n++) {
      const { row, col } = cellToCoord(n);
      expect(coordToCell(row, col)).toBe(n);
    }
  });

  it("rowOf conta le file dal basso", () => {
    expect(rowOf(70)).toBe(7);
    expect(rowOf(71)).toBe(8);
  });

  it("rifiuta caselle fuori dal tabellone", () => {
    expect(() => cellToCoord(0)).toThrow(RangeError);
    expect(() => cellToCoord(101)).toThrow(RangeError);
  });
});
