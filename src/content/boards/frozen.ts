/**
 * Le disposizioni congelate da un seme: `pnpm board:freeze <seme> <nome>` (scripts/board-freeze.ts).
 *
 * **File generato: non modificare a mano**, lo riscrive lo script a ogni congelamento. Una
 * disposizione congelata è un file di dati accanto alla `classic`, non una chiamata al generatore:
 * non si muove se un giorno il generatore cambia.
 *
 * Queste disposizioni entrano in partita appena il file esiste: `boards` in `index.ts` le mette in
 * fila dopo la `classic`, quindi la lobby le offre senza toccare altro. Quale usa una serata lo
 * sceglie chi gioca, e l'id finisce su `games.settings.boardId` (D-77). Una congelata **non si
 * muove più**: se una serata la usa, quell'id resta il tabellone che è stato giocato (D-78).
 */
import type { BoardLayout } from "@/engine/types";

import { laDiagonale } from "./la-diagonale";
import { laRipida } from "./la-ripida";

/** Le disposizioni congelate finora, in ordine di nome. */
export const frozenBoards: BoardLayout[] = [laDiagonale, laRipida];
