/**
 * Profonda Lock — illustrazione di categoria «profonde» (id `deep-lock`).
 * Lucchetto: corpo di rosso, archetto e toppa in inchiostro.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepLock({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M35 46V34a15 15 0 0 1 30 0v12" strokeWidth={6.5} />
      <rect x="21" y="46" width="58" height="42" rx="9" fill="var(--color-art-red)" />
      <circle cx="50" cy="62" r="7" fill="var(--color-art-navy)" stroke="none" />
      <path d="M46 66h8l2 11H44z" fill="var(--color-art-navy)" stroke="none" />
    </svg>
  );
}
