import { cellToCoord, type CellNumber } from "@/engine";
import {
  BOARD,
  CELL,
  cellCenter,
  cellCorner,
  ladderAxis,
  ladderRungs,
  LADDER_HALF_WIDTH,
  snakeBodyPoints,
  smoothPath,
  type Point,
} from "@/engine";

/**
 * Geometria del tabellone in unità SVG (docs/design.md § Tabellone): una casella è 100 × 100,
 * il tabellone 1000 × 1000, l'origine in alto a sinistra.
 * Le forme di scale e serpenti si generano **solo** dagli estremi: stesso tabellone, stessa forma.
 *
 * L'asse di una scala e il corpo di un serpente vengono da `src/engine/board-geometry`: è lo
 * stesso modulo da cui il generatore di disposizioni (F7-02) misura quali caselle un tratto
 * attraversa, così il disegno e il generatore non possono andare d'accordo solo per caso. Qui
 * resta ciò che è solo disegno — montanti, pioli, macchie, coda, riquadri delle decorazioni.
 */

export { BOARD, CELL, cellCenter, cellCorner, smoothPath, type Point };

export type LadderGeometry = {
  /** I due montanti. */
  rails: string;
  /** I pioli, da disegnare come segmenti. */
  rungs: { a: Point; b: Point }[];
};

/** Scala fra base e cima: montanti paralleli all'asse e pioli regolari. */
export function ladderGeometry(from: CellNumber, to: CellNumber): LadderGeometry {
  const { start, end, normal } = ladderAxis(from, to);
  // Montanti sottili e distanti, pioli in mezzo: la scala si legge come un disegno a
  // linee (docs/reference/board/boardReference.png), non come una banda nera.
  const half = LADDER_HALF_WIDTH;

  const railLeft = { from: add(start, scale(normal, half)), to: add(end, scale(normal, half)) };
  const railRight = { from: add(start, scale(normal, -half)), to: add(end, scale(normal, -half)) };
  const rails = `M ${round(railLeft.from.x)} ${round(railLeft.from.y)} L ${round(railLeft.to.x)} ${round(railLeft.to.y)} M ${round(railRight.from.x)} ${round(railRight.from.y)} L ${round(railRight.to.x)} ${round(railRight.to.y)}`;

  return { rails, rungs: ladderRungs(from, to) };
}

export type SnakeGeometry = {
  /** Corpo sinuoso, dalla testa alla coda. */
  body: string;
  /** Punti del corpo, per far seguire la curva a una pedina. */
  points: Point[];
  head: Point;
  /** Rotazione della testa in gradi (0 = verso destra). */
  headAngle: number;
  /**
   * Macchie chiare sul corpo (le disegna il tabellone sopra il corpo nero).
   * Una sì e una no lungo la curva: sono la pelle a macchie di docs/design.md.
   */
  spots: { at: Point; angle: number; rx: number; ry: number }[];
  /** Coda assottigliata: gli ultimi tratti del corpo, dal più grosso al più sottile. */
  tail: { from: Point; to: Point; width: number }[];
};

/** Direzione della curva in un punto, in gradi: serve a orientare le macchie. */
function tangentAngle(points: Point[], index: number): number {
  const previous = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const angle = (Math.atan2(next.y - previous.y, next.x - previous.x) * 180) / Math.PI;
  // Un decimale: l'angolo finisce in un attributo `transform`, e Node e il browser non calcolano
  // `Math.atan2` con gli stessi ultimi bit (hydration, vedi `board-geometry`).
  return Math.round(angle * 10) / 10;
}

/**
 * Serpente fra testa e coda: il corpo è la curva di `src/engine/board-geometry`; qui si aggiungono
 * macchie, coda assottigliata e orientamento della testa.
 */
export function snakeGeometry(from: CellNumber, to: CellNumber): SnakeGeometry {
  const points = snakeBodyPoints(from, to);
  const head = points[0];
  const tip = points[points.length - 1];
  const delta = { x: tip.x - head.x, y: tip.y - head.y };

  // Macchie: una sì e una no, tenute lontane dalla testa e dalla coda.
  const spots: SnakeGeometry["spots"] = [];
  for (let index = 2; index < points.length - 2; index += 2) {
    spots.push({ at: points[index], angle: tangentAngle(points, index), rx: 6, ry: 3.5 });
  }

  // Coda: gli ultimi tratti ridisegnati via via più sottili.
  const widths = [13, 10, 7, 4];
  const tailPoints = points.slice(Math.max(0, points.length - 9));
  const step = (tailPoints.length - 1) / widths.length;
  const tail: SnakeGeometry["tail"] = widths.map((width, index) => ({
    from: tailPoints[Math.round(index * step)],
    to: tailPoints[Math.round((index + 1) * step)],
    width,
  }));

  return {
    body: smoothPath(points),
    points,
    head,
    headAngle: Math.round(((Math.atan2(delta.y, delta.x) * 180) / Math.PI) * 10) / 10,
    spots,
    tail,
  };
}

// ---------------------------------------------------------------------------
// Caselle multi-cella (decorazioni)
// ---------------------------------------------------------------------------

/** Rettangolo che contiene tutte le caselle indicate, con un margine. */
export function cellsBounds(cells: CellNumber[], margin = 0): { x: number; y: number; w: number; h: number } {
  const corners = cells.map(cellCorner);
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const x = Math.min(...xs) - margin;
  const y = Math.min(...ys) - margin;
  const w = Math.max(...xs) + CELL + margin - x;
  const h = Math.max(...ys) + CELL + margin - y;
  return { x, y, w, h };
}

/** Punti del centro di una serie di caselle (per le animazioni). */
export const centersOf = (cells: CellNumber[]): Point[] => cells.map(cellCenter);

/**
 * Sposta una posizione **dentro** la cornice, se la casella sta sul bordo.
 *
 * È la stessa lezione di [D-65](../../../docs/decisions.md) applicata alle pedine invece che
 * alle decorazioni: la cornice è a 8 unità dal bordo con un tratto di 13, quindi copre i primi
 * 14,5 di una casella di bordo. Sulla casella 1 — che è in un angolo, e dove le pedine partono
 * **tutte e due** — quello che finiva sotto il nero non era la sagoma (nera su nero non si
 * vede) ma le due cose **colorate**: la pedana e l'alone del turno.
 *
 * Lo scostamento è sui due assi, quindi negli angoli vale per entrambi.
 */
export function insideFrame(cell: CellNumber, point: Point, room: number): Point {
  const { row, col } = cellToCoord(cell);
  const last = BOARD / CELL - 1;
  const dx = col === 0 ? room : col === last ? -room : 0;
  // La riga 0 è quella in **basso** (la casella 1 è l'angolo in basso a sinistra), quindi la
  // riga 0 si scosta verso l'alto, cioè verso y minori.
  const dy = row === 0 ? -room : row === last ? room : 0;
  return { x: point.x + dx, y: point.y + dy };
}


// ---------------------------------------------------------------------------
// Aritmetica dei punti (solo disegno)
// ---------------------------------------------------------------------------

const round = (value: number): number => Math.round(value * 10) / 10;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
