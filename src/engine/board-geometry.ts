import { cellToCoord } from "./board";
import { RULES } from "./config";
import type { BoardLayout, CellNumber } from "./types";

/**
 * Geometria del tabellone che serve **anche al motore** (F7-02, decisione Derivata del pacchetto H).
 *
 * Il disegno delle scale e dei serpenti e l'ingombro delle loro forme stanno qui, in un modulo
 * puro senza React: il generatore di disposizioni deve sapere quali caselle una scala o un
 * serpente attraversa (D-65: si decora solo una casella che nulla attraversa), e quella misura
 * deve essere la **stessa** che disegna il tabellone, altrimenti il generatore evita caselle che
 * sembrano libere e non lo sono — o viceversa.
 *
 * `src/features/board/geometry.ts` costruisce i disegni da questi campioni; qui non c'è niente
 * che dipenda dallo schermo.
 *
 * Unità: una casella è 100 × 100, il tabellone 1000 × 1000, l'origine in alto a sinistra.
 */

export type Point = { x: number; y: number };

export const CELL = 100;
export const BOARD = CELL * RULES.board.size;

/** Distanza fra i montanti di una scala (metà per lato). */
export const LADDER_HALF_WIDTH = 16;
/** Tratto con cui si disegnano montanti e pioli. */
export const LADDER_STROKE = 8;
/** Spessore del corpo di un serpente. */
export const SNAKE_BODY_WIDTH = 16;
/** Ampiezza delle onde del corpo di un serpente. */
export const SNAKE_AMPLITUDE = 14;
/** Margine con cui una decorazione multi-cella sta dentro le sue caselle (docs/design.md). */
export const DECORATION_INSET = 12;

const round = (value: number): number => Math.round(value * 10) / 10;

/**
 * Un decimale in più per i punti che finiscono nel disegno come attributi: Node e il browser non
 * calcolano `Math.hypot` e `Math.sin` con gli stessi ultimi bit, e un `cx` che differisce
 * nell'ultima cifra fa segnalare a React un disallineamento di idratazione (l'HTML del server e
 * quello del browser non combaciano e React non lo corregge).
 */
const roundPoint = (point: Point): Point => ({
  x: Math.round(point.x * 100) / 100,
  y: Math.round(point.y * 100) / 100,
});

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });

function unit(a: Point): Point {
  const length = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / length, y: a.y / length };
}

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

/**
 * L'inclinazione di una scala o di un serpente, in gradi **sull'orizzontale** (0 = piatta,
 * 90 = verticale): l'angolo della retta fra i **centri** delle due caselle.
 *
 * È la misura che si legge guardando il tabellone — quanto una linea «sale» — e serve al generatore
 * di disposizioni (F7-02) per tenere le linee sopra la soglia di `RULES.board.minAngleDegrees`.
 * Sotto quella soglia una scala lunga una sola fila si legge come una sbarra piatta, non come una
 * salita (docs/design.md § Tabellone: il numero viene dalla `classic`, dove la linea più piatta è
 * proprio la scala 51→67, 18,4°).
 *
 * Le unità delle caselle si semplificano: conta il rapporto fra file coperte e colonne percorse.
 */
export function elementAngle(from: CellNumber, to: CellNumber): number {
  const a = cellToCoord(from);
  const b = cellToCoord(to);
  const rows = Math.abs(b.row - a.row);
  const cols = Math.abs(b.col - a.col);
  return (Math.atan2(rows, cols) * 180) / Math.PI;
}

/** Rettangolo della casella, con `margin` di tolleranza (negativo = ritirato verso il centro). */
export function cellRect(n: CellNumber, margin = 0): { x: number; y: number; w: number; h: number } {
  const corner = cellCorner(n);
  return { x: corner.x - margin, y: corner.y - margin, w: CELL + margin * 2, h: CELL + margin * 2 };
}

