/**
 * Candela — illustrazione di categoria «profonde» (id `deep-candle`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepCandle({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Fiamma piena, cerone col gocciolo e candeliere. */}
      <path d="M50 10c9 12 9 18 0 26-9-8-9-14 0-26z" fill="currentColor" />
      <path d="M50 36v4" strokeWidth={4} />
      <rect x="38" y="40" width="24" height="42" rx="3" />
      <path d="M62 48v10a4 4 0 0 1-8 0" strokeWidth={4} />
      <path d="M26 82h48" strokeWidth={6} />
    </svg>
  );
}
