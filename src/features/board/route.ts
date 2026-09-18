import { cellToCoord, ladderAt, snakeAt, type BoardLayout, type CellNumber } from "@/engine";
import { cellCenter, snakeGeometry, type Point } from "./geometry";

/**
 * Percorso della pedina (F2-05): da una casella all'altra **cella per cella**, un saltello per
 * ogni casella attraversata; su una scala sale gradino per gradino, su un serpente segue il corpo.
 *
 * È una funzione pura: il tabellone non tiene stato e i test possono contare i passi.
 * La durata è in secondi e serve anche a chi accoda gli eventi (un movimento alla volta):
 * così l'animazione del tabellone e l'attesa di chi aspetta il proprio turno di animare
 * non possono andare fuori sincrono.
 */

/** Secondi per ogni casella attraversata saltando. */
const HOP_SECONDS = 0.16;
/** Secondi per ogni file salita su una scala. */
const CLIMB_SECONDS = 0.22;
/** Secondi per scendere lungo il serpente. */
const SLIDE_SECONDS = 0.9;
/** Quanto si alza la pedina al culmine di un saltello, in unità SVG. */
const HOP_HEIGHT = 26;

export type PawnRoute = {
  /** Casella di partenza e punti che la pedina segue, in ordine. */
  from: CellNumber;
  to: CellNumber;
  points: Point[];
  /** Durata dell'animazione in secondi (0 = nessun movimento). */
  duration: number;
};

/** Le caselle attraversate fra due caselle, in ordine: una per volta, avanti o indietro. */
export function cellsBetween(from: CellNumber, to: CellNumber): CellNumber[] {
  if (from === to) return [];
  const step = to > from ? 1 : -1;
  const cells: CellNumber[] = [];
  for (let cell = from + step; cell !== to + step; cell += step) cells.push(cell);
  return cells;
}

/** Saltelli da una casella all'altra: culmine a metà strada, atterraggio al centro. */
function hopPoints(from: CellNumber, to: CellNumber): Point[] {
  const points: Point[] = [];
  const cells = cellsBetween(from, to);
  let previous = cellCenter(from);
  for (const cell of cells) {
    const landing = cellCenter(cell);
    points.push({ x: (previous.x + landing.x) / 2, y: (previous.y + landing.y) / 2 - HOP_HEIGHT });
    points.push(landing);
    previous = landing;
  }
  return points;
}

/** Punti della salita su una scala: le file che separano le due caselle. */
function climbPoints(from: CellNumber, to: CellNumber): Point[] {
  const fromRow = cellToCoord(from).row;
  const toRow = cellToCoord(to).row;
  const rows = Math.abs(toRow - fromRow);
  const start = cellCenter(from);
  const end = cellCenter(to);
  if (rows === 0) return [end];

  const points: Point[] = [];
  for (let step = 1; step <= rows; step++) {
    const t = step / rows;
    points.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
  }
  return points;
}

/**
 * Percorso della pedina da `from` a `to`. Riconosce scale e serpenti dalla disposizione:
 * la scala si sale gradino per gradino, il serpente si scende seguendo il corpo.
 */
export function pawnRouteFor(board: BoardLayout, from: CellNumber, to: CellNumber): PawnRoute {
  if (from === to) return { from, to, points: [cellCenter(from)], duration: 0 };

  const ladder = ladderAt(board, from);
  if (ladder && ladder.to === to) {
    const points = climbPoints(from, to);
    return {
      from,
      to,
      points,
      duration: Math.max(CLIMB_SECONDS, points.length * CLIMB_SECONDS),
    };
  }

  const snake = snakeAt(board, from);
  if (snake && snake.to === to) {
    return { from, to, points: snakeGeometry(from, to).points, duration: SLIDE_SECONDS };
  }

  // Movimento normale: un saltello per ogni casella attraversata.
  const points = hopPoints(from, to);
  return {
    from,
    to,
    points: points.length > 0 ? points : [cellCenter(to)],
    duration: Math.max(HOP_SECONDS, cellsBetween(from, to).length * HOP_SECONDS),
  };
}

/** Solo la durata: la usa chi accoda gli eventi per sapere quando è finita un'animazione. */
export const routeDuration = (board: BoardLayout, from: CellNumber, to: CellNumber): number =>
  pawnRouteFor(board, from, to).duration;
