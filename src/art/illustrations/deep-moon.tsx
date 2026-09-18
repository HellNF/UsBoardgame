/**
 * Luna — illustrazione di categoria «profonde» (id `deep-moon`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepMoon({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Falce di luna e una stella piena accanto. */}
      <path d="M64 12a38 38 0 1 0 0 76 30 30 0 0 1 0-76z" />
      <path d="M76 44l3 8 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="currentColor" />
    </svg>
  );
}
