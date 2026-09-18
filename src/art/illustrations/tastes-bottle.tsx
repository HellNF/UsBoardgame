/**
 * Gusto Bottle — illustrazione di categoria «gusti» (id `tastes-bottle`).
 * Bottiglia: vetro di verde acqua, tappo, etichetta di crema col cuore.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
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
      <rect x="44" y="10" width="12" height="12" fill="var(--color-art-brown)" />
      <path
        d="M46 22h8v10c0 5 9 8 9 19v29a4 4 0 0 1-4 4H41a4 4 0 0 1-4-4V51c0-11 9-14 9-19z"
        fill="var(--color-art-teal)"
      />
      <rect x="42" y="52" width="16" height="18" fill="var(--color-art-cream)" stroke="none" />
      <path
        d="M50 66c-3-3-6-4-6-7a3.5 3.5 0 0 1 6-2 3.5 3.5 0 0 1 6 2c0 3-3 4-6 7z"
        fill="var(--color-art-red)"
        stroke="none"
      />
    </svg>
  );
}
