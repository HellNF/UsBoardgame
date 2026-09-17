"use client";

import { useEffect, useMemo, useState } from "react";

import type { BoardLayout, CellNumber, GameEvent, Seat } from "@/engine";
import { routeDuration } from "./route";

/** Movimento di una pedina, nella forma che il tabellone sa animare. */
export type PawnMove = { from: CellNumber; to: CellNumber };

/** Attesa minima fra un'animazione e la successiva, in millisecondi. */
const MIN_STEP_MS = 120;

/** Solo gli eventi di spostamento, nell'ordine in cui sono arrivati. */
type MovedEvent = Extract<GameEvent, { type: "MOVED" }>;

/**
 * Un movimento per volta (F2-05).
 *
 * Gli eventi arrivano in blocco: una sola azione può portarne due (il tiro e poi la scala, o il
 * serpente) e dal tempo reale possono arrivare due righe insieme. Qui si mettono in coda e si
 * animano **in ordine**, ognuno per la sua durata: nessuno viene saltato, e il tabellone non
 * salta avanti e indietro quando le righe arrivano fuori ordine.
 */
export function useMoveQueue(board: BoardLayout, events: GameEvent[]): Partial<Record<Seat, PawnMove>> {
  const moves = useMemo(
    () => events.filter((event): event is MovedEvent => event.type === "MOVED"),
    [events],
  );

  const [cursor, setCursor] = useState(0);
  const current = cursor < moves.length ? moves[cursor] : null;

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(
      () => setCursor((value) => value + 1),
      Math.max(MIN_STEP_MS, routeDuration(board, current.from, current.to) * 1000 + 40),
    );
    return () => clearTimeout(timer);
  }, [board, current]);

  return useMemo(
    () => (current ? { [current.seat]: { from: current.from, to: current.to } } : {}),
    [current],
  );
}
