import type { Action, EngineContext, GameSettings, GameState, ReduceResult, Seat } from "./types";

/**
 * Stato iniziale di una partita.
 * TODO(F1-02): implementare. Vedi docs/roadmap.md.
 */
export function createInitialState(_settings: GameSettings, _firstSeat: Seat): GameState {
  throw new Error("Non implementato: createInitialState (F1-02)");
}

/**
 * L'unico punto in cui girano le regole: (stato, azione, contesto) → nuovo stato.
 * Gira solo sul server (src/server/game), mai nel browser.
 * TODO(F1-03): implementare seguendo docs/rules.md.
 */
export function reduce(_state: GameState, _action: Action, _ctx: EngineContext): ReduceResult {
  return { ok: false, error: "Non implementato: reduce (F1-03)" };
}
