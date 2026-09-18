/**
 * Specchio — illustrazione di categoria «profonde» (id `deep-mirror`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function DeepMirror({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Specchio a mano: metà vetro è scura, come se ci fosse un riflesso. */}
      <ellipse cx="50" cy="36" rx="24" ry="26" />
      <path d="M50 10a24 26 0 0 1 0 52z" fill="currentColor" />
      <path d="M50 62v26M40 62h20" strokeWidth={6} />
    </svg>
  );
}
