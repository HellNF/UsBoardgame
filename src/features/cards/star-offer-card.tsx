"use client";

import { RULES } from "@/engine";
import type { ActiveCard } from "@/engine";
import type { CardPanelProps } from "./card-panel";

/** Pulsante pieno: nero su carta. */
const SOLID_BUTTON =
  "border-2 border-ink bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-dashed disabled:bg-paper disabled:text-ink";

/** Pulsante vuoto: carta con bordo nero spesso. */
const OUTLINE_BUTTON =
  "border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function StarOfferCard({
  state,
  act,
}: CardPanelProps & { card: Extract<ActiveCard, { type: "star_offer" }> }) {
  const price = RULES.stars.price;
  const coins = state.players[state.turn].coins;
  const canBuy = coins >= price;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-2xl italic">Una stella è in vendita</p>
      <p className="text-sm">
        La stella costa {price} monete; ne hai {coins}.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={SOLID_BUTTON}
          disabled={!canBuy}
          onClick={() => act({ type: "BUY_STAR", seat: state.turn })}
        >
          Compra la stella
        </button>
        <button
          type="button"
          className={OUTLINE_BUTTON}
          onClick={() => act({ type: "DECLINE_STAR", seat: state.turn })}
        >
          No, grazie
        </button>
      </div>
      {!canBuy && <p className="text-xs">Ti servono altre {price - coins} monete.</p>}
    </div>
  );
}
