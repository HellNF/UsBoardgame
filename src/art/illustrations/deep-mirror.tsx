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
      {/* Specchio da tavolo: cornice ovale, due zampe svasate e il piede a barra. */}
      <ellipse cx="50" cy="34" rx="18" ry="22" strokeWidth={8} />
      <path d="M43 53 36 70M57 53 64 70" strokeWidth={6} />
      <path d="M28 73h44" strokeWidth={7} />
    </svg>
  );
}
