"use client";

import type { Seat } from "@/engine";
import type { MinigameViewProps } from "@/features/minigames/minigame";

/**
 * Forza 4: 7 colonne × 6 righe. Il motore tiene `board[row][col]` con la **riga 0 in
 * basso** (la pedina cade sul fondo), quindi il disegno scorre le righe al contrario:
 * dall'indice `ROWS - 1` (in alto) fino a 0 (in basso).
 */

const COLUMNS = 7;
const ROWS = 6;

/**
 * Turno o esito in una riga. Copiata dai tabelloni invece di importarla dal dispatcher
 * per non creare un ciclo di import `minigame.tsx` ↔ tabelloni.
 */
const statusText = (winner: Seat | "draw" | null, turn: Seat, names: Record<Seat, string>): string => {
  if (winner === "draw") return "Pareggio";
  if (winner !== null) return `Ha vinto ${names[winner]}`;
  return `Tocca a ${names[turn]}`;
};

/** Pedina piena per il posto 1, anello spesso per il posto 2; buco vuoto = cerchio sottile nero. */
function Slot({ seat }: { seat: Seat | null }) {
  if (seat === 1) return <span className="size-[72%] rounded-full bg-player-red" />;
  if (seat === 2) return <span className="size-[72%] rounded-full border-[6px] border-player-blue" />;
  return <span className="size-[72%] rounded-full border-2 border-ink" />;
}

export function ConnectFourBoard(props: MinigameViewProps) {
  const { state, seat, onMove, names } = props;

  // Il dispatcher passa sempre lo stato giusto: il controllo è solo difensivo.
  if (state.kind !== "connect-four") return null;

  const highlight: Seat | null =
    state.winner === null ? state.turn : state.winner === "draw" ? null : state.winner;
  const dotClass =
    highlight === 1
      ? "bg-player-red"
      : highlight === 2
        ? "bg-player-blue"
        : "border-2 border-ink bg-transparent";

  // Righe dall'alto verso il basso: la riga più alta occupata è l'ultima libera.
  const rowsTopDown = Array.from({ length: ROWS }, (_, offset) => ROWS - 1 - offset);
  const columns = Array.from({ length: COLUMNS }, (_, column) => column);

  return (
    <div className="flex flex-col items-center gap-4 font-sans text-ink">
      {/* `gap-px` su fondo `bg-ink`: le linee nere della griglia sono le fessure fra le celle. */}
      <div className="grid w-full max-w-md grid-cols-7 gap-px border-2 border-ink bg-ink">
        {columns.map((column) => {
          // La colonna è piena quando anche la sua riga più alta è occupata.
          const full = state.board[ROWS - 1][column] !== null;
          const playable = seat !== null && !full;
          return (
            <button
              key={`drop-${column}`}
              type="button"
              disabled={!playable}
              onClick={() => onMove({ column })}
              aria-label={`Colonna ${column + 1}`}
              className={`flex h-9 items-center justify-center bg-paper ${
                playable ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {playable ? (
                <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" className="size-[35%]">
                  <polygon points="50,80 20,28 80,28" />
                </svg>
              ) : null}
            </button>
          );
        })}

        {rowsTopDown.map((row) =>
          columns.map((column) => (
            <div key={`${row}-${column}`} className="flex aspect-square items-center justify-center bg-paper">
              <Slot seat={state.board[row][column]} />
            </div>
          )),
        )}
      </div>

      <p className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
        <span className={`size-3 rounded-full ${dotClass}`} aria-hidden="true" />
        {statusText(state.winner, state.turn, names)}
      </p>
    </div>
  );
}
