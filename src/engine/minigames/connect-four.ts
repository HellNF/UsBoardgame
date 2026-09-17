import { otherSeat, type Seat } from "../types";
import type { ConnectFourState, MinigameModule, MinigameState } from "./types";

/** Forza 4: 7 colonne × 6 righe, riga 0 in basso. La pedina cade sul fondo della colonna. */

export const COLUMNS = 7;
export const ROWS = 6;
const TO_WIN = 4;

const at = (board: (Seat | null)[][], row: number, col: number): Seat | null =>
  row < 0 || row >= ROWS || col < 0 || col >= COLUMNS ? null : board[row][col];

const winnerOf = (board: (Seat | null)[][]): Seat | "draw" | null => {
  const directions: readonly [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const seat = board[row][col];
      if (seat === null) continue;
      for (const [rowStep, colStep] of directions) {
        let count = 1;
        for (let step = 1; step < TO_WIN; step++) {
          if (at(board, row + rowStep * step, col + colStep * step) !== seat) break;
          count += 1;
        }
        if (count === TO_WIN) return seat;
      }
    }
  }
  return board.every((row) => row.every((cell) => cell !== null)) ? "draw" : null;
};

const ensure = (state: MinigameState): ConnectFourState => {
  if (state.kind !== "connect-four") throw new Error("Stato di gioco non adatto a forza 4.");
  return state;
};

export const connectFour: MinigameModule = {
  id: "connect-four",

  init: ({ firstSeat }) => ({
    kind: "connect-four",
    board: Array.from({ length: ROWS }, () => Array<Seat | null>(COLUMNS).fill(null)),
    turn: firstSeat,
    winner: null,
  }),

  applyMove: (rawState, seat, move) => {
    const state = ensure(rawState);
    if (state.winner !== null) return { ok: false, error: "La partita di forza 4 è già finita." };
    if (state.turn !== seat) return { ok: false, error: "Non tocca a te in forza 4." };
    const column =
      typeof move === "object" && move !== null && "column" in move
        ? (move as { column: unknown }).column
        : undefined;
    if (typeof column !== "number" || !Number.isInteger(column) || column < 0 || column >= COLUMNS) {
      return { ok: false, error: `Mossa di forza 4 non valida: serve \`column\` da 0 a ${COLUMNS - 1}.` };
    }
    const row = state.board.findIndex((cells) => cells[column] === null);
    if (row === -1) return { ok: false, error: "Colonna di forza 4 piena." };
    const board = state.board.map((cells) => [...cells]);
    board[row][column] = seat;
    return {
      ok: true,
      state: { ...state, board, turn: otherSeat(seat), winner: winnerOf(board) },
    };
  },

  result: (state) => ensure(state).winner,

  turn: (state) => ensure(state).turn,
};
