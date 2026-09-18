/**
 * Gusto Bread — illustrazione di categoria «gusti» (id `tastes-bread`).
 * Pane: pagnotta di marrone coi tagli di crema.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesBread({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <ellipse cx="50" cy="56" rx="35" ry="25" fill="var(--color-art-brown)" />
      <path d="M35 36 29 54M50 32 44 58M65 36 59 54" stroke="var(--color-art-cream)" strokeWidth={5} />
      <path d="M22 46c4-8 14-13 26-13" stroke="var(--color-art-cream)" strokeWidth={4} />
    </svg>
  );
}
