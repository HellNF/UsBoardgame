"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import {
  ladderAt,
  snakeAt,
  type BoardLayout,
  type Cell,
  type CellNumber,
  type GameState,
  type PlayerColor,
  type QuestionCategory,
  type Seat,
} from "@/engine";
import { BOARD, CELL, cellCenter, cellsBounds, ladderGeometry, snakeGeometry, type Point } from "./geometry";
import { Pawn } from "./pawn";

/**
 * Tabellone SVG (task F1-05, docs/design.md § Tabellone).
 * Un solo `<svg viewBox="0 0 1000 1000">`: celle → decorazioni → segnaposto delle
 * illustrazioni → scale → serpenti → cornice → pedine.
 * Le forme di scale e serpenti si generano dagli estremi della disposizione, quindi
 * non cambiano mai per lo stesso tabellone.
 */

/** Iniziale del segnaposto delle illustrazioni, per categoria (docs/design.md). */
const CATEGORY_INITIAL: Record<QuestionCategory, string> = {
  tastes: "G",
  memories: "R",
  future: "F",
  deep: "P",
  funny: "B",
};

/** Percorso di una pedina: casella di partenza e punti da seguire. */
type PawnRoute = { cell: CellNumber; points: Point[]; duration: number };

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

/** Stella disegnata a mano: cinque punte attorno al centro della casella. */
function starPath(cx: number, cy: number, outer = 34, inner = 14): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return `M ${points.join(" L ")} Z`;
}

function CellShape({ cell }: { cell: Cell }) {
  const { x, y } = cellsBounds([cell.n]);
  const center = cellCenter(cell.n);
  const tooDark = cell.kind === "challenge";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        fill={tooDark ? "var(--color-ink)" : "var(--color-paper)"}
      />
      {cell.kind === "event" && (
        <polygon points={`${x},${y + CELL} ${x + CELL},${y + CELL} ${x},${y}`} fill="var(--color-ink)" />
      )}
      {cell.kind === "coins" &&
        (cell.sign === "gain" ? (
          <circle cx={center.x} cy={center.y} r={26} fill="var(--color-ink)" />
        ) : (
          <circle cx={center.x} cy={center.y} r={24} fill="none" stroke="var(--color-ink)" strokeWidth={9} />
        ))}
      {cell.kind === "star" && <path d={starPath(center.x, center.y)} fill="var(--color-ink)" />}
      {cell.kind === "question" && (
        <text
          x={center.x}
          y={center.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={52}
          fontStyle="italic"
          fill="var(--color-ink)"
          fontFamily="var(--font-display)"
        >
          {CATEGORY_INITIAL[cell.category]}
        </text>
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
      <text
        x={x + 18}
        y={y + 38}
        fontSize={22}
        fill={tooDark ? "var(--color-paper)" : "var(--color-ink)"}
        fontFamily="var(--font-sans)"
      >
        {cell.n}
      </text>
    </g>
  );
}

/** Casella coperta da una forma geometrica decorativa (solo grafica). */
function DecorationShape({ shape, cells }: { shape: string; cells: CellNumber[] }) {
  const box = cellsBounds(cells);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const stroke = { fill: "none", stroke: "var(--color-ink)", strokeWidth: 6 } as const;

  switch (shape) {
    case "circle":
      return <circle cx={cx} cy={cy} r={Math.min(box.w, box.h) / 2 - 6} {...stroke} />;
    case "half-circle":
      return (
        <path
          d={`M ${box.x + 6} ${box.y + box.h - 6} A ${box.w / 2 - 6} ${box.w / 2 - 6} 0 0 1 ${box.x + box.w - 6} ${box.y + box.h - 6}`}
          {...stroke}
        />
      );
    case "diagonal":
      return (
        <line x1={box.x + 10} y1={box.y + box.h - 10} x2={box.x + box.w - 10} y2={box.y + 10} {...stroke} />
      );
    case "filled":
    default:
      return (
        <rect
          x={box.x + 8}
          y={box.y + 8}
          width={box.w - 16}
          height={box.h - 16}
          rx={12}
          fill="var(--color-ink)"
        />
      );
  }
}

/** Punti che la pedina segue quando si sposta da una casella all'altra. */
function routeFor(
  board: BoardLayout,
  from: CellNumber,
  to: CellNumber,
): { points: Point[]; duration: number } {
  const start = cellCenter(from);
  const end = cellCenter(to);
  if (from === to) return { points: [start], duration: 0 };

  const ladder = ladderAt(board, from);
  if (ladder && ladder.to === to) return { points: [start, end], duration: 0.7 };

  const snake = snakeAt(board, from);
  if (snake && snake.to === to) {
    return { points: snakeGeometry(from, to).points, duration: 0.9 };
  }

  // Salto normale: un arco verso l'alto, come una pedina che salta le caselle.
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 34 };
  return { points: [start, middle, end], duration: 0.45 };
}

export function Board({ board, state, names, colors, moves }: BoardProps) {
  const ladders = useMemo(
    () => board.ladders.map((ladder) => ladderGeometry(ladder.from, ladder.to)),
    [board.ladders],
  );
  const snakes = useMemo(
    () => board.snakes.map((snake) => snakeGeometry(snake.from, snake.to)),
    [board.snakes],
  );

  // Il percorso della pedina arriva dall'esterno: chi possiede gli eventi dice da dove
  // viene ogni posto, così il tabellone non tiene stato proprio (niente ref, niente effetti).
  const route = (seat: Seat): PawnRoute => {
    const cell = state.players[seat].position;
    const move = moves?.[seat];
    if (move && move.to === cell) return { cell, ...routeFor(board, move.from, move.to) };
    return { cell, points: [cellCenter(cell)], duration: 0 };
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
        <CellShape key={cell.n} cell={cell} />
      ))}

      <g aria-hidden="true">
        {board.decorations.map((decoration, index) => (
          <DecorationShape key={index} shape={decoration.shape} cells={decoration.cells} />
        ))}
      </g>

      {/* Scale: montanti spessi, pioli bianchi bordati di nero. */}
      <g aria-hidden="true">
        {ladders.map((ladder, index) => (
          <g key={index}>
            <path
              d={ladder.rails}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={13}
              strokeLinecap="round"
            />
            {ladder.rungs.map((rung, rungIndex) => (
              <line
                key={rungIndex}
                x1={rung.a.x}
                y1={rung.a.y}
                x2={rung.b.x}
                y2={rung.b.y}
                stroke="var(--color-ink)"
                strokeWidth={9}
                strokeLinecap="round"
              />
            ))}
          </g>
        ))}
      </g>

      {/* Serpenti: corpo nero a macchie chiare, testa con occhio. */}
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
            <path
              d={snake.body}
              fill="none"
              stroke="var(--color-paper)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray="12 30"
            />
            <g transform={`translate(${snake.head.x} ${snake.head.y}) rotate(${snake.headAngle})`}>
              <ellipse rx={30} ry={24} fill="var(--color-ink)" />
              <circle cx={12} cy={-8} r={5} fill="var(--color-paper)" />
              <circle cx={-12} cy={-8} r={5} fill="var(--color-paper)" />
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
