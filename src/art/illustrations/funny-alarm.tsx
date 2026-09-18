/**
 * Buffa Alarm — illustrazione di categoria «buffe» (id `funny-alarm`).
 * Sveglia: cassa di rosso, quadrante di crema, campane e zampe.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyAlarm({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <circle cx="50" cy="52" r="30" fill="var(--color-art-red)" />
      <circle cx="50" cy="52" r="21" fill="var(--color-art-cream)" />
      <path d="M50 52V38M50 52l10 7" strokeWidth={5} />
      <path d="M32 26c-5-5-11-4-13 1 3 5 9 5 13-1z" fill="var(--color-art-amber)" />
      <path d="M68 26c5-5 11-4 13 1-3 5-9 5-13-1z" fill="var(--color-art-amber)" />
      <path d="M38 80l-6 9M62 80l6 9" strokeWidth={5} />
      <path d="M14 50h-5M91 50h-5" stroke="var(--color-art-amber)" strokeWidth={4} />
    </svg>
  );
}
