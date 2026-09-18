/**
 * Bottiglia — illustrazione di categoria «gusti» (id `tastes-bottle`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesBottle({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Corpo e collo, con la targhetta piena. */}
      <path d="M44 18h12v12l6 8v34a10 10 0 0 1-10 10H48a10 10 0 0 1-10-10V38l6-8z" />
      <rect x="40" y="48" width="20" height="18" fill="currentColor" />
      <rect x="43" y="8" width="14" height="10" fill="currentColor" />
    </svg>
  );
}
