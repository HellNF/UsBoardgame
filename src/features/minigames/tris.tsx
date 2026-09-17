"use client";

import type { Seat } from "@/engine";
import type { MinigameViewProps } from "@/features/minigames/minigame";

/** Tris: griglia 3 × 3 di pulsanti. `board` è row-major, cella 0 in alto a sinistra. */

/**
 * Turno o esito in una riga. La stessa funzione è ripetuta nei tre tabelloni:
 * importarla dal dispatcher creerebbe un ciclo di import `minigame.tsx` ↔ tabelloni.
 */
const statusText = (winner: Seat | "draw" | null, turn: Seat, names: Record<Seat, string>): string => {
  if (winner === "draw") return "Pareggio";
  if (winner !== null) return `Ha vinto ${names[winner]}`;
  return `Tocca a ${names[turn]}`;
};

/** Croce per il posto 1, cerchio per il posto 2, nei colori dei giocatori. */
function Mark({ seat }: { seat: Seat }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={10}
      strokeLinecap="round"
      aria-hidden="true"
      className={`size-[64%] ${seat === 1 ? "text-player-red" : "text-player-blue"}`}
    >
      {seat === 1 ? (
        <>
          <line x1="22" y1="22" x2="78" y2="78" />
          <line x1="78" y1="22" x2="22" y2="78" />
        </>
      ) : (
        <circle cx="50" cy="50" r="30" />
      )}
    </svg>
  );
}

export function TicTacToeBoard(props: MinigameViewProps) {
  const { state, seat, onMove, names } = props;

  // Il dispatcher passa sempre lo stato giusto: il controllo è solo difensivo.
  if (state.kind !== "tic-tac-toe") return null;

  // Nessuna cella è evidenziata quando la partita è finita o non si può cliccare.
  const highlight: Seat | null =
    state.winner === null ? state.turn : state.winner === "draw" ? null : state.winner;
  const dotClass =
    highlight === 1
      ? "bg-player-red"
      : highlight === 2
        ? "bg-player-blue"
        : "border-2 border-ink bg-transparent";

  return (
    <div className="flex flex-col items-center gap-4 font-sans text-ink">
      {/* `gap-px` su fondo `bg-ink`: le righe nere della griglia sono i bordi delle celle. */}
      <div className="grid w-72 grid-cols-3 gap-px border-2 border-ink bg-ink">
        {state.board.map((cell, index) => {
          const playable = seat !== null && cell === null;
          return (
            <button
              // L'indice è stabile: il tabellone del tris ha sempre 9 celle.
              key={index}
              type="button"
              disabled={!playable}
              onClick={() => onMove({ cell: index })}
              aria-label={
                cell === null
                  ? `Cella ${index + 1}`
                  : `Cella ${index + 1}, ${cell === 1 ? "croce" : "cerchio"}`
              }
              className={`flex aspect-square items-center justify-center bg-paper ${
                playable ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {cell === null ? null : <Mark seat={cell} />}
            </button>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
        <span className={`size-3 rounded-full ${dotClass}`} aria-hidden="true" />
        {statusText(state.winner, state.turn, names)}
      </p>
    </div>
  );
}
