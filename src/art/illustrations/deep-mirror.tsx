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
      {/* Il manico: corto e largo, attaccato al corpo. */}
      <path d="M48 66h18l4 13c1 4-1 7-5 7H49c-4 0-6-3-5-7z" fill="currentColor" stroke="none" />
      {/*
       * Lo specchio è una **massa piena**, non una cornice a tratto: nella casella l'alone del
       * numero morde l'angolo in alto a sinistra del disegno (tutto ciò che sta sopra e a sinistra
       * di circa 47, 41), e un anello lì si apre — l'ovale si leggeva come una «C». Una massa il
       * morso lo regge come una tacca. È la regola di D-65 applicata a un'illustrazione.
       */}
      <ellipse cx="57" cy="44" rx="17" ry="22" fill="currentColor" stroke="none" />
      {/* Il riflesso: la fascia diagonale di carta che dice «superficie che riflette». */}
      <path d="M51 54 63 32" stroke="var(--color-paper)" strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
}
