"use client";

import { useState } from "react";
import { ITEMS } from "@/content/items";
import { RULES, type GameState, type ItemId, type PlayerColor, type Seat } from "@/engine";

/**
 * Pannello laterale della partita (task F1-05): turno, punteggi, oggetti e negozio.
 * Il colore dei giocatori resta confinato al gettone e al nome (docs/design.md).
 */

/** Oggetti che si usano prima del tiro; Antidoto e Salta domanda sono reattivi (rules.md § Oggetti). */
const ACTIVE_ITEMS: ItemId[] = ["single_die", "loaded_die", "portable_ladder", "thief", "swap"];

export type SidePanelProps = {
  state: GameState;
  names: Record<Seat, string>;
  colors: Record<Seat, PlayerColor>;
  /** Posta in palio, testo libero. */
  stake: string;
  onBuyItem: (item: ItemId) => void;
  /** Il Dado truccato vuole il valore scelto (1-6). */
  onUseItem: (item: ItemId, loadedDieValue?: number) => void;
};

function PlayerRow({
  state,
  seat,
  name,
  color,
}: {
  state: GameState;
  seat: Seat;
  name: string;
  color: PlayerColor;
}) {
  const player = state.players[seat];
  const isTurn = state.turn === seat;
  return (
    <div
      className={`rounded-lg border-2 px-3 py-2 ${isTurn ? "border-ink" : "border-ink/30"}`}
      aria-current={isTurn ? "true" : undefined}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full border border-ink"
          style={{ background: `var(--color-player-${color})` }}
        />
        <span className="font-display text-lg italic">
          {name}
          {isTurn && <span aria-hidden="true"> ·</span>}
        </span>
        <span className="ml-auto font-sans text-sm">
          casella {player.position} · {player.coins} monete · {player.stars} stelle
        </span>
      </div>
      <p className="mt-1 font-sans text-xs italic">
        {player.items.length === 0
          ? "Nessun oggetto"
          : player.items.map((item) => ITEMS[item].name).join(", ")}
        {player.finishedAtRound !== null && <> · arrivato al round {player.finishedAtRound}</>}
      </p>
    </div>
  );
}

export function SidePanel({ state, names, colors, stake, onBuyItem, onUseItem }: SidePanelProps) {
  const [loadedDie, setLoadedDie] = useState(3);
  const turn = state.turn;
  const player = state.players[turn];
  const preRoll = state.phase === "pre_roll";
  const itemSlotFree = state.itemUsedThisTurn === null;
  const canBuy = preRoll && player.items.length < RULES.items.max;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl italic">Round {state.round}</h2>
        <p className="font-sans text-sm text-ink/70">In palio: {stake}</p>
      </header>

      <div className="flex flex-col gap-2">
        <PlayerRow state={state} seat={1} name={names[1]} color={colors[1]} />
        <PlayerRow state={state} seat={2} name={names[2]} color={colors[2]} />
      </div>

      <div>
        <h3 className="font-display text-lg italic">
          {state.phase === "finished" ? "Partita finita" : `Il turno è di ${names[turn]}`}
        </h3>
        <p className="font-sans text-xs italic">
          {state.phase === "finished"
            ? "La partita è finita."
            : preRoll
              ? itemSlotFree
                ? "Puoi comprare o usare un oggetto, poi tirare."
                : "Hai già usato un oggetto: tira i dadi."
              : "C'è una carta da risolvere."}
        </p>
      </div>

      <div>
        <h3 className="font-display text-lg italic">Oggetti in vendita</h3>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(ITEMS) as ItemId[]).map((item) => {
            const price = RULES.items.prices[item];
            const affordable = player.coins >= price;
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onBuyItem(item)}
                  disabled={!canBuy || !affordable}
                  title={ITEMS[item].effect}
                  className="w-full rounded border-2 border-ink px-2 py-1 text-left font-sans text-sm disabled:cursor-not-allowed disabled:border-dashed"
                >
                  {ITEMS[item].name}
                  <span className="float-right">{price}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {player.items.length >= RULES.items.max && (
          <p className="mt-1 font-sans text-xs italic">
            Hai già {RULES.items.max} oggetti: per comprarne un altro dovrai scartarne uno.
          </p>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg italic">Usa un oggetto</h3>
        {player.items.length === 0 ? (
          <p className="font-sans text-xs italic">Niente in tasca.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {player.items.map((item, index) => {
              const active = ACTIVE_ITEMS.includes(item);
              return (
                <li key={`${item}-${index}`} className="flex items-center gap-2">
                  <span className="font-sans text-sm">
                    {ITEMS[item].name}
                    {!active && <em className="text-ink/60"> (reattivo)</em>}
                  </span>
                  {item === "loaded_die" && (
                    <label className="font-sans text-xs">
                      dado{" "}
                      <select
                        value={loadedDie}
                        onChange={(event) => setLoadedDie(Number(event.target.value))}
                        className="rounded border-2 border-ink bg-paper px-1"
                      >
                        {[1, 2, 3, 4, 5, 6].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {active && (
                    <button
                      type="button"
                      onClick={() => onUseItem(item, item === "loaded_die" ? loadedDie : undefined)}
                      disabled={!preRoll || !itemSlotFree}
                      className="rounded border-2 border-ink px-2 py-0.5 font-sans text-xs disabled:cursor-not-allowed disabled:border-dashed"
                    >
                      Usa
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {state.itemUsedThisTurn !== null && (
          <p className="mt-1 font-sans text-xs italic">
            Oggetto usato in questo turno: {ITEMS[state.itemUsedThisTurn].name}.
          </p>
        )}
      </div>
    </section>
  );
}
