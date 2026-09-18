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
      {/* Cornetta appoggiata sul corpo (i due padiglioni sono pieni) e disco al centro. */}
      <rect x="24" y="42" width="52" height="16" rx="8" />
      <circle cx="30" cy="50" r="10" fill="currentColor" />
      <circle cx="70" cy="50" r="10" fill="currentColor" />
      <rect x="16" y="60" width="68" height="26" rx="5" />
      <circle cx="50" cy="73" r="8" fill="currentColor" />
      <path d="M84 62c6 8 4 16-2 20" strokeWidth={3.5} />
    </svg>
  );
}
