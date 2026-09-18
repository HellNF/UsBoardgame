/**
 * Buffa Banana — illustrazione di categoria «buffe» (id `funny-banana`).
 * Banana: una falce d'ambra, piena.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyBanana({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path
        d="M22 24c1 30 15 50 44 52 6 0 9-4 8-8-14-1-34-16-37-44 0-5-9-5-15 0z"
        fill="var(--color-art-amber)"
      />
    </svg>
  );
}
