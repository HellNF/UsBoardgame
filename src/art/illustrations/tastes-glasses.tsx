/**
 * Gusto Glasses — illustrazione di categoria «gusti» (id `tastes-glasses`).
 * Calici: due coppe di rosso che brindano, con i raggi d'ambra.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesGlasses({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M28 24h20l-1 15a9 9 0 0 1-18 0z" fill="var(--color-art-red)" />
      <path d="M38 48v20M29 70h18" strokeWidth={4.5} />
      <g transform="rotate(12 66 40)">
        <path d="M56 24h20l-1 15a9 9 0 0 1-18 0z" fill="var(--color-art-red)" />
        <path d="M66 48v20M57 70h18" strokeWidth={4.5} />
      </g>
      <path d="M48 12v7M44 15.5h8M62 10v7M58 13.5h8" stroke="var(--color-art-amber)" strokeWidth={3.5} />
    </svg>
  );
}
