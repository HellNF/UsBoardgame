/**
 * Casa — illustrazione di categoria «futuro» (id `future-house`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureHouse({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Tetto, porta piena e una finestra tonda. */}
      <path d="M14 50 50 20l36 30" strokeWidth={6} />
      <rect x="24" y="50" width="52" height="34" />
      <rect x="42" y="60" width="16" height="24" fill="currentColor" />
      <circle cx="34" cy="62" r="4" fill="currentColor" />
    </svg>
  );
}