/**
 * Vero se la casella sta sulla **cornice**: prima o ultima fila, prima o ultima colonna.
 *
 * È il terzo vincolo di D-65. La cornice del tabellone è spessa e si disegna **dopo** le decorazioni
 * (docs/design.md § Tabellone), quindi su una casella di bordo si mangia il margine di
 * `DECORATION_INSET` e i due neri diventano uno: il disco sulle caselle 4-5 della `classic` si
 * fondeva con la cornice di sotto. Il generatore di disposizioni (F7-02) filtra con questa, il
 * bordo non è una casella «attraversata» da niente: è una casella dove la decorazione non entra.
 */
export function isBorderCell(n: CellNumber): boolean {
  const { row, col } = cellToCoord(n);
  return row === 0 || col === 0 || row === RULES.board.size - 1 || col === RULES.board.size - 1;
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
// Scale e serpenti: l'asse e il corpo
// ---------------------------------------------------------------------------

export type LadderAxis = {
  /** Punto di partenza (sul bordo della casella di base) e di arrivo (su quella di cima). */
  start: Point;
  end: Point;
  /** Direzione della scala e sua normale. */
  axis: Point;
  normal: Point;
};

/** Asse di una scala fra base e cima: la scala appoggia sui bordi delle due caselle. */
export function ladderAxis(from: CellNumber, to: CellNumber): LadderAxis {
  const base = cellCenter(from);
  const top = cellCenter(to);
  const start: Point = { x: base.x, y: base.y - CELL / 2 + 10 };
  const end: Point = { x: top.x, y: top.y + CELL / 2 - 10 };
  const axis = unit(sub(end, start));
  return { start, end, axis, normal: { x: -axis.y, y: axis.x } };
}

/** Punti dei pioli fra base e cima, dal più basso al più alto. */
export function ladderRungs(from: CellNumber, to: CellNumber): { a: Point; b: Point }[] {
  const { start, end, normal } = ladderAxis(from, to);
  const span = Math.hypot(end.x - start.x, end.y - start.y);
  const count = Math.max(3, Math.round(span / 62));
  const half = LADDER_HALF_WIDTH;
  return Array.from({ length: count - 1 }, (_, index) => {
    const t = (index + 1) / count;
    const middle = add(start, scale(sub(end, start), t));
    return {
      a: roundPoint(add(middle, scale(normal, half - 6))),
      b: roundPoint(add(middle, scale(normal, -(half - 6)))),
    };
  });
}

/**
 * Il corpo del serpente: onde intere lungo l'asse, ampiezza fissa, smorzate agli estremi così
 * il corpo entra ed esce dal centro delle due caselle. Stessi estremi, stessa curva.
 */
export function snakeBodyPoints(from: CellNumber, to: CellNumber): Point[] {
  const head = cellCenter(from);
  const tip = cellCenter(to);
  const delta = sub(tip, head);
  const axis = unit(delta);
  const normal: Point = { x: -axis.y, y: axis.x };
  const span = Math.hypot(delta.x, delta.y);

  const waves = Math.max(2, Math.min(5, Math.round(span / 180)));
  const samples = waves * 8;
  return Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const wave = Math.sin(t * Math.PI * 2 * waves) * SNAKE_AMPLITUDE * Math.sin(Math.PI * t);
    return roundPoint(add(add(head, scale(delta, t)), scale(normal, wave)));
  });
}

// ---------------------------------------------------------------------------
// Ingombro: quali caselle un tratto attraversa
// ---------------------------------------------------------------------------

/** Distanza fra un punto e un rettangolo (0 = dentro). */
function distanceToRect(point: Point, rect: { x: number; y: number; w: number; h: number }): number {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.w));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

/** I punti del tratto, con i tratti rettilinei spezzati in passi non più lunghi di `step`. */
export function samplePath(points: Point[], step = 8): Point[] {
  if (points.length < 2) return points;
  const sampled: Point[] = [points[0]];
  for (let index = 0; index < points.length - 1; index++) {
    const from = points[index];
    const to = points[index + 1];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(length / step));
    for (let stepIndex = 1; stepIndex <= steps; stepIndex++) {
      const t = stepIndex / steps;
      sampled.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
  }
  return sampled;
}

