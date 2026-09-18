/**
 * Lucchetto — illustrazione di categoria «profonde» (id `deep-lock`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepLock({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Archetto, corpo e buco della serratura pieno. */}
      <path d="M32 46V36a18 18 0 0 1 36 0v10" strokeWidth={7} />
      <rect x="22" y="46" width="56" height="38" rx="5" />
      <circle cx="50" cy="60" r="6" fill="currentColor" />
      <path d="M50 66v9" strokeWidth={5} />
    </svg>
  );
}
