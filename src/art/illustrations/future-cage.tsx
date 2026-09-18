/**
 * Futuro Cage — illustrazione di categoria «future» (id `future-cage`).
 * Gabbia aperta: sbarre d'ambra su base piena, con la pallina in cima.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FutureCage({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
        d="M28 84V48c0-14 10-24 22-24s22 10 22 24v36"
        fill="none"
        stroke="var(--color-art-amber)"
        strokeWidth={6}
      />
      <path d="M38 84V44M50 84V34M62 84V44" stroke="var(--color-art-amber)" strokeWidth={5} />
      <path d="M20 84h60" strokeWidth={7} />
      <circle cx="50" cy="16" r="6" fill="var(--color-art-amber)" />
    </svg>
  );
}
