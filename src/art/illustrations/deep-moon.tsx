/**
 * Profonda Moon — illustrazione di categoria «profonde» (id `deep-moon`).
 * Luna: falce d'ambra, stella in inchiostro nel vuoto della falce.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepMoon({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <circle cx="44" cy="50" r="34" fill="var(--color-art-amber)" />
      <circle cx="62" cy="50" r="30" fill="var(--color-art-paper)" />
      <path
        d="M 74.0 27.0 L 77.8 36.7 L 88.3 37.4 L 80.2 44.0 L 82.8 54.1 L 74.0 48.5 L 65.2 54.1 L 67.8 44.0 L 59.7 37.4 L 70.2 36.7 Z"
        fill="var(--color-art-navy)"
        stroke="none"
      />
      <path d="M24 20v10M19 25h10" stroke="var(--color-art-amber)" strokeWidth={3.5} />
    </svg>
  );
}
