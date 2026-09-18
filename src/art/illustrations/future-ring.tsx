/**
 * Anello — illustrazione di categoria «futuro» (id `future-ring`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureRing({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Cerchio con la pietra: la metà alta è piena. */}
      <circle cx="50" cy="64" r="22" strokeWidth={7} />
      <path d="M50 12 66 30 50 48 34 30z" />
      <path d="M50 12 66 30H34z" fill="currentColor" />
    </svg>
  );
}
