/**
 * Calici che brindano — illustrazione di categoria «gusti» (id `tastes-glasses`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function TastesGlasses({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Due calici che si toccano: coppe, steli dritti, piedi appoggiati e il tintinnio. */}
      <path d="M22 18h28l-6 18a8 8 0 0 1-16 0z" />
      <path d="M36 44v22M26 68h20" strokeWidth={5} />
      <path d="M26 28h20" strokeWidth={4} />
      <path d="M50 18h28l-6 18a8 8 0 0 1-16 0z" />
      <path d="M64 44v22M54 68h20" strokeWidth={5} />
      <path d="M54 28h20" strokeWidth={4} />
      <path d="M50 10v6M44 8l-2 4M56 8l2 4" strokeWidth={3.5} />
    </svg>
  );
}
