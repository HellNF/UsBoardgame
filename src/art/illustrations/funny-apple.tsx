/**
 * Mela — illustrazione di categoria «buffe» (id `funny-apple`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyApple({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Due lobi, la foglia piena e il picciolo. */}
      <circle cx="38" cy="56" r="22" />
      <circle cx="62" cy="56" r="22" />
      <path d="M50 36V20" strokeWidth={5} />
      <path d="M50 28c6-10 16-10 20-8-2 10-12 14-20 8z" fill="currentColor" />
    </svg>
  );
}
