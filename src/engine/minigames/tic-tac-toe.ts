import { otherSeat, type Seat } from "../types";
import type { MinigameModule, MinigameState, TicTacToeState } from "./types";

/** Tris (file, colonne e diagonali di 3). */

const LINES: readonly [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const winnerOf = (board: (Seat | null)[]): Seat | "draw" | null => {
  for (const [a, b, c] of LINES) {
    const value = board[a];
    if (value !== null && value === board[b] && value === board[c]) return value;
  }
  return board.every((cell) => cell !== null) ? "draw" : null;
};

const ensure = (state: MinigameState): TicTacToeState => {
  if (state.kind !== "tic-tac-toe") throw new Error("Stato di gioco non adatto al tris.");
  return state;
};

export const ticTacToe: MinigameModule = {
  id: "tic-tac-toe",

  init: ({ firstSeat }) => ({
    kind: "tic-tac-toe",
    board: Array<Seat | null>(9).fill(null),
    turn: firstSeat,
    winner: null,
  }),

  applyMove: (rawState, seat, move) => {
    const state = ensure(rawState);
    if (state.winner !== null) return { ok: false, error: "Il tris è già finito." };
    if (state.turn !== seat) return { ok: false, error: "Non tocca a te nel tris." };
    const cell =
      typeof move === "object" && move !== null && "cell" in move
        ? (move as { cell: unknown }).cell
        : undefined;
    if (typeof cell !== "number" || !Number.isInteger(cell) || cell < 0 || cell > 8) {
      return { ok: false, error: "Mossa del tris non valida: serve `cell` da 0 a 8." };
    }
    if (state.board[cell] !== null) return { ok: false, error: "Casella del tris già occupata." };
    const board = [...state.board];
    board[cell] = seat;
    return {
      ok: true,
      state: { ...state, board, turn: otherSeat(seat), winner: winnerOf(board) },
    };
  },

  result: (state) => ensure(state).winner,

  turn: (state) => ensure(state).turn,
};
