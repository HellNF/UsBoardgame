/**
 * Cono gelato — illustrazione di categoria «gusti» (id `tastes-ice-cream`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesIceCream({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Cono con griglia, pallina scura a destra e ciliegina. */}
      <path d="M36 52 50 90l14-38z" />
      <path d="M42 62h16M45 72h10" strokeWidth={3.5} />
      <circle cx="50" cy="40" r="18" />
      <path d="M50 22a18 18 0 0 1 0 36z" fill="currentColor" />
      <circle cx="50" cy="16" r="5" fill="currentColor" />
    </svg>
  );
}
