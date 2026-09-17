import { describe, expect, it } from "vitest";
import {
  cellToCoord,
  clampCell,
  coordToCell,
  ladderAt,
  nearestLadderAhead,
  nearestSnakeHeadBehind,
  rowOf,
  snakeAt,
} from "./board";
import type { BoardLayout } from "./types";

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

  it("clampCell riporta dentro il tabellone", () => {
    expect(clampCell(0)).toBe(1);
    expect(clampCell(101)).toBe(100);
    expect(clampCell(42)).toBe(42);
  });
});

describe("scale e serpenti (helper)", () => {
  const board: BoardLayout = {
    id: "mini",
    name: "Mini",
    cells: [],
    ladders: [
      { from: 8, to: 30 },
      { from: 48, to: 70 },
    ],
    snakes: [
      { from: 15, to: 4 },
      { from: 92, to: 72 },
    ],
    decorations: [],
  };

  it("ladderAt trova la scala con la base nella casella", () => {
    expect(ladderAt(board, 8)).toEqual({ from: 8, to: 30 });
    expect(ladderAt(board, 9)).toBeNull();
  });

  it("snakeAt trova il serpente con la testa nella casella", () => {
    expect(snakeAt(board, 92)).toEqual({ from: 92, to: 72 });
    expect(snakeAt(board, 72)).toBeNull();
  });

  it("nearestLadderAhead cerca solo davanti, la più vicina", () => {
    expect(nearestLadderAhead(board, 10)).toEqual({ from: 48, to: 70 });
    expect(nearestLadderAhead(board, 8)).toEqual({ from: 48, to: 70 });
    expect(nearestLadderAhead(board, 90)).toBeNull();
  });

  it("nearestSnakeHeadBehind cerca solo dietro, la più vicina", () => {
    expect(nearestSnakeHeadBehind(board, 90)).toEqual({ from: 15, to: 4 });
    expect(nearestSnakeHeadBehind(board, 40)).toEqual({ from: 15, to: 4 });
    expect(nearestSnakeHeadBehind(board, 15)).toBeNull();
  });
});
