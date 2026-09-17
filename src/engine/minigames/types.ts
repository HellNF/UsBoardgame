import type { Seat } from "../types";

/**
 * Minigiochi integrati (D-26): moduli puri in `src/engine/minigames`, mossi dalla
 * stessa azione di gioco (`MINIGAME_MOVE`) e senza I/O.
 *
 * Ogni modulo espone `init`, `applyMove`, `result` (+ `turn`) e non conosce né il
 * tabellone né l'economia: riceve solo la propria parte di stato.
 *
 * Due moduli sono **a tempo** (F4-04, D-55): il quiz-lampo e i riflessi ricevono
 * l'orologio del server (`MinigameClock`) e non leggono mai il tempo da soli.
 */

export type MinigameId = "tic-tac-toe" | "connect-four" | "memory" | "quiz" | "reflex";

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

/**
 * Una domanda del quiz-lampo: **contenuto pubblico della carta** (src/content/challenges.ts),
 * non una risposta della scheda. La risposta giusta può stare nello stato senza svelare niente.
 */
export type QuizItem = {
  question: string;
  options: string[];
  /** Indice dell'opzione giusta dentro `options`. */
  correct: number;
};

/** Quiz-lampo: domande a turno, un punto per risposta giusta, chi ne ha di più vince (F4-04). */
export type QuizState = {
  kind: "quiz";
  items: QuizItem[];
  /** Domanda in corso, indice dentro `items`. */
  index: number;
  /** Chi risponde alla domanda in corso. */
  turn: Seat;
  scores: Record<Seat, number>;
  winner: Seat | "draw" | null;
};

/** Riflessi: esito del round appena chiuso, per raccontarlo a schermo. */
export type ReflexRound = {
  /** Chi ha preso il punto. */
  winner: Seat;
  /** Vero se ha toccato prima del segnale: il punto va all'altro. */
  falseStart: boolean;
};

/** Riflessi: un segnale parte a sorpresa, il primo che lo tocca prende il punto (F4-04). */
export type ReflexState = {
  kind: "reflex";
  /** Round in corso, da 1. */
  round: number;
  /** Momento in cui appare il segnale del round in corso (ISO, orologio del server). */
  goAt: string;
  /** Chi ha già toccato in questo round. */
  pressed: Seat[];
  scores: Record<Seat, number>;
  /** Ultimo round chiuso, `null` all'inizio. */
  lastRound: ReflexRound | null;
  winner: Seat | "draw" | null;
};

export type MinigameState = TicTacToeState | ConnectFourState | MemoryState | QuizState | ReflexState;

/** Orologio e caso forniti dal server: i moduli puri non li leggono da soli. */
export type MinigameClock = {
  now: Date;
  randomInt: (max: number) => number;
};

export type MinigameInitInput = MinigameClock & {
  /** Chi muove per primo (il giocatore di turno). */
  firstSeat: Seat;
  /** Contenuto della carta, per i minigiochi che ne hanno bisogno (il quiz). */
  content?: QuizItem[] | null;
};

export type MinigameMoveResult = { ok: true; state: MinigameState } | { ok: false; error: string };

/** Firmato su `MinigameState`: ogni modulo controlla `kind` e rifiuta gli altri stati. */
export type MinigameModule = {
  id: MinigameId;
  init: (input: MinigameInitInput) => MinigameState;
  applyMove: (state: MinigameState, seat: Seat, move: unknown, clock: MinigameClock) => MinigameMoveResult;
  /** `null` finché la partita del minigioco è in corso. */
  result: (state: MinigameState) => Seat | "draw" | null;
  /**
   * Di chi è il turno nel minigioco; `"both"` quando possono muovere entrambi
   * (i riflessi: chi tocca per primo).
   */
  turn: (state: MinigameState) => Seat | "both";
};
