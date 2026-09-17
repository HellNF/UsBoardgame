import { cellToCoord, RULES, type CellNumber } from "@/engine";

/**
 * Geometria del tabellone in unità SVG (docs/design.md § Tabellone): una casella è
 * 100 × 100, il tabellone 1000 × 1000, l'origine in alto a sinistra.
 * Le forme di scale e serpenti si generano **solo** dagli estremi: stesso tabellone,
 * stessa forma.
 */

export const CELL = 100;
export const BOARD = CELL * RULES.board.size;

export type Point = { x: number; y: number };

const round = (value: number): number => Math.round(value * 10) / 10;

/** Centro della casella. */
export function cellCenter(n: CellNumber): Point {
  const { row, col } = cellToCoord(n);
  return { x: col * CELL + CELL / 2, y: (RULES.board.size - 1 - row) * CELL + CELL / 2 };
}

/** Angolo in alto a sinistra della casella. */
export function cellCorner(n: CellNumber): Point {
  const { row, col } = cellToCoord(n);
  return { x: col * CELL, y: (RULES.board.size - 1 - row) * CELL };
}

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
const length = (a: Point): number => Math.hypot(a.x, a.y);

function unit(a: Point): Point {
  const len = length(a) || 1;
  return { x: a.x / len, y: a.y / len };
}

/** Curva morbida (Catmull-Rom trasformata in Bézier cubiche) che passa per i punti. */
export function smoothPath(points: Point[]): string {
  if (points.length < 2) return "";
  const parts = [`M ${round(points[0].x)} ${round(points[0].y)}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    parts.push(`C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(p2.x)} ${round(p2.y)}`);
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

export type LadderGeometry = {
  /** I due montanti. */
  rails: string;
  /** I pioli, da disegnare come segmenti. */
  rungs: { a: Point; b: Point }[];
};

/** Scala fra base e cima: montanti paralleli all'asse e pioli regolari. */
export function ladderGeometry(from: CellNumber, to: CellNumber): LadderGeometry {
  const base = cellCenter(from);
  const top = cellCenter(to);
  // La scala appoggia sul bordo della casella di base e arriva al bordo della cima.
  const start: Point = { x: base.x, y: base.y - CELL / 2 + 10 };
  const end: Point = { x: top.x, y: top.y + CELL / 2 - 10 };
  const axis = unit(sub(end, start));
  const normal: Point = { x: -axis.y, y: axis.x };
  // Montanti sottili e distanti, pioli in mezzo: la scala si legge come un disegno a
  // linee (docs/reference/board/boardReference.png), non come una banda nera.
  const half = 24;

  const railLeft = { from: add(start, scale(normal, half)), to: add(end, scale(normal, half)) };
  const railRight = { from: add(start, scale(normal, -half)), to: add(end, scale(normal, -half)) };
  const rails = `M ${round(railLeft.from.x)} ${round(railLeft.from.y)} L ${round(railLeft.to.x)} ${round(railLeft.to.y)} M ${round(railRight.from.x)} ${round(railRight.from.y)} L ${round(railRight.to.x)} ${round(railRight.to.y)}`;

  const span = length(sub(end, start));
  const count = Math.max(3, Math.round(span / 62));
  const rungs = Array.from({ length: count - 1 }, (_, index) => {
    const t = (index + 1) / count;
    const middle = add(start, scale(sub(end, start), t));
    return { a: add(middle, scale(normal, half - 6)), b: add(middle, scale(normal, -(half - 6))) };
  });

  return { rails, rungs };
}

// ---------------------------------------------------------------------------
// Serpenti
// ---------------------------------------------------------------------------

export type SnakeGeometry = {
  /** Corpo sinuoso, dalla testa alla coda. */
  body: string;
  /** Punti del corpo, per far seguire la curva a una pedina. */
  points: Point[];
  head: Point;
  /** Rotazione della testa in gradi (0 = verso destra). */
  headAngle: number;
};

/** Serpente fra testa e coda: onde intere lungo l'asse, ampiezza fissa. */
export function snakeGeometry(from: CellNumber, to: CellNumber): SnakeGeometry {
  const head = cellCenter(from);
  const tail = cellCenter(to);
  const delta = sub(tail, head);
  const axis = unit(delta);
  const normal: Point = { x: -axis.y, y: axis.x };
  const span = length(delta);

  const waves = Math.max(2, Math.min(5, Math.round(span / 180)));
  const amplitude = 30;
  const samples = waves * 6;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    // Si smorza agli estremi: il corpo entra ed esce dal centro delle due caselle.
    const wave = Math.sin(t * Math.PI * 2 * waves) * amplitude * Math.sin(Math.PI * t);
    return add(add(head, scale(delta, t)), scale(normal, wave));
  });

  return {
    body: smoothPath(points),
    points,
    head,
    headAngle: (Math.atan2(delta.y, delta.x) * 180) / Math.PI,
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
