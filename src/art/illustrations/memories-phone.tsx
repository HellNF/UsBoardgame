/**
 * Telefono — illustrazione di categoria «ricordi» (id `memories-phone`).
 * Forme e tinte dalla reference del proprietario (D-75): docs/design.md § Illustrazioni SVG.
 *
 * Terza versione, e le due precedenti dicono cos'è che fa leggere un telefono a 48 px. Non è il
 * disco: è la **cornetta appoggiata di traverso sopra il corpo**. Prima la cornetta era un arco
 * che curvava in alto con due palle alle estremità — a quella misura è un *manico*, e con un
 * corpo rettangolare sotto il disegno diventava una borsa o una macchina fotografica.
 *
 * Adesso la cornetta è una sbarra orizzontale con le estremità tonde, staccata dal corpo da una
 * striscia di carta, e il corpo è un **trapezio** (più largo in basso): due segni che un telefono
 * ha e una borsa no. Sta tutto sotto y 40, quindi fuori dall'alone del numero della casella.
 */
import type { IllustrationProps } from "./types";

export function MemoriesPhone({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Il corpo: trapezio rosso, più largo in basso. */}
      <path d="M27 57h46l5 25c0.5 3-1.5 5-4.5 5H26.5c-3 0-5-2-4.5-5z" fill="var(--color-art-red)" />
      {/* Il disco, con il foro al centro. */}
      <circle cx="50" cy="72" r="9.5" fill="var(--color-art-cream)" />
      <circle cx="50" cy="72" r="3" fill="var(--color-art-navy)" stroke="none" />
      {/* La cornetta appoggiata sopra: sbarra con le estremità tonde. */}
      <rect x="26" y="40" width="48" height="11" rx="5.5" fill="var(--color-art-red)" />
      <circle cx="27" cy="45.5" r="7.5" fill="var(--color-art-red)" />
      <circle cx="73" cy="45.5" r="7.5" fill="var(--color-art-red)" />
    </svg>
  );
}
