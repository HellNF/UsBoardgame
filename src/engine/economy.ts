import { RULES } from "./config";
import { pushEvent, type Draft } from "./turn";
import type { CellNumber, CoinSource, Seat } from "./types";

/**
 * Economia delle monete (docs/rules.md § Economia).
 *
 * Regola del raddoppio: ogni **guadagno** ottenuto mentre si è in una casella
 * ≥ RULES.doubleCoinsFrom vale doppio; le perdite no. I trasferimenti fra i due
 * giocatori (Regalo, Ladro) non raddoppiano mai: non sono monete nuove nel gioco
 * (decisione Derivata D-33).
 */

export const isDoubleCoinsCell = (cell: CellNumber): boolean => cell >= RULES.doubleCoinsFrom;

/** Guadagno di monete dal gioco (casella, domanda, sfida). */
export function gainCoins(draft: Draft, seat: Seat, amount: number, source: CoinSource): void {
  const player = draft.state.players[seat];
  const doubled = isDoubleCoinsCell(player.position);
  const gained = doubled ? amount * 2 : amount;
  if (gained <= 0) return;
  player.coins += gained;
  pushEvent(draft, { type: "COINS_GAINED", seat, amount: gained, source, doubled });
}

/** Perdita di monete: non si va mai sotto zero. Ritorna quanto è stato tolto davvero. */
export function loseCoins(draft: Draft, seat: Seat, amount: number, source: CoinSource): number {
  const player = draft.state.players[seat];
  const lost = Math.max(0, Math.min(amount, player.coins));
  if (lost === 0) return 0;
  player.coins -= lost;
  pushEvent(draft, { type: "COINS_LOST", seat, amount: lost, source });
  return lost;
}

/** Sposta monete da un giocatore all'altro, senza superare quelle disponibili. */
export function transferCoins(
  draft: Draft,
  from: Seat,
  to: Seat,
  amount: number,
  source: CoinSource,
): number {
  const giver = draft.state.players[from];
  const moved = Math.max(0, Math.min(amount, giver.coins));
  if (moved === 0) return 0;
  giver.coins -= moved;
  draft.state.players[to].coins += moved;
  pushEvent(draft, { type: "COINS_LOST", seat: from, amount: moved, source });
  pushEvent(draft, { type: "COINS_GAINED", seat: to, amount: moved, source, doubled: false });
  return moved;
}
