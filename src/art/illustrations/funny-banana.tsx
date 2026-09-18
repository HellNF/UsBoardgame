/**
 * Banana — illustrazione di categoria «buffe» (id `funny-banana`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function FunnyBanana({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Falce di banana con la punta piena. */}
      <path d="M22 26c0 30 20 52 50 56 8 1 12-5 8-10-22-6-36-22-42-46-2-6-16-6-16 0z" />
      <path d="M22 26c-4-6-10-4-12 0" strokeWidth={4} />
      <circle cx="76" cy="84" r="5" fill="currentColor" />
    </svg>
  );
}
