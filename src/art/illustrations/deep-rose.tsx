/**
 * Profonda Rose — illustrazione di categoria «profonde» (id `deep-rose`).
 * Rosa: boccio di rosso con la spirale dentro, foglie di verde e stelo.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepRose({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <circle cx="50" cy="34" r="19" fill="var(--color-art-red)" />
      <path
        d="M50 25c5 1 8 5 8 9s-3 7-7 7-6-3-5-6c1-2 3-3 5-2"
        stroke="var(--color-art-navy)"
        strokeWidth={3.5}
      />
      <path d="M50 53v30" stroke="var(--color-art-forest)" strokeWidth={5} />
      <path d="M50 62c-9-6-16-4-19 3 6 6 14 5 19-3z" fill="var(--color-art-green)" />
      <path d="M50 71c9-6 16-4 19 3-6 6-14 5-19-3z" fill="var(--color-art-green)" />
    </svg>
  );
}
