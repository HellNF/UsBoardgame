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

/** Le disposizioni congelate finora: nessuna. `pnpm board:freeze 42 "Serata d'estate"` ne scrive una. */
export const frozenBoards: BoardLayout[] = [];
