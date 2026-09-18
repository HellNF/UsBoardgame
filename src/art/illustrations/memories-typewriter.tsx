/**
 * Macchina da scrivere — illustrazione di categoria «ricordi» (id `memories-typewriter`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
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
      {/* Foglio con tre righe scritte, rullo pieno e tastiera. */}
      <rect x="28" y="12" width="44" height="40" />
      <path d="M38 24h26M38 32h18M38 40h22" strokeWidth={3.5} />
      <rect x="16" y="52" width="68" height="30" rx="4" />
      <rect x="16" y="52" width="68" height="6" fill="currentColor" />
      <path d="M28 70h44" strokeWidth={3.5} />
    </svg>
  );
}
