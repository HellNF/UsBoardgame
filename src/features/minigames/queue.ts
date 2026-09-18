import type { MemoryState, MinigameState } from "@/engine";

/**
 * Il tempo delle animazioni dei minigiochi a turni (F2-05, tris, forza 4, memory).
 *
 * `MINIGAME_MOVED` arriva, ma il tabellone ridisegnava lo stato senza transizione — e due mosse
 * ravvicinate (l'altra schermata che muove, il tempo reale che consegna due righe insieme)
 * cambiavano il disegno nello stesso istante, accavallandosi. Qui ci sono le due decisioni pure
 * che `useMinigameQueue` usa per mettere in scena **una mossa per volta**: quanto aspettare prima
 * di disegnare lo stato nuovo e quali elementi sono entrati adesso (quelli da animare).
 */

/** Attesa minima fra una scena e la successiva: l'animazione precedente è finita. */
export const MINIGAME_STEP_MS = 320;

/** Memory: la prima carta del turno resta leggibile prima che arrivi la seconda. */
export const MEMORY_FIRST_CARD_MS = 600;

/** Memory: la seconda carta si vede accanto alla prima prima di passar mano. */
export const MEMORY_PAIR_MS = 500;

/** Memory: la coppia sbagliata resta scoperta il tempo di vederla prima di richiudersi. */
export const MEMORY_PEEK_MS = 900;

/** Carta del memory scoperta: abbinata, oppure girata adesso. */
const faceUp = (state: MemoryState, index: number): boolean =>
  state.matched[index] === true || state.revealed.includes(index);

/**
 * Quanto aspettare prima di mettere in scena `next`, dato quello che si sta guardando (`previous`).
 *
 * Vale in generale l'attesa minima fra due scene; il memory ha i suoi tempi perché le sue mosse
 * sono giri di carte: la prima carta si legge, la seconda si confronta, e una coppia sbagliata
 * deve restare scoperta abbastanza da essere vista prima che la mossa successiva la richiuda.
 */
export function revealDelay(previous: MinigameState | null, next: MinigameState): number {
  if (previous?.kind !== "memory" || next.kind !== "memory") return MINIGAME_STEP_MS;
  // C'erano due carte scoperte: adesso si richiudono (o si incassano) — è l'occhiata da concedere.
  if (previous.revealed.length === 2) return MEMORY_PEEK_MS;
  // Si sta girando la prima carta del turno, oppure la seconda: due tempi diversi.
  return next.revealed.length === 1 ? MEMORY_FIRST_CARD_MS : MEMORY_PAIR_MS;
}

/**
 * Gli elementi entrati in scena adesso, cioè quelli da animare: nessun altro si muove.
 *
 * L'indice è quello della casella, come la usa il tabellone del minigioco:
 *
 * - tris: indice 0-8 del tabellone (row-major);
 * - forza 4: `riga * colonne + colonna`, con la riga 0 in basso come nel motore;
 * - memory: indice della carta (0-11), solo per le carte che si **girano** adesso;
 * - quiz e riflessi: niente da animare (cambiano testo, non caselle).
 *
 * Il primo stato (o un cambio di minigioco) non anima niente: non c'è una scena precedente da
 * cui venire, e al caricamento della pagina le pedine già in tavola devono stare ferme.
 */
export function enteringCells(previous: MinigameState | null, next: MinigameState): number[] {
  if (previous === null || previous.kind !== next.kind) return [];

  if (previous.kind === "tic-tac-toe" && next.kind === "tic-tac-toe") {
    return next.board.flatMap((cell, index) =>
      cell !== null && previous.board[index] !== cell ? [index] : [],
    );
  }

  if (previous.kind === "connect-four" && next.kind === "connect-four") {
    const entered: number[] = [];
    next.board.forEach((row, rowIndex) => {
      row.forEach((cell, column) => {
        if (cell !== null && previous.board[rowIndex]?.[column] !== cell) {
          entered.push(rowIndex * row.length + column);
        }
      });
    });
    return entered;
  }

  if (previous.kind === "memory" && next.kind === "memory") {
    return next.cards.flatMap((_, index) => (!faceUp(previous, index) && faceUp(next, index) ? [index] : []));
  }

  return [];
}
