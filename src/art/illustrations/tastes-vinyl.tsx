/**
 * Gusto Vinyl — illustrazione di categoria «gusti» (id `tastes-vinyl`).
 * Disco: vinile scuro con le scanalature di cielo e l'etichetta d'ambra.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
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
      <circle cx="50" cy="52" r="34" fill="var(--color-art-navy)" />
      <circle cx="50" cy="52" r="18" fill="var(--color-art-amber)" stroke="none" />
      <circle cx="50" cy="52" r="4" fill="var(--color-art-paper)" stroke="none" />
      <path
        d="M28 34a30 30 0 0 0-6 20M78 40a30 30 0 0 1-8 26"
        stroke="var(--color-art-sky)"
        strokeWidth={3.5}
      />
      <path d="M76 12v10M71 17h10" stroke="var(--color-art-paper)" strokeWidth={3.5} />
    </svg>
  );
}
