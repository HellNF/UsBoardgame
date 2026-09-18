/**
 * Profonda Mirror — illustrazione di categoria «profonde» (id `deep-mirror`).
 * Specchio a mano: cornice d'ambra, vetro di cielo e manico corto.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepMirror({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <ellipse cx="50" cy="40" rx="27" ry="30" fill="var(--color-art-amber)" />
      <ellipse cx="50" cy="40" rx="17" ry="19" fill="var(--color-art-sky)" />
      <path d="M39 47c1-7 6-12 13-15" stroke="var(--color-art-paper)" strokeWidth={4} />
      <rect x="43" y="67" width="14" height="17" rx="6" fill="var(--color-art-amber)" />
      <path d="M78 20v10M73 25h10" stroke="var(--color-art-amber)" strokeWidth={3.5} />
    </svg>
  );
}
