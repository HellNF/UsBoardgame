/**
 * Profonda Hourglass — illustrazione di categoria «profonde» (id `deep-hourglass`).
 * Clessidra: calotte d'acciaio, vetro di crema e sabbia d'ambra.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepHourglass({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <rect x="24" y="10" width="52" height="11" rx="3" fill="var(--color-art-blue)" />
      <rect x="24" y="79" width="52" height="11" rx="3" fill="var(--color-art-blue)" />
      <path d="M30 21h40v9L53 50l17 20v9H30v-9l17-20z" fill="var(--color-art-cream)" />
      <path d="M35 26h30L52 46z" fill="var(--color-art-amber)" stroke="none" />
      <path d="M37 78h26c-1-8-5-13-13-13s-12 5-13 13z" fill="var(--color-art-amber)" stroke="none" />
    </svg>
  );
}
