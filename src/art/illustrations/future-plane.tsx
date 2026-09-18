/**
 * Futuro Plane — illustrazione di categoria «future» (id `future-plane`).
 * Aereo di carta: ali di crema, piega in inchiostro e scia tratteggiata.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
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
      <path d="M12 56 88 16 54 86 44 60z" fill="var(--color-art-cream)" />
      <path d="M44 60 88 16" strokeWidth={5} />
      <path d="M10 76c6-2 11-5 15-9M13 89c8-3 15-7 21-14" strokeWidth={3.5} strokeDasharray="5 6" />
    </svg>
  );
}
