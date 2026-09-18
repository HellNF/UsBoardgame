/**
 * Calzino — illustrazione di categoria «buffe» (id `funny-sock`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnySock({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Polsino pieno in alto, una riga e il piede verso destra. */}
      <path d="M36 12h22v34c0 12 16 12 16 26a16 16 0 0 1-16 16c-14 0-22-8-22-20z" />
      <rect x="36" y="12" width="22" height="10" fill="currentColor" />
      <path d="M36 32h22" strokeWidth={4} />
    </svg>
  );
}
