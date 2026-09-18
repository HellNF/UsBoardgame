/**
 * Buffa Dice — illustrazione di categoria «buffe» (id `funny-dice`).
 * Dado: quattro facce tonde, una per colore.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyDice({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <circle cx="34" cy="34" r="15" fill="var(--color-art-red)" />
      <circle cx="66" cy="34" r="15" fill="var(--color-art-amber)" />
      <circle cx="34" cy="66" r="15" fill="var(--color-art-blue)" />
      <circle cx="66" cy="66" r="15" fill="var(--color-art-green)" />
    </svg>
  );
}
