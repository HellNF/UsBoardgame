/**
 * Telefono — illustrazione di categoria «ricordi» (id `memories-phone`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesPhone({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Telefono a disco: corpo, disco in basso a sinistra e cornetta appoggiata sopra. */}
      <path d="M14 54h72v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" />
      <circle cx="38" cy="69" r="9" strokeWidth={5} />
      <circle cx="38" cy="69" r="3" fill="currentColor" />
      <path d="M26 54c0-11 8-17 24-17s24 6 24 17" strokeWidth={9} strokeLinecap="round" />
      <circle cx="26" cy="51" r="7" fill="currentColor" />
      <circle cx="74" cy="51" r="7" fill="currentColor" />
    </svg>
  );
}