/**
 * Le caselle che un tratto attraversa: quelle il cui rettangolo — ritirato di `inset` — dista dal
 * tratto meno di `clearance`. `inset` serve alle decorazioni (stanno dentro il margine di D-65),
 * `clearance` allo spessore della forma che passa.
 */
export function cellsAlongPath(points: Point[], clearance = 0, inset = 0): Set<CellNumber> {
  const path = samplePath(points);
  const crossed = new Set<CellNumber>();
  for (let n = 1; n <= RULES.board.cells; n++) {
    const rect = cellRect(n, -inset);
    if (path.some((point) => distanceToRect(point, rect) <= clearance)) crossed.add(n);
  }
  return crossed;
}

export type CrossedOptions = {
  /** Quanto si ritira il bordo della casella prima di misurare. */
  inset?: number;
  /** Tolleranza attorno a una scala (montanti più tratto). */
  ladder?: number;
  /** Tolleranza attorno al corpo di un serpente. */
  snake?: number;
};

/**
 * Le caselle attraversate da scale e serpenti della disposizione (D-65, F7-02).
 * Con i valori di partenza sono le caselle su cui una decorazione piena si fonderebbe con
 * un'altra forma piena: è la misura che il generatore usa per scegliere dove decorare.
 *
 * Il **bordo** non è di questo conto — lì il nero che si fonde è quello della cornice, non quello di
 * una scala — e lo tiene fuori `isBorderCell`, il terzo vincolo di D-65.
 */
export function crossedCells(board: BoardLayout, options: CrossedOptions = {}): Set<CellNumber> {
  const crossed = new Set<CellNumber>();
  for (const { cells } of elementFootprints(board, {
    ...options,
    inset: options.inset ?? DECORATION_INSET,
  })) {
    for (const cell of cells) crossed.add(cell);
  }
  return crossed;
}

/** Una scala o un serpente con le caselle su cui passa. */
export type ElementFootprint = {
  kind: "ladder" | "snake";
  from: CellNumber;
  to: CellNumber;
  /** Le caselle toccate: con `inset` 0 tutta la casella, altrimenti ritirata di quel margine. */
  cells: Set<CellNumber>;
};

/**
 * L'ingombro di **ogni** scala e serpente, uno per uno (F7-02, pacchetto I).
 *
 * Serve al budget di leggibilità: due linee si «incrociano» quando passano sopra la stessa casella,
 * quindi il conto ha bisogno delle caselle di ciascuna, non della loro unione. Con `inset` 0 (il
 * valore di partenza, diverso da quello di `crossedCells`) la misura è l'**inchiostro intero**: una
 * linea conta su una casella anche quando la sfiora soltanto, che è quello che si vede.
 *
 * Come per `crossedCells`, scala e serpente si misurano con gli ingombri veri del disegno
 * (`LADDER_HALF_WIDTH` + mezzo tratto, metà di `SNAKE_BODY_WIDTH`) e con `cellsAlongPath`, il
 * modulo da cui il tabellone disegna (D-70): niente geometria nuova, niente seconda verità.
 */
export function elementFootprints(
  board: Pick<BoardLayout, "ladders" | "snakes">,
  options: CrossedOptions = {},
): ElementFootprint[] {
  const inset = options.inset ?? 0;
  const ladderClearance = options.ladder ?? LADDER_HALF_WIDTH + LADDER_STROKE / 2;
  const snakeClearance = options.snake ?? SNAKE_BODY_WIDTH / 2;

  const footprints: ElementFootprint[] = [];
  for (const { from, to } of board.ladders) {
    const { start, end } = ladderAxis(from, to);
    footprints.push({
      kind: "ladder",
      from,
      to,
      cells: cellsAlongPath([start, end], ladderClearance, inset),
    });
  }
  for (const { from, to } of board.snakes) {
    footprints.push({
      kind: "snake",
      from,
      to,
      cells: cellsAlongPath(snakeBodyPoints(from, to), snakeClearance, inset),
    });
  }
  return footprints;
}
