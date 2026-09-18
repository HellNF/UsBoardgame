"use client";

import { PawnView, RIVE_FILES, useRiveFile } from "@/art/rive";
import type { PawnId, PlayerColor, Seat } from "@/engine";

/**
 * Pedina del tabellone (F1-05, H2).
 *
 * Il segnaposto è il cerchio del colore del giocatore con **il numero del posto**, disegnato in
 * SVG dentro il tabellone: è quello che si vede finché `pawns.riv` non c'è, **identico** a
 * quello di prima. Quando il file c'è, al posto del segnaposto compare il canvas Rive — che è
 * HTML, e dentro un SVG entra solo attraverso un `foreignObject`.
 *
 * Il numero e non l'iniziale del nome: le due pedine si chiamano "Giocatore 1" e
 * "Giocatore 2", quindi entrambe mostrerebbero una "G". Il nome resta nell'etichetta
 * accessibile della pedina.
 */
export type PawnProps = {
  seat: Seat;
  name: string;
  color: PlayerColor;
  /**
   * L'animale scelto in lobby: è l'artboard di `pawns.riv`. Senza, resta il segnaposto anche
   * se il file c'è: una pedina senza artboard non si disegna.
   */
  animal?: PawnId;
  x: number;
  y: number;
};

/** Lato del riquadro della pedina, in unità del tabellone (una casella è 100). */
const PAWN_BOX = 96;

export function Pawn({ seat, name, color, animal, x, y }: PawnProps) {
  const available = useRiveFile(RIVE_FILES.pawns);
  if (!available || !animal) return <PawnToken seat={seat} name={name} color={color} x={x} y={y} />;

  return (
    <g transform={`translate(${x} ${y})`}>
      <title>{`Pedina ${seat} (${name})`}</title>
      {/* Il canvas Rive è HTML: dentro l'SVG serve un `foreignObject` (H2). */}
      <foreignObject x={-PAWN_BOX / 2} y={-PAWN_BOX / 2} width={PAWN_BOX} height={PAWN_BOX}>
        <div className="h-full w-full">
          <PawnView animal={animal} color={color} number={seat} className="size-full" />
        </div>
      </foreignObject>
    </g>
  );
}

/** Segnaposto della pedina: cerchio del colore del giocatore con il numero del posto. */
export function PawnToken({ seat, name, color, x, y }: Omit<PawnProps, "animal">) {
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
