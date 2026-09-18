/**
 * Ricordo Letter — illustrazione di categoria «ricordi» (id `memories-letter`).
 * Busta: carta di crema, lembo disegnato e cuore di rosso.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesLetter({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <rect x="14" y="26" width="72" height="48" rx="4" fill="var(--color-art-cream)" />
      <path d="M15 30 50 54 85 30" fill="none" />
      <path
        d="M50 68c-5-5-10-7-10-12a6 6 0 0 1 10-3 6 6 0 0 1 10 3c0 5-5 7-10 12z"
        fill="var(--color-art-red)"
        stroke="none"
      />
    </svg>
  );
}
