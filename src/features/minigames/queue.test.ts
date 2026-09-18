import { describe, expect, it } from "vitest";

import type { ConnectFourState, MemoryState, QuizState, TicTacToeState } from "@/engine";
import {
  MEMORY_FIRST_CARD_MS,
  MEMORY_PAIR_MS,
  MEMORY_PEEK_MS,
  MINIGAME_STEP_MS,
  enteringCells,
  revealDelay,
} from "./queue";

const tris = (board: (1 | 2 | null)[], turn: 1 | 2 = 2): TicTacToeState => ({
  kind: "tic-tac-toe",
  board,
  turn,
  winner: null,
});

const emptyFour = (): (1 | 2 | null)[][] => Array.from({ length: 6 }, () => Array(7).fill(null));

const four = (board: (1 | 2 | null)[][]): ConnectFourState => ({
  kind: "connect-four",
  board,
  turn: 2,
  winner: null,
});

const memory = (revealed: number[], matched = Array(12).fill(false)): MemoryState => ({
  kind: "memory",
  cards: [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5],
  revealed,
  matched,
  pairs: { 1: 0, 2: 0 },
  turn: 2,
  winner: null,
});

describe("minigiochi: quali caselle si animano (F2-05)", () => {
  it("il primo stato non anima niente: non c'è una scena da cui venire", () => {
    expect(enteringCells(null, tris([1, null, null, null, null, null, null, null, null]))).toEqual([]);
  });

  it("tris: si anima solo la casella riempita adesso", () => {
    const before = tris([1, null, null, null, null, null, null, null, null]);
    const after = tris([1, null, 2, null, null, null, null, null, null]);
    expect(enteringCells(before, after)).toEqual([2]);
    // Nessun cambiamento (una rigiocata dello stesso stato): niente da animare.
    expect(enteringCells(after, tris([1, null, 2, null, null, null, null, null, null]))).toEqual([]);
  });

  it("forza 4: la pedina che cade è `riga * colonne + colonna`, con la riga 0 in basso", () => {
    const empty = emptyFour();
    const first = emptyFour();
    first[0][3] = 1;
    expect(enteringCells(four(empty), four(first))).toEqual([3]);

    // Seconda pedina nella stessa colonna: riga 1, colonna 3 → 1 * 7 + 3.
    const second = emptyFour();
    second[0][3] = 1;
    second[1][3] = 2;
    expect(enteringCells(four(first), four(second))).toEqual([10]);
  });

  it("memory: si anima la carta che si gira, non quelle che si richiudono", () => {
    expect(enteringCells(memory([]), memory([4]))).toEqual([4]);
    expect(enteringCells(memory([4]), memory([4, 9]))).toEqual([9]);
    // Coppia sbagliata: la mossa dopo richiude le due carte e ne gira una nuova.
    expect(enteringCells(memory([4, 9]), memory([7]))).toEqual([7]);
    // Coppia giusta: le due carte restano scoperte (abbiinate), quindi nessuna si rigira.
    const matched = Array(12).fill(false);
    matched[4] = true;
    matched[9] = true;
    expect(enteringCells(memory([4, 9]), memory([], matched))).toEqual([]);
  });

  it("quiz e riflessi non hanno caselle da animare", () => {
    const quiz: QuizState = {
      kind: "quiz",
      items: [{ question: "?", options: ["a", "b"], correct: 0 }],
      index: 0,
      turn: 1,
      scores: { 1: 0, 2: 0 },
      winner: null,
    };
    expect(enteringCells(quiz, quiz)).toEqual([]);
    expect(enteringCells(memory([]), quiz)).toEqual([]);
  });
});

describe("minigiochi: quanto aspettare prima della scena successiva (F2-05)", () => {
  it("i giochi a turni aspettano che l'animazione precedente sia finita", () => {
    const before = tris([1, null, null, null, null, null, null, null, null]);
    const after = tris([1, 2, null, null, null, null, null, null, null]);
    expect(revealDelay(before, after)).toBe(MINIGAME_STEP_MS);
  });

  it("memory: la prima carta del turno si legge prima che arrivi la seconda", () => {
    expect(revealDelay(memory([]), memory([4]))).toBe(MEMORY_FIRST_CARD_MS);
    expect(revealDelay(memory([4]), memory([4, 9]))).toBe(MEMORY_PAIR_MS);
  });

  it("memory: la coppia sbagliata resta scoperta prima di richiudersi", () => {
    // Le due carte scoperte stanno per sparire: è l'occhiata da concedere.
    expect(revealDelay(memory([4, 9]), memory([7]))).toBe(MEMORY_PEEK_MS);
    expect(revealDelay(memory([4, 9]), memory([]))).toBe(MEMORY_PEEK_MS);
  });
});
