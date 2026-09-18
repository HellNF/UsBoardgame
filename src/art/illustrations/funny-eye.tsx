/**
 * Buffa Eye — illustrazione di categoria «buffe» (id `funny-eye`).
 * Occhio: bianco di crema, iride di blu, pupilla in inchiostro e ciglia.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
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
      <path d="M12 50c14-18 62-18 76 0-14 18-62 18-76 0z" fill="var(--color-art-cream)" />
      <circle cx="50" cy="50" r="15" fill="var(--color-art-blue)" />
      <circle cx="50" cy="50" r="7" fill="var(--color-art-navy)" stroke="none" />
      <path d="M50 14v9M24 20l6 8M76 20l-6 8M16 34l9 5M84 34l-9 5" strokeWidth={4} />
    </svg>
  );
}
