/**
 * Profonda Candle — illustrazione di categoria «profonde» (id `deep-candle`).
 * Candela: cero di crema col gocciolo, fiamma d'ambra e candeliere pieno.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepCandle({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M50 10c9 12 9 19 0 26-9-7-9-14 0-26z" fill="var(--color-art-amber)" />
      <path d="M50 36v5" strokeWidth={4} />
      <rect x="38" y="41" width="24" height="38" rx="3" fill="var(--color-art-cream)" />
      <path d="M62 50v9a4 4 0 0 1-8 0" strokeWidth={3.5} />
      <path d="M24 83h52l-6-8H30z" fill="var(--color-art-navy)" />
      <path d="M20 26v9M15.5 30.5h9" stroke="var(--color-art-amber)" strokeWidth={3.5} />
    </svg>
  );
}
