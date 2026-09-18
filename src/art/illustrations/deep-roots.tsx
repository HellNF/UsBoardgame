/**
 * Radici — illustrazione di categoria «profonde» (id `deep-roots`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepRoots({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Chioma piena a tre lobi, tronco corto e radici sotto la linea di terra. */}
      <circle cx="50" cy="16" r="10" fill="currentColor" />
      <circle cx="35" cy="25" r="10" fill="currentColor" />
      <circle cx="65" cy="25" r="10" fill="currentColor" />
      <path d="M45 32h10v16H45z" />
      <path d="M12 52h76" strokeWidth={5} />
      <path d="M50 52v24M50 62c-8 6-14 8-18 18M50 68c8 6 12 8 16 14" strokeWidth={4} />
    </svg>
  );
}
