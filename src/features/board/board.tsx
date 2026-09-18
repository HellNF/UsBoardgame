"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { Illustration } from "@/art/illustrations";
import {
  type BoardLayout,
  type Cell,
  type CellNumber,
  type DecorationShape as DecorationShapeKind,
  type GameState,
  type PlayerColor,
  type Seat,
} from "@/engine";
import { BOARD, CELL, cellCenter, cellsBounds, ladderGeometry, snakeGeometry } from "./geometry";
import { Pawn } from "./pawn";
import { pawnRouteFor, type PawnRoute as PawnRouteForBoard } from "./route";

/**
 * Tabellone SVG (task F1-05, docs/design.md § Tabellone).
 * Un solo `<svg viewBox="0 0 1000 1000">`, a strati dal basso: celle → decorazioni →
 * scale → serpenti → cornice → numeri e illustrazioni delle caselle → pedine.
 *
 * I numeri e le illustrazioni stanno **sopra** scale e serpenti e hanno un tondo del colore
 * della casella (docs/design.md § Tabellone): dove una scala o un serpente passano su una
 * casella, il numero e il disegno restano leggibili.
 *
 * Le forme di scale e serpenti si generano dagli estremi della disposizione, quindi
 * non cambiano mai per lo stesso tabellone.
 */

/** Percorso di una pedina: casella di partenza e punti da seguire. */
type PawnRoute = PawnRouteForBoard;

export type BoardProps = {
  board: BoardLayout;
  state: GameState;
  names: Record<Seat, string>;
  colors: Record<Seat, PlayerColor>;
  /**
   * Ultimo spostamento di ogni posto (dagli eventi `MOVED`): serve solo all'animazione
   * della pedina. Senza, la pedina salta subito sulla casella nuova.
   */
  moves?: Partial<Record<Seat, { from: CellNumber; to: CellNumber }>>;
};

/** Fondo della casella: nero per le sfide, carta per tutto il resto. */
const cellBackground = (cell: Cell): string =>
  cell.kind === "challenge" ? "var(--color-ink)" : "var(--color-paper)";

/** Colore del numero e del simbolo: leggibile sul fondo della casella. */
const cellForeground = (cell: Cell): string =>
  cell.kind === "challenge" ? "var(--color-paper)" : "var(--color-ink)";

/**
 * Strato di fondo della casella: rettangolo, geometria del tipo (diagonale degli
 * imprevisti) e bordo. Numeri e simboli stanno in `CellMarks`, più sopra.
 */
