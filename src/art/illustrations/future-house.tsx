/**
 * Futuro House — illustrazione di categoria «future» (id `future-house`).
 * Casa: tetto di rosso, muri di crema, porta marrone e finestra d'ambra.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureHouse({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M50 16 88 48H12z" fill="var(--color-art-red)" />
      <rect x="24" y="48" width="52" height="36" fill="var(--color-art-cream)" />
      <path d="M42 84V62h16v22z" fill="var(--color-art-brown)" />
      <path d="M30 57h11v11H30z" fill="var(--color-art-amber)" />
    </svg>
  );
}
