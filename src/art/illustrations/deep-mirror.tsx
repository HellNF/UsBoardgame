/**
 * Specchio — illustrazione di categoria «profonde» (id `deep-mirror`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 *
 * Uno specchio a mano **visto di fronte**: ovale con la cornice spessa in inchiostro, manico
 * corto e largo in basso (un manico lungo fa la racchetta), e dentro il **riflesso** — una
 * fascia diagonale di carta su un fondo di inchiostro. Il riflesso è il segno che dice
 * «superficie che riflette»: senza, un ovale resta un ovale, e si legge come una lente o un
 * trofeo (H1).
 *
 * L'ovale è **più alto che largo**: un cerchio con un manico sotto si legge come un lecca-lecca.
 * La cornice non tocca il fondo — fra i due c'è una fascia di carta, perché due inchiostri a
 * contatto si fondono in una macchia sola (D-65).
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
      {/* Il manico: corto e largo, attaccato alla cornice. */}
      <path d="M41 60h18l5 15c1 4-1 7-5 7H41c-4 0-6-3-5-7z" fill="currentColor" stroke="none" />
      {/* Il fondo dello specchio: inchiostro pieno, staccato dalla cornice da una fascia di carta. */}
      <ellipse cx="50" cy="38" rx="11.5" ry="17.5" fill="currentColor" stroke="none" />
      {/* Il riflesso: una fascia diagonale di carta, tutta dentro il fondo. */}
      <path d="M45 44 53 28" stroke="var(--color-paper)" strokeWidth={9} strokeLinecap="round" />
      {/* La cornice. */}
      <ellipse cx="50" cy="38" rx="20" ry="26" strokeWidth={9} />
    </svg>
  );
}
