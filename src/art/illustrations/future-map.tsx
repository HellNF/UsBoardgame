/**
 * Futuro Map — illustrazione di categoria «future» (id `future-map`).
 * Mappa: carta di sabbia, pieghe, la strada tratteggiata e la croce di rosso.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureMap({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M18 24 40 16l20 10 22-8v56l-22 8-20-10-22 8z" fill="var(--color-art-sand)" />
      <path d="M18 24 40 16l20 10 22-8v14H18z" fill="var(--color-art-green)" />
      <path d="M40 30v50M60 26v56" strokeWidth={4} />
      <path
        d="M26 44c8 2 10 10 18 10s10-8 16-4"
        stroke="var(--color-art-red)"
        strokeWidth={4}
        strokeDasharray="6 5"
      />
      <path d="M70 60l8 8M78 60l-8 8" stroke="var(--color-art-red)" strokeWidth={6} />
    </svg>
  );
}
