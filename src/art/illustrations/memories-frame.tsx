/**
 * Ricordo Frame — illustrazione di categoria «ricordi» (id `memories-frame`).
 * Cornice: paesaggio di verde col sole d'ambra dentro la carta.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesFrame({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <rect x="16" y="20" width="68" height="62" rx="3" fill="var(--color-art-cream)" />
      <path d="M25 74 42 48l11 15 8-10 14 21z" fill="var(--color-art-green)" />
      <circle cx="63" cy="38" r="7" fill="var(--color-art-amber)" />
    </svg>
  );
}
