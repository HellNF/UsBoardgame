/**
 * Spazzolino — illustrazione di categoria «buffe» (id `funny-toothbrush`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyToothbrush({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Manico orizzontale, testina e quattro setole. */}
      <path d="M12 62h46" strokeWidth={7} />
      <rect x="58" y="52" width="28" height="20" rx="6" />
      <path d="M64 52V40M72 52V40M80 52V40" strokeWidth={4} />
      <circle cx="16" cy="62" r="4" fill="currentColor" />
    </svg>
  );
}
