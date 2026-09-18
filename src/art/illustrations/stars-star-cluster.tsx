/**
 * Stella StarCluster — illustrazione di categoria «stelle» (id `stars-star-cluster`).
 * Ammasso: la stella grande e due piccole.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
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
      <path
        d="M 46.0 30.0 L 53.6 49.5 L 74.5 50.7 L 58.4 64.0 L 63.6 84.3 L 46.0 73.0 L 28.4 84.3 L 33.6 64.0 L 17.5 50.7 L 38.4 49.5 Z"
        fill="var(--color-art-amber)"
      />
      <path
        d="M 26.0 12.0 L 30.1 22.3 L 41.2 23.1 L 32.7 30.2 L 35.4 40.9 L 26.0 35.0 L 16.6 40.9 L 19.3 30.2 L 10.8 23.1 L 21.9 22.3 Z"
        fill="var(--color-art-amber)"
      />
      <path
        d="M 72.0 8.0 L 75.5 17.1 L 85.3 17.7 L 77.7 23.9 L 80.2 33.3 L 72.0 28.0 L 63.8 33.3 L 66.3 23.9 L 58.7 17.7 L 68.5 17.1 Z"
        fill="var(--color-art-amber)"
      />
    </svg>
  );
}
