"use client";

import type { Seat } from "@/engine";
import type { MinigameViewProps } from "@/features/minigames/minigame";

/**
 * Quiz-lampo (F4-04, D-55): le domande sono quelle della carta e ognuno risponde al suo turno.
 * Chi guarda senza avere il turno vede la stessa domanda con i pulsanti spenti: è la riga di
 * attesa della carta a dire che tocca all'altro.
 */

const SEAT_TEXT: Record<Seat, string> = { 1: "text-player-red", 2: "text-player-blue" };

const OPTION_BUTTON =
  "border-2 border-ink px-4 py-2 text-left hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-dashed disabled:hover:bg-paper disabled:hover:text-ink";

export function QuizBoard({ state, seat, onMove, names }: MinigameViewProps) {
  if (state.kind !== "quiz") return null;

  const finished = state.winner !== null;
  const index = Math.min(state.index, state.items.length - 1);
  const item = state.items[index];

  return (
    <div className="flex flex-col gap-4 font-sans text-ink">
      <p className="text-xs tracking-[0.2em] uppercase">
        Domanda {index + 1} di {state.items.length}
      </p>
      <p className="font-display text-xl italic">{item.question}</p>

      <div className="flex flex-col gap-2">
        {item.options.map((option, optionIndex) => (
          <button
            key={`${option}-${optionIndex}`}
            type="button"
            className={OPTION_BUTTON}
            disabled={seat === null || finished}
            onClick={() => onMove({ option: optionIndex })}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="text-xs tracking-[0.2em] uppercase">
        {finished
          ? state.winner === "draw"
            ? "Pareggio: si rigioca"
            : `Ha vinto ${names[state.winner as Seat]}`
          : `Risponde ${names[state.turn]}`}
      </p>
      <p className="text-sm">
        {([1, 2] as Seat[]).map((who) => (
          <span key={who} className="mr-4">
            <span className={`font-semibold ${SEAT_TEXT[who]}`}>{names[who]}</span>: {state.scores[who]}
          </span>
        ))}
      </p>
    </div>
  );
}
