/**
 * Dado — illustrazione di categoria «buffe» (id `funny-dice`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyDice({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Quadrato con cinque punti pieni. */}
      <rect x="16" y="16" width="68" height="68" rx="10" />
      <circle cx="32" cy="32" r="5" fill="currentColor" />
      <circle cx="68" cy="32" r="5" fill="currentColor" />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
      <circle cx="32" cy="68" r="5" fill="currentColor" />
      <circle cx="68" cy="68" r="5" fill="currentColor" />
    </svg>
  );
}
