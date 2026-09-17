"use client";

import { EVENTS } from "@/content/events";
import type { ActiveCard } from "@/engine";
import type { CardPanelProps } from "./card-panel";

/** Pulsante pieno: nero su carta. */
const SOLID_BUTTON =
  "border-2 border-ink bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function EventCard({
  state,
  card,
  act,
}: CardPanelProps & { card: Extract<ActiveCard, { type: "event" }> }) {
  const event = EVENTS[card.eventId];

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-2xl italic">{event.name}</p>
      <p className="text-sm">{event.effect}</p>
      <div>
        <button
          type="button"
          className={SOLID_BUTTON}
          onClick={() => act({ type: "ACK_EVENT", seat: state.turn })}
        >
          Continua
        </button>
      </div>
    </div>
  );
}
