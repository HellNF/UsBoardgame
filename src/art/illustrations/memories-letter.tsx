/**
 * Lettera — illustrazione di categoria «ricordi» (id `memories-letter`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesLetter({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Busta chiusa, con il lembo disegnato e il francobollo pieno. */}
      <rect x="12" y="30" width="76" height="48" rx="4" />
      <path d="M12 34 50 60l38-26" />
      <rect x="70" y="38" width="12" height="14" fill="currentColor" />
    </svg>
  );
}
