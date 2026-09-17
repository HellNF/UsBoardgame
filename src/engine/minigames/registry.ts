import { connectFour } from "./connect-four";
import { memory } from "./memory";
import { quiz } from "./quiz";
import { reflex } from "./reflex";
import { ticTacToe } from "./tic-tac-toe";
import type { Seat } from "../types";
import type { MinigameId, MinigameModule, MinigameState } from "./types";

/** Moduli dei minigiochi integrati (D-26): mossi tutti da `MINIGAME_MOVE`. */
export const MINIGAMES: Record<MinigameId, MinigameModule> = {
  "tic-tac-toe": ticTacToe,
  "connect-four": connectFour,
  memory,
  quiz,
  reflex,
};

/** Modulo di un minigioco, oppure `null` se l'id non è fra quelli integrati. */
export const minigameById = (id: string): MinigameModule | null =>
  id in MINIGAMES ? MINIGAMES[id as MinigameId] : null;

/**
 * Vero se quel posto può muovere adesso: con `"both"` (i riflessi) possono entrambi, negli
 * altri minigiochi tocca a chi ha il turno.
 */
export const minigameAllows = (state: MinigameState, seat: Seat): boolean => {
  const current = minigameTurn(state);
  return current === "both" || current === seat;
};

/** Di chi è il turno in un minigioco (`"both"` = possono muovere entrambi). */
export const minigameTurn = (state: MinigameState): Seat | "both" => MINIGAMES[state.kind].turn(state);
