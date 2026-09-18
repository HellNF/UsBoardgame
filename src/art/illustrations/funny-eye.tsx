/**
 * Occhio — illustrazione di categoria «buffe» (id `funny-eye`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyEye({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Palpebra, iride, pupilla piena e tre ciglia. */}
      <path d="M12 52c10-16 24-22 38-22s28 6 38 22c-10 16-24 22-38 22S22 68 12 52z" />
      <circle cx="50" cy="52" r="14" />
      <circle cx="50" cy="52" r="7" fill="currentColor" />
      <path d="M28 28 22 18M50 24V12M72 28l6-10" strokeWidth={4} />
    </svg>
  );
}
