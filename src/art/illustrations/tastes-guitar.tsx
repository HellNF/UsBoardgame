/**
 * Chitarra — illustrazione di categoria «gusti» (id `tastes-guitar`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesGuitar({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Corpo a due lobi in verticale, buca piena nel lobo grande e manico con la paletta. */}
      <circle cx="40" cy="66" r="22" />
      <circle cx="46" cy="40" r="16" />
      <circle cx="40" cy="64" r="7" fill="currentColor" />
      <path d="M57 27 76 8" strokeWidth={7} />
      <circle cx="81" cy="6" r="8" fill="currentColor" />
    </svg>
  );
}
