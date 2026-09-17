import { connectFour } from "./connect-four";
import { memory } from "./memory";
import { ticTacToe } from "./tic-tac-toe";
import type { MinigameId, MinigameModule } from "./types";

/** Moduli dei minigiochi integrati (D-26): mossi tutti da `MINIGAME_MOVE`. */
export const MINIGAMES: Record<MinigameId, MinigameModule> = {
  "tic-tac-toe": ticTacToe,
  "connect-four": connectFour,
  memory,
};

/** Modulo di un minigioco, oppure `null` se l'id non è fra quelli integrati. */
export const minigameById = (id: string): MinigameModule | null =>
  id in MINIGAMES ? MINIGAMES[id as MinigameId] : null;
