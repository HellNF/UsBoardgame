/**
 * Ricordo Cassette — illustrazione di categoria «ricordi» (id `memories-cassette`).
 * Musicassetta: corpo di rosso, etichetta di crema e i due rocchetti.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesCassette({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <rect x="12" y="30" width="76" height="44" rx="5" fill="var(--color-art-red)" />
      <rect x="20" y="38" width="60" height="14" rx="3" fill="var(--color-art-cream)" />
      <circle cx="36" cy="64" r="7" fill="var(--color-art-navy)" />
      <circle cx="36" cy="64" r="2.5" fill="var(--color-art-cream)" stroke="none" />
      <circle cx="64" cy="64" r="7" fill="var(--color-art-navy)" />
      <circle cx="64" cy="64" r="2.5" fill="var(--color-art-cream)" stroke="none" />
    </svg>
  );
}
