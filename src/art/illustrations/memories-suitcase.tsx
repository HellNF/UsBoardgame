/**
 * Ricordo Suitcase — illustrazione di categoria «ricordi» (id `memories-suitcase`).
 * Valigia: cuoio marrone, manico, e gli adesivi dei viaggi.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesSuitcase({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <rect x="14" y="36" width="72" height="44" rx="5" fill="var(--color-art-brown)" />
      <path d="M34 36V30a10 10 0 0 1 10-10h12a10 10 0 0 1 10 10v6" fill="none" />
      <path d="M15 54h70" strokeWidth={4} />
      <circle cx="38" cy="64" r="7" fill="var(--color-art-blue)" stroke="none" />
      <circle cx="60" cy="68" r="6" fill="var(--color-art-amber)" stroke="none" />
      <path d="M52 46l6-8 6 8z" fill="var(--color-art-cream)" stroke="none" />
    </svg>
  );
}
