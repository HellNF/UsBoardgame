/**
 * Sveglia — illustrazione di categoria «buffe» (id `funny-alarm`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyAlarm({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Campanelli dritti, quadrante con le lancette e i piedini. */}
      <path d="M26 30 14 18M74 30l12-12" strokeWidth={6} />
      <circle cx="50" cy="58" r="28" />
      <path d="M50 58V40M50 58l12 10" strokeWidth={4} />
      <circle cx="50" cy="58" r="4" fill="currentColor" />
      <path d="M34 84l-8 8M66 84l8 8" strokeWidth={5} />
    </svg>
  );
}
