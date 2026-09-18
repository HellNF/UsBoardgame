/**
 * Futuro Key — illustrazione di categoria «future» (id `future-key`).
 * Chiave: anello e stelo d'ambra, foro di crema.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureKey({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <circle cx="34" cy="32" r="17" fill="var(--color-art-amber)" />
      <circle cx="34" cy="32" r="7" fill="var(--color-art-cream)" stroke="none" />
      <path d="M46 44 74 72" stroke="var(--color-art-amber)" strokeWidth={11} />
      <path d="M64 62l10 10M72 70l8-8" stroke="var(--color-art-amber)" strokeWidth={7} />
    </svg>
  );
}
