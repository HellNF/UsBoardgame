/**
 * Cornice — illustrazione di categoria «ricordi» (id `memories-frame`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesFrame({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Cornice spessa con dentro due montagne piene e un sole. */}
      <rect x="16" y="22" width="68" height="58" rx="3" strokeWidth={6} />
      <path d="M26 70 44 48l12 14 8-8 12 16z" fill="currentColor" />
      <circle cx="62" cy="38" r="6" fill="currentColor" />
    </svg>
  );
}
