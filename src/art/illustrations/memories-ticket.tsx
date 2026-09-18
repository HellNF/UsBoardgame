/**
 * Biglietto — illustrazione di categoria «ricordi» (id `memories-ticket`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 */
import type { IllustrationProps } from "./types";

export function MemoriesTicket({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
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
      {/* Biglietto con i due intagli laterali, la linea di strappo e il timbro pieno. */}
      <path d="M12 36h76v10a8 8 0 0 0 0 16v10H12V62a8 8 0 0 0 0-16z" />
      <path d="M64 36v40" strokeWidth={3.5} strokeDasharray="6 7" />
      <circle cx="36" cy="54" r="9" fill="currentColor" />
    </svg>
  );
}
