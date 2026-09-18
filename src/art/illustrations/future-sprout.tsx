/**
 * Piantina — illustrazione di categoria «futuro» (id `future-sprout`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureSprout({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Vaso con le foglie: quella di sinistra è piena. */}
      <path d="M32 62h36l-6 24H38z" />
      <path d="M26 58h48" strokeWidth={6} />
      <path d="M50 58V36" strokeWidth={5} />
      <path d="M50 44c-10-2-14-10-14-16 9 0 14 6 14 16z" fill="currentColor" />
      <path d="M50 46c10-2 14-10 14-16-9 0-14 6-14 16z" />
    </svg>
  );
}
