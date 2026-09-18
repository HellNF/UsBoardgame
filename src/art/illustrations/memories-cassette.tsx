/**
 * Musicassetta — illustrazione di categoria «ricordi» (id `memories-cassette`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
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
      {/* Etichetta piena in alto e i due rocchetti. */}
      <rect x="10" y="28" width="80" height="48" rx="5" />
      <rect x="18" y="36" width="64" height="16" fill="currentColor" />
      <circle cx="36" cy="64" r="8" />
      <circle cx="64" cy="64" r="8" />
      <circle cx="36" cy="64" r="3" fill="currentColor" />
      <circle cx="64" cy="64" r="3" fill="currentColor" />
    </svg>
  );
}
