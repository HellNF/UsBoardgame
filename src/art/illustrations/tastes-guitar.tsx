/**
 * Chitarra — illustrazione di categoria «gusti» (id `tastes-guitar`).
 * Corpo a otto, buca, manico e note.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesGuitar({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Corpo a otto con la buca, manico sottile inclinato e paletta: una chitarra, non un banjo. */}
      <circle cx="40" cy="40" r="16" fill="var(--color-art-amber)" />
      <circle cx="38" cy="68" r="20" fill="var(--color-art-amber)" />
      <circle cx="39" cy="55" r="7" fill="var(--color-art-navy)" stroke="none" />
      <g transform="rotate(-40 50 50)">
        <rect x="50" y="20" width="9" height="34" fill="var(--color-art-brown)" />
        <rect x="45" y="8" width="19" height="14" rx="4" fill="var(--color-art-brown)" />
        <path d="M51 6v18M58 6v18" stroke="var(--color-art-navy)" strokeWidth={3} />
      </g>
      <path d="M14 22l5 5-5 5-5-5zM90 34v8M86 38h8" stroke="var(--color-art-navy)" strokeWidth={3.5} />
    </svg>
  );
}
