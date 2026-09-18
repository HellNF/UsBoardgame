/**
 * Futuro Sprout — illustrazione di categoria «future» (id `future-sprout`).
 * Piantina: vaso di terracotta e due foglie di verde.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureSprout({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <rect x="30" y="62" width="40" height="26" rx="3" fill="var(--color-art-terracotta)" />
      <path d="M28 62h44l-4-9H32z" fill="var(--color-art-terracotta)" />
      <path d="M50 62V36" strokeWidth={5} />
      <path d="M50 48c-12-1-20-9-20-20 12 0 20 8 20 20z" fill="var(--color-art-green)" />
      <path d="M50 45c12-1 20-9 20-20-12 0-20 8-20 20z" fill="var(--color-art-green)" />
    </svg>
  );
}
