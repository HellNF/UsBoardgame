/**
 * Disco in vinile — illustrazione di categoria «gusti» (id `tastes-vinyl`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesVinyl({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Disco con un solco in più e l'etichetta piena al centro. */}
      <circle cx="50" cy="50" r="36" />
      <circle cx="50" cy="50" r="26" strokeWidth={3.5} />
      <circle cx="50" cy="50" r="11" fill="currentColor" />
      <circle cx="50" cy="50" r="3" fill="var(--color-paper)" />
    </svg>
  );
}
