/**
 * Rosa — illustrazione di categoria «profonde» (id `deep-rose`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepRose({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Bocciolo a spirale, gambo e due foglie: quella di sinistra è piena. */}
      <circle cx="50" cy="30" r="18" />
      <path d="M50 46a16 16 0 1 1 16-16" strokeWidth={4} />
      <path d="M50 40a11 11 0 1 0-11-10" strokeWidth={4} />
      <path d="M50 48v40" strokeWidth={5} />
      <path d="M50 64c-11-2-15-10-15-17 9 0 15 7 15 17z" fill="currentColor" />
      <path d="M50 76c11-2 15-10 15-17-9 0-15 7-15 17z" />
    </svg>
  );
}
