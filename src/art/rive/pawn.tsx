"use client";

import type { ReactNode } from "react";
import type { PawnId, PlayerColor } from "@/engine";
import { RIVE_FILES } from "./files";
import { RiveCanvas, useRiveFile } from "./rive";

/**
 * Pedina animata: artboard `pawns.riv` per animale, macchina a stati `Pawn` (docs/design.md).
 *
 * Il colore del giocatore resta **fuori** dal disegno: i `.riv` sono in bianco e nero e il
 * gettone colorato lo mette il wrapper sotto la testa. Senza il file, il segnaposto è il
 * cerchio colorato con il numero del posto — lo stesso della pedina del tabellone; chi collega
 * il wrapper a una schermata può passare il **segnaposto attuale della schermata** con
 * `placeholder`, così finché il file manca non cambia niente di quello che si vedeva prima.
 */
export type PawnViewProps = {
  /** L'animale scelto in lobby: un artboard per animale. */
  animal: PawnId;
  color: PlayerColor;
  /** Il numero del posto: il segnaposto lo scrive dentro il gettone. */
  number: number;
  /** Celle ancora da percorrere: cambia a ogni salto e fa scattare `hop`. */
  hop?: number;
  /** Salto lungo una scala o caduta lungo un serpente. */
  celebrate?: number;
  /** La pedina che sta muovendo adesso. */
  active?: boolean;
  /** Cosa mostrare finché il file non c'è (senza, il cerchio di `/dev/art`). */
  placeholder?: ReactNode;
  className?: string;
};

export function PawnView({ animal, color, number, hop, celebrate, active, placeholder, className }: PawnViewProps) {
  const available = useRiveFile(RIVE_FILES.pawns);
  if (!available)
    return <>{placeholder ?? <PawnToken color={color} number={number} className={className} />}</>;

  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span
        aria-hidden="true"
        className="absolute inset-x-[16%] top-[38%] bottom-[2%] rounded-full border-[3px] border-[var(--color-ink)]"
        style={{ background: `var(--color-player-${color})` }}
      />
      <RiveCanvas
        file={RIVE_FILES.pawns}
        artboard={animal}
        stateMachine="Pawn"
        className="relative h-full w-full"
        inputs={{ triggers: { hop, celebrate }, booleans: { active: active ?? false } }}
      />
    </span>
  );
}

/** Segnaposto della pedina: cerchio del colore del giocatore con il numero del posto. */
export function PawnToken({
  color,
  number,
  className,
}: {
  color: PlayerColor;
  number: number;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className ?? ""}`} aria-hidden="true">
      <span
        className="absolute inset-x-[16%] top-[38%] bottom-[2%] rounded-full border-[3px] border-[var(--color-ink)]"
        style={{ background: `var(--color-player-${color})` }}
      />
      <span className="absolute inset-x-0 top-[38%] bottom-[2%] flex items-center justify-center font-sans text-[0.95em] text-[var(--color-paper)]">
        {number}
      </span>
    </span>
  );
}
