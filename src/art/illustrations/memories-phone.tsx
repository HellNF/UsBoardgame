/**
 * Telefono a disco — illustrazione di categoria «ricordi» (id `memories-phone`).
 * Corpo, cornetta staccata e disco di crema.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesPhone({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Corpo di rosso col disco di crema, e la cornetta appoggiata sopra, staccata. */}
      <path d="M24 56h52v18a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8z" fill="var(--color-art-red)" />
      <circle cx="50" cy="69" r="10" fill="var(--color-art-cream)" />
      <circle cx="50" cy="69" r="3.5" fill="var(--color-art-navy)" stroke="none" />
      <path
        d="M28 46c0-9 6-14 13-14h18c7 0 13 5 13 14"
        fill="none"
        stroke="var(--color-art-red)"
        strokeWidth={12}
      />
      <circle cx="29" cy="45" r="8" fill="var(--color-art-red)" />
      <circle cx="71" cy="45" r="8" fill="var(--color-art-red)" />
    </svg>
  );
}
