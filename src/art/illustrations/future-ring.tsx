/**
 * Futuro Ring — illustrazione di categoria «future» (id `future-ring`).
 * Anello: fascia d'ambra e diamante di blu, con la scintilla.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureRing({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <circle cx="50" cy="64" r="23" fill="none" stroke="var(--color-art-amber)" strokeWidth={9} />
      <path d="M50 14l14 14-14 14-14-14z" fill="var(--color-art-blue)" />
      <path d="M80 24v10M75 29h10" stroke="var(--color-art-amber)" strokeWidth={3.5} />
    </svg>
  );
}
