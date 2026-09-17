import type { PlayerColor, Seat } from "@/engine";

/**
 * Pedina: segnaposto geometrico (docs/design.md § Tabellone e Rive).
 * Cerchio del colore del giocatore con **il numero del posto**; il colore lo decide la
 * lobby, quindi la pedina non ha colori propri.
 *
 * Il numero e non l'iniziale del nome: le due pedine si chiamano "Giocatore 1" e
 * "Giocatore 2", quindi entrambe mostrerebbero una "G". Il nome resta nell'etichetta
 * accessibile della pedina.
 */
export type PawnProps = {
  seat: Seat;
  name: string;
  color: PlayerColor;
  x: number;
  y: number;
};

export function Pawn({ seat, name, color, x, y }: PawnProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <title>{`Pedina ${seat} (${name})`}</title>
      <circle r={32} fill={`var(--color-player-${color})`} stroke="var(--color-ink)" strokeWidth={5} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={34}
        fill="var(--color-paper)"
        fontFamily="var(--font-sans)"
      >
        {seat}
      </text>
    </g>
  );
}
