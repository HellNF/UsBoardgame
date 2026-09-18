/**
 * Spazzolino — illustrazione di categoria «buffe» (id `funny-toothbrush`).
 * Manico, testina e setole.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyToothbrush({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Manico dritto di rosso, testina di crema e setole di blu. */}
      <rect x="12" y="64" width="52" height="13" rx="6.5" fill="var(--color-art-red)" />
      <rect x="58" y="56" width="30" height="15" rx="5" fill="var(--color-art-cream)" />
      <path d="M64 51v-9M72 51v-11M80 51v-9" stroke="var(--color-art-blue)" strokeWidth={4} />
    </svg>
  );
}
