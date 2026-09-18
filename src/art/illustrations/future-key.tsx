/**
 * Chiave — illustrazione di categoria «futuro» (id `future-key`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureKey({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Anello con il foro pieno, fusto e due denti. */}
      <circle cx="32" cy="34" r="18" />
      <circle cx="32" cy="34" r="7" fill="currentColor" />
      <path d="M44 46 82 84" strokeWidth={7} />
      <path d="M70 72 60 82M78 80 68 90" strokeWidth={6} />
    </svg>
  );
}
