/**
 * Stella — illustrazione di casella stella (id `stars-star`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import { starPath } from "./star";
import type { IllustrationProps } from "./types";

export function StarsStar({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Una stella piena, netta: è il simbolo della casella. */}
      <path d={starPath(50, 52, 38, 16)} fill="currentColor" />
    </svg>
  );
}
