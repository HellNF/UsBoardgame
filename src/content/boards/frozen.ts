/**
 * Le disposizioni congelate da un seme: `pnpm board:freeze <seme> <nome>` (scripts/board-freeze.ts).
 *
 * **File generato: non modificare a mano**, lo riscrive lo script a ogni congelamento. Una
 * disposizione congelata è un file di dati accanto alla `classic`, non una chiamata al generatore:
 * non si muove se un giorno il generatore cambia.
 *
 * Queste disposizioni **non entrano in partita da sole**: `boards` in `index.ts` resta la
 * `classic`, e quale tabellone usi una serata è la decisione di prodotto di F7-03 — insieme al
 * fatto che il tabellone scelto va salvato sulla riga della partita, altrimenti il diario di una
 * serata passata non si può più ridisegnare.
 */
import type { BoardLayout } from "@/engine/types";

/** Le disposizioni congelate finora: nessuna. `pnpm board:freeze 42 "Serata d'estate"` ne scrive una. */
export const frozenBoards: BoardLayout[] = [];
