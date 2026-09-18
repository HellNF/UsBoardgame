import type { BoardLayout } from "@/engine/types";
import { classic } from "./classic";
import { frozenBoards } from "./frozen";

/**
 * Disposizioni che il gioco **offre** in lobby: la `classic` per prima — è quella preselezionata
 * (`defaultBoardId`) e resta la disposizione di ogni stanza di chi non sceglie — e poi le
 * disposizioni congelate da un seme (`frozen.ts`), in ordine di nome.
 *
 * Congelare una disposizione è **quello che la fa comparire in lobby**: `pnpm board:freeze <seme>
 * <nome>` scrive il file e riscrive il barrel, e da lì la lobby la offre senza toccare altro. Quale
 * usa una serata lo sceglie chi gioca, e l'id finisce su `games.settings.boardId` (D-77); un
 * tabellone pubblicato però non si riscrive (D-78), quindi una congelata resta quella che è.
 *
 * Un id che **non** è più in questo elenco non rompe niente: la partita il tabellone lo legge dal
 * database per id (`loadBoard`), quindi una serata vecchia continua a ridisegnare il suo.
 */
export const boards: BoardLayout[] = [classic, ...frozenBoards];

/** Disposizione scelta se la lobby non ne indica un'altra. */
export const defaultBoardId = classic.id;

export { frozenBoards };
