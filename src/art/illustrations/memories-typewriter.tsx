/**
 * Ricordo Typewriter — illustrazione di categoria «ricordi» (id `memories-typewriter`).
 * Macchina da scrivere: corpo di verde acqua, foglio di crema, tasti.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesTypewriter({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      <path d="M24 42h52l6 24H18z" fill="var(--color-art-teal)" />
      <rect x="16" y="66" width="68" height="10" rx="3" fill="var(--color-art-teal)" />
      <rect x="36" y="14" width="28" height="24" fill="var(--color-art-cream)" />
      <path d="M30 34h40" strokeWidth={4} />
      <path d="M28 72h4M40 72h4M52 72h4M64 72h4" stroke="var(--color-art-cream)" strokeWidth={4} />
    </svg>
  );
}
