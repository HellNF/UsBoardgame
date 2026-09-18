/**
 * Tazza di caffè — illustrazione di categoria «gusti» (id `tastes-cup`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesCup({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Tazza con manico, caffè pieno e due fili di vapore. */}
      <path d="M28 44h40v14a18 18 0 0 1-18 18h-4a18 18 0 0 1-18-18z" />
      <path d="M68 50a10 10 0 0 1 0 18" />
      <path d="M22 84h56" strokeWidth={6} />
      <rect x="32" y="48" width="32" height="6" fill="currentColor" />
      <path d="M42 34c0-8 8-6 8-14M58 34c0-8 8-6 8-14" strokeWidth={4} />
    </svg>
  );
}
