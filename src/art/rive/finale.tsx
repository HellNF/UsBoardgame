"use client";

import type { Seat } from "@/engine";
import { starPath } from "@/art/illustrations/star";
import { RIVE_FILES } from "./files";
import { RiveCanvas, useRiveFile } from "./rive";

/**
 * Schermata finale: artboard `Finale`, macchina a stati `Reveal`.
 *
 * `revealStar` è un contatore (cambia a ogni stella scoperta e fa scattare l'ingresso omonimo),
 * `revealedStars` dice quante stelle sono in vista e `winner` è un ingresso **numerico**: 1, 2 o
 * 0 per il pareggio. (In docs/design.md `winner` era un trigger: un ingresso che scatta non può
 * dire *chi* ha vinto, quindi la tabella è stata corretta.)
 *
 * Senza il file, il segnaposto sono le tre stelle e il nome del vincitore.
 */
export type FinaleViewProps = {
  /** 1, 2 o "draw" per il pareggio. */
  winner?: Seat | "draw";
  /** Quante delle tre stelle sono scoperte (0-3). */
  revealedStars?: number;
  /** Contatore: cambia quando si scopre una stella e fa scattare `revealStar`. */
  revealStar?: number;
  /** I nomi dei due posti, per il segnaposto. */
  names?: Record<Seat, string>;
  className?: string;
};

export function FinaleView({ winner, revealedStars = 0, revealStar, names, className }: FinaleViewProps) {
  const available = useRiveFile(RIVE_FILES.finale);
  if (!available)
    return (
      <FinalePlaceholder winner={winner} revealedStars={revealedStars} names={names} className={className} />
    );

  return (
    <RiveCanvas
      file={RIVE_FILES.finale}
      artboard="Finale"
      stateMachine="Reveal"
      className={className}
      inputs={{
        triggers: { revealStar },
        numbers: { winner: winner === undefined || winner === "draw" ? 0 : winner },
      }}
    />
  );
}

/** Segnaposto del finale: tre stelle e il nome di chi ha vinto. */
export function FinalePlaceholder({
  winner,
  revealedStars = 0,
  names,
  className,
}: {
  winner?: Seat | "draw";
  revealedStars?: number;
  names?: Record<Seat, string>;
  className?: string;
}) {
  const text =
    winner === undefined
      ? "La stella si scopre alla fine"
      : winner === "draw"
        ? "Serata pari"
        : `Vince ${names?.[winner] ?? `il posto ${winner}`}`;

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ""}`}>
      <div className="flex gap-3" role="img" aria-label={`Stelle scoperte: ${revealedStars} su 3`}>
        {[0, 1, 2].map((index) => (
          <svg key={index} viewBox="0 0 100 100" className="size-10">
            <path
              d={starPath(50, 50, 46, 19)}
              fill={index < revealedStars ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={6}
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
      <p className="font-serif text-2xl text-[var(--color-ink)]">{text}</p>
    </div>
  );
}
