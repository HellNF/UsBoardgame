/**
 * Profonda Roots — illustrazione di categoria «profonde» (id `deep-roots`).
 * Radici: dal ceppo si aprono in forcelle, in marrone.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepRoots({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M46 10h8v14h-8z" fill="var(--color-art-forest)" />
      <path d="M50 24v8" stroke="var(--color-art-brown)" strokeWidth={5} />
      <path
        d="M50 30c-8 7-13 13-17 26M50 30c8 7 13 13 17 26M50 32v28"
        stroke="var(--color-art-brown)"
        strokeWidth={4.5}
      />
      <path
        d="M33 56c-4 5-6 9-8 14M33 56c1 6 1 10-1 15M67 56c4 5 6 9 8 14M67 56c-1 6-1 10 1 15M50 60c-2 6-3 10-4 14M50 60c2 6 3 10 4 14"
        stroke="var(--color-art-brown)"
        strokeWidth={3.5}
      />
    </svg>
  );
}
