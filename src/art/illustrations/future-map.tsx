/**
 * Mappa — illustrazione di categoria «futuro» (id `future-map`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
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
      {/* Mappa piegata, con la strada e la croce del tesoro. */}
      <path d="M12 28 36 22l28 8 24-6v48l-24 6-28-8-24 6z" />
      <path d="M36 22v48M64 30v48" strokeWidth={3.5} />
      <path d="M24 64c8-8 10-18 18-18s12 8 20 2" strokeWidth={4} />
      <path d="M72 38l10 10M82 38l-10 10" strokeWidth={5} />
    </svg>
  );
}
