/**
 * Clessidra — illustrazione di categoria «profonde» (id `deep-hourglass`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
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
      {/* Due coni con la sabbia: quella sotto è piena. */}
      <path d="M28 12h44M28 88h44" strokeWidth={6} />
      <path
        d="M34 12v14c0 10 16 12 16 22s-16 12-16 22v18M66 12v14c0 10-16 12-16 22s16 12 16 22v18"
        strokeWidth={4}
      />
      <path d="M42 22h16l-8 10z" fill="currentColor" />
      <path d="M40 76c4-8 16-8 20 0z" fill="currentColor" />
    </svg>
  );
}
