/**
 * Buffa Apple — illustrazione di categoria «buffe» (id `funny-apple`).
 * Mela: corpo di rosso con lucentezza di carta, picciolo e foglia.
 * Forme e tinte dalla reference del proprietario (D-68): docs/design.md § Illustrazioni SVG.
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
      <path
        d="M50 34c-10-8-26-3-27 11-1 15 9 30 17 33 4 2 6 2 10 0 8-3 18-18 17-33-1-14-17-19-27-11z"
        fill="var(--color-art-red)"
      />
      <path d="M50 34V22" strokeWidth={5} />
      <path d="M52 25c5-8 14-10 19-8 2 6-5 14-13 14z" fill="var(--color-art-green)" />
      <path d="M37 44c-4 6-6 12-5 18" stroke="var(--color-art-paper)" strokeWidth={3.5} />
    </svg>
  );
}
