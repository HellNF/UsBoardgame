/**
 * Stella Star — illustrazione di categoria «stelle» (id `stars-star`).
 * Stella piena.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
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
      <path
        d="M 50.0 15.0 L 58.8 37.9 L 83.3 39.2 L 64.3 54.6 L 70.6 78.3 L 50.0 65.0 L 29.4 78.3 L 35.7 54.6 L 16.7 39.2 L 41.2 37.9 Z"
        fill="var(--color-art-amber)"
      />
    </svg>
  );
}