function CellBase({ cell }: { cell: Cell }) {
  const { x, y } = cellsBounds([cell.n]);

  return (
    <g>
      <rect x={x} y={y} width={CELL} height={CELL} fill={cellBackground(cell)} />
      {cell.kind === "event" && (
        <polygon points={`${x},${y + CELL} ${x + CELL},${y + CELL} ${x},${y}`} fill="var(--color-ink)" />
      )}
      <rect
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

/**
 * L'illustrazione di una casella, dentro il suo tondo di carta.
 *
 * Il tondo è l'alone di A1/A5: sta **sopra** scale e serpenti, così dove una scala o un serpente
 * passano sulla casella il disegno resta leggibile (docs/design.md § Tabellone). Il numero della
 * casella si disegna ancora dopo, più in alto di tutto.
 * Se l'id non è nel registro (`illustrationFor` ritorna `null`) resta solo il numero: una
 * disposizione nuova non fa sparire il tabellone.
 */
function CellIllustration({ cell }: { cell: Cell }) {
  if (cell.kind !== "question" && cell.kind !== "star") return null;

  const center = cellCenter(cell.n);
  const size = 68;
  return (
    <g className="text-ink">
      <circle cx={center.x} cy={center.y} r={35} fill={cellBackground(cell)} />
      <Illustration id={cell.illustration} x={center.x - size / 2} y={center.y - size / 2} size={size} />
    </g>
  );
}

/**
 * Numero e simbolo della casella (illustrazione, monete).
 * Disegnati dopo scale e serpenti, ognuno con un alone del colore della casella:
 * dove una scala o un serpente passano sulla casella, restano leggibili.
 */
function CellMarks({ cell }: { cell: Cell }) {
  const { x, y } = cellsBounds([cell.n]);
  const center = cellCenter(cell.n);
  const background = cellBackground(cell);
  const foreground = cellForeground(cell);
  // L'alone si ottiene dipingendo prima il tratto e poi il riempimento.
  const halo = {
    stroke: background,
    strokeLinejoin: "round",
    paintOrder: "stroke",
  } as const;

  return (
    <g pointerEvents="none">
      {cell.kind === "coins" &&
        (cell.sign === "gain" ? (
          <circle cx={center.x} cy={center.y} r={26} fill={foreground} {...halo} strokeWidth={14} />
        ) : (
          <>
            <circle cx={center.x} cy={center.y} r={24} fill="none" stroke={background} strokeWidth={26} />
            <circle cx={center.x} cy={center.y} r={24} fill="none" stroke={foreground} strokeWidth={9} />
          </>
        ))}
      <CellIllustration cell={cell} />
      <text
        x={x + 18}
        y={y + 38}
        fontSize={22}
        fill={foreground}
        fontFamily="var(--font-sans)"
        {...halo}
        strokeWidth={12}
      >
        {cell.n}
      </text>
    </g>
  );
}

/** Margine fra una decorazione e il bordo delle sue caselle, in unità SVG. */
const DECORATION_MARGIN = 12;

/** Rombo inscritto nel gruppo di caselle, con un margine dal bordo. */
function rhombus(box: { x: number; y: number; w: number; h: number }, inset: number): string {
  const x = box.x + box.w / 2;
  const y = box.y + box.h / 2;
  const rx = box.w / 2 - inset;
  const ry = box.h / 2 - inset;
  return `M ${x} ${y - ry} L ${x + rx} ${y} L ${x} ${y + ry} L ${x - rx} ${y} Z`;
}

/**
 * Una decorazione multi-cella (G1): una forma **piena** in inchiostro, contenuta dentro il gruppo
 * di caselle che la disposizione le assegna, con un margine dai bordi.
 *
 * Sta sotto scale, serpenti e numeri (`docs/design.md` § Tabellone): dove una scala o un serpente
 * la attraversano vincono loro, e il numero della casella resta leggibile perché l'alone di A1 lo
 * stacca dal nero. Il "morso" di carta della falce è largo apposta meno del margine: non arriva
 * sui bordi delle caselle.
 */
function DecorationShape({ shape, cells }: { shape: DecorationShapeKind; cells: CellNumber[] }) {
  const box = cellsBounds(cells);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const ink = "var(--color-ink)";
  const paper = "var(--color-paper)";
  const radius = Math.min(box.w, box.h) / 2 - DECORATION_MARGIN;

  switch (shape) {
    case "disc":
      // Disco pieno al centro del gruppo: su due caselle è largo quanto l'altezza.
      return <circle cx={cx} cy={cy} r={radius} fill={ink} />;
    case "crescent":
      // Falce di luna: un disco pieno e un morso di carta che resta dentro la casella.
      return (
        <>
          <circle cx={cx - 4} cy={cy} r={radius} fill={ink} />
          <circle cx={cx + 14} cy={cy} r={radius - 8} fill={paper} />
        </>
      );
    case "hill":
      // Mezzo disco appoggiato sul fondo delle caselle, come un colle.
      return (
        <path
          d={`M ${box.x + DECORATION_MARGIN} ${box.y + box.h - DECORATION_MARGIN} A ${box.w / 2 - DECORATION_MARGIN} ${box.h / 2 - DECORATION_MARGIN} 0 0 1 ${box.x + box.w - DECORATION_MARGIN} ${box.y + box.h - DECORATION_MARGIN} Z`}
          fill={ink}
        />
      );
    case "diamond":
    default:
      // Rombo pieno con un rombo di carta dentro: le caselle si leggono come una piastrella.
      return (
        <>
          <path d={rhombus(box, DECORATION_MARGIN)} fill={ink} />
          <path d={rhombus(box, DECORATION_MARGIN + 20)} fill={paper} />
        </>
      );
  }
}

/** Punti che la pedina segue quando si sposta da una casella all'altra. */

export function Board({ board, state, names, colors, moves }: BoardProps) {
  const ladders = useMemo(
    () => board.ladders.map((ladder) => ladderGeometry(ladder.from, ladder.to)),
    [board.ladders],
  );
  const snakes = useMemo(
    () => board.snakes.map((snake) => snakeGeometry(snake.from, snake.to)),
    [board.snakes],
  );

  // Il percorso della pedina arriva dall'esterno: chi possiede gli eventi dice da dove viene
  // ogni posto (e accoda i movimenti, F2-05), così il tabellone non tiene stato proprio.
  // Senza movimento in corso la pedina sta sulla casella dello stato.
  const route = (seat: Seat): PawnRoute => {
    const move = moves?.[seat];
    if (move) return pawnRouteFor(board, move.from, move.to);
    const cell = state.players[seat].position;
    return { from: cell, to: cell, points: [cellCenter(cell)], duration: 0 };
  };
  const routes: Record<Seat, PawnRoute> = { 1: route(1), 2: route(2) };
  // Sulla stessa casella le due pedine si coprirebbero: si scostano di lato.
  if (state.players[1].position === state.players[2].position) {
    for (const seat of [1, 2] as Seat[]) {
      const shift = seat === 1 ? -20 : 20;
      routes[seat] = {
        ...routes[seat],
        points: routes[seat].points.map((point) => ({ x: point.x + shift, y: point.y })),
      };
    }
  }

  return (
    <svg viewBox={`0 0 ${BOARD} ${BOARD}`} className="h-full w-full" role="img" aria-label="Tabellone">
      <rect x={0} y={0} width={BOARD} height={BOARD} fill="var(--color-paper)" />

      {board.cells.map((cell) => (
        <CellBase key={cell.n} cell={cell} />
      ))}

      <g aria-hidden="true">
        {board.decorations.map((decoration, index) => (
          <DecorationShape key={index} shape={decoration.shape} cells={decoration.cells} />
        ))}
      </g>

      {/* Scale: due montanti neri e pioli bianchi bordati di nero (docs/design.md). */}
      <g aria-hidden="true">
        {ladders.map((ladder, index) => (
          <g key={index}>
            <path
              d={ladder.rails}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={14}
              strokeLinecap="round"
            />
            {ladder.rungs.map((rung, rungIndex) => (
              <g key={rungIndex}>
                <line
                  x1={rung.a.x}
                  y1={rung.a.y}
                  x2={rung.b.x}
                  y2={rung.b.y}
                  stroke="var(--color-ink)"
                  strokeWidth={13}
                  strokeLinecap="round"
                />
                <line
                  x1={rung.a.x}
                  y1={rung.a.y}
                  x2={rung.b.x}
                  y2={rung.b.y}
                  stroke="var(--color-paper)"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
        ))}
      </g>

      {/* Serpenti: corpo nero a macchie chiare, coda assottigliata, testa con un occhio. */}
      <g aria-hidden="true">
        {snakes.map((snake, index) => (
          <g key={index}>
            <path
              d={snake.body}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={26}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Le macchie: una sì e una no, orientate come il corpo in quel punto. */}
            {snake.spots.map((spot, spotIndex) => (
              <ellipse
                key={spotIndex}
                cx={spot.at.x}
                cy={spot.at.y}
                rx={spot.rx}
                ry={spot.ry}
                transform={`rotate(${spot.angle.toFixed(1)} ${spot.at.x} ${spot.at.y})`}
                fill="var(--color-paper)"
              />
            ))}
            {/* La coda si assottiglia: gli ultimi tratti, ognuno più sottile. */}
            {snake.tail.map((segment, segmentIndex) => (
              <line
                key={segmentIndex}
                x1={segment.from.x}
                y1={segment.from.y}
                x2={segment.to.x}
                y2={segment.to.y}
                stroke="var(--color-ink)"
                strokeWidth={segment.width}
                strokeLinecap="round"
              />
            ))}
            {/* La testa: un occhio solo e la lingua fuori. */}
            <g transform={`translate(${snake.head.x} ${snake.head.y}) rotate(${snake.headAngle})`}>
              <ellipse rx={32} ry={25} fill="var(--color-ink)" />
              <circle cx={8} cy={-9} r={7} fill="var(--color-paper)" />
              <circle cx={9} cy={-9} r={3.5} fill="var(--color-ink)" />
              <path
                d="M-30 0h-12l-5-6M-42 0l-5 6"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={4}
                strokeLinecap="round"
              />
            </g>
          </g>
        ))}
      </g>

      {/* Cornice. */}
      <rect
        x={8}
        y={8}
        width={BOARD - 16}
        height={BOARD - 16}
        rx={30}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={13}
      />

      {/* Numeri e simboli: sopra scale e serpenti, con l'alone del colore della casella. */}
      <g aria-hidden="true">
        {board.cells.map((cell) => (
          <CellMarks key={cell.n} cell={cell} />
        ))}
      </g>

      {/* Pedine: il turno è evidenziato con un anello. */}
      {([1, 2] as Seat[]).map((seat) => {
        const route = routes[seat];
        const end = route.points[route.points.length - 1];
        const active = state.turn === seat && state.phase !== "finished";
        return (
          <g key={seat}>
            <motion.circle
              initial={false}
              animate={{ cx: end.x, cy: end.y, opacity: active ? 0.35 : 0, r: active ? 44 : 34 }}
              transition={{ duration: route.duration || 0.2 }}
              fill="none"
              stroke={`var(--color-player-${colors[seat]})`}
              strokeWidth={7}
            />
            <motion.g
              initial={false}
              animate={{ x: route.points.map((point) => point.x), y: route.points.map((point) => point.y) }}
              transition={{ duration: route.duration, ease: "easeInOut" }}
            >
              <Pawn seat={seat} name={names[seat]} color={colors[seat]} x={0} y={0} />
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}
