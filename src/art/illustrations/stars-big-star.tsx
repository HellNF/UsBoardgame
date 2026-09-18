/**
 * Stella grande — illustrazione di casella stella (id `stars-big-star`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import { starPath } from "./star";
import type { IllustrationProps } from "./types";

export function StarsBigStar({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Stella doppia: quella dentro resta del colore della carta. */}
      <path d={starPath(50, 52, 40, 17)} fill="currentColor" />
      <path d={starPath(50, 52, 20, 9)} fill="var(--color-paper)" stroke="none" />
    </svg>
  );
}
