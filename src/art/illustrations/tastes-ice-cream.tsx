/**
 * Gusto IceCream — illustrazione di categoria «gusti» (id `tastes-ice-cream`).
 * Cono: cialda di sabbia e tre palle, una per colore.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
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
      <path d="M32 50h36L50 88z" fill="var(--color-art-sand)" />
      <path d="M36 58 58 72M41 50 60 84M64 58 40 72" stroke="var(--color-art-brown)" strokeWidth={3} />
      <circle cx="38" cy="44" r="13" fill="var(--color-art-red)" />
      <circle cx="62" cy="44" r="13" fill="var(--color-art-teal)" />
      <circle cx="50" cy="29" r="14" fill="var(--color-art-amber)" />
    </svg>
  );
}
