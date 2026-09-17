import type { Seat } from "../types";

/**
 * Minigiochi integrati (D-26): moduli puri in `src/engine/minigames`, mossi dalla
 * stessa azione di gioco (`MINIGAME_MOVE`) e senza I/O.
 *
 * Ogni modulo espone `init`, `applyMove`, `result` (+ `turn`) e non conosce né il
 * tabellone né l'economia: riceve solo la propria parte di stato.
 */

export type MinigameId = "tic-tac-toe" | "connect-four" | "memory";

/** Tris: 3 × 3, indice 0-8. */
export type TicTacToeState = {
  kind: "tic-tac-toe";
  /** `null` = casella libera. */
  board: (Seat | null)[];
  turn: Seat;
  winner: Seat | "draw" | null;
};

/** Forza 4: 7 colonne × 6 righe, la pedina cade in fondo alla colonna. */
export type ConnectFourState = {
  kind: "connect-four";
  /** `board[row][col]`, riga 0 = in basso. */
  board: (Seat | null)[][];
  turn: Seat;
  winner: Seat | "draw" | null;
};

/** Memory: carte coperte, si scoprono due per volta. */
export type MemoryState = {
  kind: "memory";
  /** Valore di ogni carta: due carte per valore. */
  cards: number[];
  /** Indici scoperti nel turno in corso (0, 1 o 2). */
  revealed: number[];
  /** Indici già abbinati. */
  matched: boolean[];
  pairs: Record<Seat, number>;
  turn: Seat;
  winner: Seat | "draw" | null;
};

export type MinigameState = TicTacToeState | ConnectFourState | MemoryState;

export type MinigameInitInput = {
  /** RNG del server: solo i minigiochi con mazzo casuale (memory) lo usano. */
  randomInt: (max: number) => number;
  /** Chi muove per primo (il giocatore di turno). */
  firstSeat: Seat;
};

export type MinigameMoveResult = { ok: true; state: MinigameState } | { ok: false; error: string };

/** Firmato su `MinigameState`: ogni modulo controlla `kind` e rifiuta gli altri stati. */
export type MinigameModule = {
  id: MinigameId;
  init: (input: MinigameInitInput) => MinigameState;
  applyMove: (state: MinigameState, seat: Seat, move: unknown) => MinigameMoveResult;
  /** `null` finché la partita del minigioco è in corso. */
  result: (state: MinigameState) => Seat | "draw" | null;
  /** Di chi è il turno nel minigioco. */
  turn: (state: MinigameState) => Seat;
};
