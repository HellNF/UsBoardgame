/**
 * Aereo di carta — illustrazione di categoria «futuro» (id `future-plane`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FuturePlane({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Punta a destra, con l'ala sinistra piena. */}
      <path d="M10 60 90 18 54 88 44 60z" />
      <path d="M44 60 90 18" strokeWidth={4} />
      <path d="M10 60 44 60 54 88z" fill="currentColor" />
    </svg>
  );
}
