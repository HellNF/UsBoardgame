/**
 * Valigia — illustrazione di categoria «ricordi» (id `memories-suitcase`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesSuitcase({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Manico, corpo con due cinghie e la serratura piena. */}
      <path d="M40 30v-6a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v6" />
      <rect x="12" y="30" width="76" height="50" rx="6" />
      <path d="M32 30v50M68 30v50" strokeWidth={4} />
      <rect x="45" y="48" width="10" height="14" rx="2" fill="currentColor" />
    </svg>
  );
}
