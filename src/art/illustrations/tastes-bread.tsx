/**
 * Filone di pane — illustrazione di categoria «gusti» (id `tastes-bread`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesBread({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Crosta piena in basso e tre tagli sulla superficie. */}
      <rect x="14" y="38" width="72" height="34" rx="15" />
      <rect x="14" y="64" width="72" height="8" rx="4" fill="currentColor" />
      <path d="M32 50l8-8M48 50l8-8M64 50l8-8" strokeWidth={4} />
    </svg>
  );
}
