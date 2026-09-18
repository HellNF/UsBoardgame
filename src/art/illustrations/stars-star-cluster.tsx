/**
 * Ammasso di stelle — illustrazione di casella stella (id `stars-star-cluster`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import { starPath } from "./star";
import type { IllustrationProps } from "./types";

export function StarsStarCluster({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={5.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Tre stelle: quella grande è piena. */}
      <path d={starPath(50, 54, 30, 13)} fill="currentColor" />
      <path d={starPath(20, 26, 14, 6)} />
      <path d={starPath(80, 26, 14, 6)} />
    </svg>
  );
}
