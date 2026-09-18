/**
 * Buffa Sock — illustrazione di categoria «buffe» (id `funny-sock`).
 * Calzino: crema con la punta e il tallone di blu e due righe in cima.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnySock({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M38 12h26v32c0 12-4 18-14 24-8 5-15 3-15-5 0-6 4-9 10-11" fill="var(--color-art-cream)" />
      <path d="M38 20h26" strokeWidth={4} />
      <rect x="38" y="22" width="26" height="6" fill="var(--color-art-blue)" stroke="none" />
      <rect x="38" y="30" width="26" height="7" fill="var(--color-art-red)" stroke="none" />
      <circle cx="42" cy="74" r="9" fill="var(--color-art-blue)" stroke="none" />
    </svg>
  );
}
