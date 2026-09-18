/**
 * Stella BigStar — illustrazione di categoria «stelle» (id `stars-big-star`).
 * Stella grande, con i raggi intorno.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
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
      <path
        d="M 50.0 16.0 L 58.8 39.9 L 84.2 40.9 L 64.3 56.6 L 71.2 81.1 L 50.0 67.0 L 28.8 81.1 L 35.7 56.6 L 15.8 40.9 L 41.2 39.9 Z"
        fill="var(--color-art-amber)"
      />
      <path d="M50 6v8M20 14l5 6M80 14l-5 6" stroke="var(--color-art-amber)" strokeWidth={4} />
    </svg>
  );
}
