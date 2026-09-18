/**
 * Gusto Cup — illustrazione di categoria «gusti» (id `tastes-cup`).
 * Tazza: crema su piattino, con il manico e il fumo.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesCup({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M22 40h40v14a20 20 0 0 1-40 0z" fill="var(--color-art-cream)" />
      <path d="M62 45h5a8 8 0 0 1 0 16h-5" fill="none" />
      <path d="M16 78h56" strokeWidth={7} />
      <path d="M32 32c4-6 0-9 2-15M46 32c4-6 0-9 2-15" stroke="var(--color-art-brown)" strokeWidth={4} />
    </svg>
  );
}
