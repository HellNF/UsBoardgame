/**
 * Gabbia aperta — illustrazione di categoria «futuro» (id `future-cage`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureCage({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Cupola con tre sbarre, porticina spalancata e fondo pieno. */}
      <path d="M20 62V42a30 30 0 0 1 60 0v20" />
      <path d="M34 62V42M50 62V34M66 62V42" strokeWidth={4} />
      <path d="M66 42 88 34v28" strokeWidth={4} />
      <rect x="16" y="62" width="68" height="8" rx="4" fill="currentColor" />
    </svg>
  );
}
