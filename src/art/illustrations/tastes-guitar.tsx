/**
 * Chitarra — illustrazione di categoria «gusti» (id `tastes-guitar`).
 * Forme e tinte dalla reference del proprietario (D-75): docs/design.md § Illustrazioni SVG.
 *
 * Il corpo è **un profilo solo con la vita**, non due cerchi sovrapposti: a 48 px due cerchi si
 * fondono in una massa tonda e la chitarra si leggeva come un palloncino o un lecca-lecca (era
 * l'ultimo disegno debole rimasto dopo il colore). Il manico sale **verso destra**, che è anche
 * la parte della casella dove l'alone del numero non arriva.
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
      {/* Il manico e la paletta: sotto il corpo, così la vita resta netta. */}
      <path d="M49 50 72 30" stroke="var(--color-art-navy)" strokeWidth={7} />
      <path d="M70 24 80 22 82 30 72 33z" fill="var(--color-art-navy)" />
      {/* Il corpo: spalle strette, vita, fondo largo. */}
      <path
        d="M43 50c7 0 12 4 12 9 0 4-3 6-3 9 0 3 5 5 5 11 0 8-7 13-15 13s-15-5-15-13c0-6 5-8 5-11 0-3-3-5-3-9 0-5 5-9 12-9z"
        fill="var(--color-art-brown)"
      />
      {/* La buca. */}
      <circle cx="42" cy="72" r="6" fill="var(--color-art-navy)" stroke="none" />
    </svg>
  );
}
