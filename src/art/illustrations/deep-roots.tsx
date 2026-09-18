/**
 * Radici — illustrazione di categoria «profonde» (id `deep-roots`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepRoots({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Radici: dal tronco si aprono, si allargano e si biforcano in punte sottili. */}
      <path d="M46 12h8v18h-8z" fill="currentColor" />
      <path d="M14 38h72" strokeWidth={2.5} strokeDasharray="5 7" />
      <path d="M50 30v14M50 38c-9 8-15 14-19 28M50 38c9 8 15 14 19 28" strokeWidth={5} />
      <path d="M32 64c-4 6-6 10-8 16M32 64c1 7 1 11-1 16" strokeWidth={3.5} />
      <path d="M68 64c4 6 6 10 8 16M68 64c-1 7-1 11 1 16" strokeWidth={3.5} />
      <path d="M50 68c-2 6-3 10-4 14M50 68c2 6 3 10 4 14" strokeWidth={3.5} />
    </svg>
  );
}
