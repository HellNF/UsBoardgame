import type { PlayerColor, Seat } from "@/engine";

/**
 * Pedina: segnaposto geometrico (docs/design.md § Tabellone e Rive).
 * Cerchio del colore del giocatore con l'iniziale del nome; il colore lo decide la
 * lobby, quindi la pedina non ha colori propri.
 */
export type PawnProps = {
  seat: Seat;
  name: string;
  color: PlayerColor;
  x: number;
  y: number;
};

export function Pawn({ seat, name, color, x, y }: PawnProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || String(seat);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={32} fill={`var(--color-player-${color})`} stroke="var(--color-ink)" strokeWidth={5} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={34}
        fill="var(--color-paper)"
        fontFamily="var(--font-sans)"
      >
        {initial}
      </text>
    </g>
  );
}
