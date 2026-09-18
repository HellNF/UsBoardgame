import type { BoardLayout } from "@/engine/types";
import { classic } from "./classic";
import { frozenBoards } from "./frozen";

/**
 * Disposizioni predefinite del tabellone. La prima è quella proposta in lobby.
 *
 * `boards` è l'elenco che il gioco **offre** — oggi la sola `classic`, che resta quella di ogni
 * stanza (`defaultBoardId`). Le disposizioni congelate da un seme stanno in `frozen.ts`, le validano
 * gli stessi test, ma **non entrano qui da sole**: quali disposizioni entrano in gioco è la decisione
 * di prodotto di F7-03, e portarla dentro vuol dire anche salvare il tabellone sulla riga della
 * partita (vedi il log del pacchetto I).
 */
export const boards: BoardLayout[] = [classic];

/** Disposizione scelta se la lobby non ne indica un'altra. */
export const defaultBoardId = classic.id;

export { frozenBoards };
