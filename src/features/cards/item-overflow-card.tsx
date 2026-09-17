"use client";

import { RULES } from "@/engine";
import type { ActiveCard } from "@/engine";
import { ITEMS } from "@/content/items";
import type { CardPanelProps } from "./card-panel";
import { waitingLine } from "./viewer";
import { WaitingRow } from "./waiting-row";

/** Pulsante pieno: nero su carta. */
const SOLID_BUTTON =
  "border-2 border-ink bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** Pulsante vuoto: carta con bordo nero spesso. */
const OUTLINE_BUTTON =
  "border-2 border-ink px-4 py-2 text-left hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function ItemOverflowCard({
  state,
  card,
  act,
  names,
  viewerSeat,
}: CardPanelProps & { card: Extract<ActiveCard, { type: "item_overflow" }> }) {
  const incoming = ITEMS[card.incoming];
  const held = state.players[state.turn].items;
  const waiting = waitingLine(state, card, viewerSeat, names);

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-2xl italic">{incoming.name}</p>
      <p className="text-sm">{incoming.effect}</p>
      <p className="text-sm">
        {waiting === null
          ? `Hai già ${held.length} oggetti (il massimo è ${RULES.items.max}): scegli cosa lasciare andare.`
          : `${names[state.turn]} ha già ${held.length} oggetti (il massimo è ${RULES.items.max}).`}
      </p>
      {waiting === null ? (
        <div className="flex flex-col gap-2">
          {held.map((item, index) => (
            <button
              key={`${item}-${index}`}
              type="button"
              className={OUTLINE_BUTTON}
              onClick={() => act({ type: "DISCARD_ITEM", seat: state.turn, item })}
            >
              Prendi {incoming.name} e scarta {ITEMS[item].name}
            </button>
          ))}
          <button
            type="button"
            className={SOLID_BUTTON}
            onClick={() => act({ type: "DISCARD_ITEM", seat: state.turn, item: "incoming" })}
          >
            Scarta quello nuovo
          </button>
        </div>
      ) : (
        <WaitingRow text={waiting} />
      )}
    </div>
  );
}
