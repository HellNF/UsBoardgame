/**
 * Ricordo Ticket — illustrazione di categoria «ricordi» (id `memories-ticket`).
 * Biglietto: carta d'ambra col bordo tratteggiato e la stella di rosso.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesTicket({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <rect x="14" y="32" width="72" height="36" rx="3" fill="var(--color-art-amber)" />
      <rect x="20" y="37" width="60" height="26" rx="2" fill="none" strokeWidth={3} strokeDasharray="6 5" />
      <path
        d="M 50.0 38.0 L 52.9 46.0 L 61.4 46.3 L 54.8 51.5 L 57.1 59.7 L 50.0 55.0 L 42.9 59.7 L 45.2 51.5 L 38.6 46.3 L 47.1 46.0 Z"
        fill="var(--color-art-red)"
        stroke="none"
      />
    </svg>
  );
}
