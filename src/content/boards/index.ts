import type { BoardLayout } from "@/engine/types";
import { classic } from "./classic";

/**
 * Disposizioni predefinite del tabellone. La prima è quella proposta in lobby.
 * TODO(F7-02): generatore casuale da seed (docs/decisions.md D-12).
 */
export const boards: BoardLayout[] = [classic];

/** Disposizione scelta se la lobby non ne indica un'altra. */
export const defaultBoardId = classic.id;
