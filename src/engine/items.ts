import { nearestLadderAhead } from "./board";
import { RULES } from "./config";
import { loseCoins, transferCoins } from "./economy";
import { finishCard } from "./resolution";
import { movePlayer, pushEvent, type Draft } from "./turn";
import { otherSeat, type Action, type EngineContext, type ItemId } from "./types";

/**
 * Oggetti (docs/rules.md § Oggetti): acquisto prima del tiro, uso di un solo
 * oggetto attivo per turno, scarto quando si riceve il quarto oggetto.
 */

type Handler<A extends Action> = (draft: Draft, ctx: EngineContext, action: A) => string | null;

/** Gli oggetti che si usano prima del tiro (uno per turno). */
export const ACTIVE_ITEMS: readonly ItemId[] = [
  "single_die",
  "loaded_die",
  "portable_ladder",
  "thief",
  "swap",
];

const NOT_YOUR_TURN = "Non è il turno di questo giocatore.";

export const buyItem: Handler<Extract<Action, { type: "BUY_ITEM" }>> = (draft, ctx, action) => {
  const state = draft.state;
  if (state.phase !== "pre_roll") return "Gli oggetti si comprano prima del tiro.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  const player = state.players[action.seat];
  if (player.items.length >= RULES.items.max) {
    return `Hai già il massimo di oggetti (${RULES.items.max}).`;
  }
  const price = RULES.items.prices[action.item];
  if (player.coins < price) return "Monete insufficienti per questo oggetto.";
  loseCoins(draft, action.seat, price, "item_purchase");
  player.items.push(action.item);
  pushEvent(draft, { type: "ITEM_BOUGHT", seat: action.seat, item: action.item, price });
  return null;
};

export const activateItem: Handler<Extract<Action, { type: "USE_ITEM" }>> = (draft, ctx, action) => {
  const state = draft.state;
  if (state.phase !== "pre_roll") return "Gli oggetti si usano prima del tiro.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  const player = state.players[action.seat];
  const index = player.items.indexOf(action.item);
  if (index === -1) return "Non possiedi questo oggetto.";
  if (!ACTIVE_ITEMS.includes(action.item)) {
    return "Antidoto e Salta domanda si consumano da soli, durante la carta.";
  }
  if (state.itemUsedThisTurn !== null) return "Hai già usato un oggetto in questo turno.";

  let detail: string | undefined;
  switch (action.item) {
    case "single_die": {
      state.singleDie = true;
      detail = "il prossimo tiro usa un dado solo";
      break;
    }
    case "loaded_die": {
      const value = action.loadedDieValue;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > RULES.dice.faces) {
        return `Il dado truccato vuole un valore da 1 a ${RULES.dice.faces}.`;
      }
      state.forcedDie = value;
      detail = `dado da ${value}`;
      break;
    }
    case "portable_ladder": {
      const ladder = nearestLadderAhead(ctx.board, player.position);
      if (!ladder) return "Non c'è nessuna scala davanti a te: la Scala portatile non si può usare.";
      movePlayer(draft, action.seat, ladder.to, "portable_ladder");
      detail = `casella ${ladder.to}`;
      break;
    }
    case "thief": {
      const stolen = transferCoins(
        draft,
        otherSeat(action.seat),
        action.seat,
        RULES.items.thiefAmount,
        "thief",
      );
      detail = `${stolen} monete`;
      break;
    }
    case "swap": {
      const other = otherSeat(action.seat);
      const mine = player.position;
      const theirs = state.players[other].position;
      movePlayer(draft, action.seat, theirs, "swap");
      movePlayer(draft, other, mine, "swap");
      // Scambio: nessun effetto di casella per nessuno (docs/rules.md § Oggetti).
      state.arrivalCell = null;
      state.handled = { ladder: false, snake: false };
      detail = `casella ${theirs}`;
      break;
    }
    default:
      break;
  }

  player.items.splice(index, 1);
  state.itemUsedThisTurn = action.item;
  pushEvent(draft, { type: "ITEM_USED", seat: action.seat, item: action.item, detail });
  return null;
};

export const discardItem: Handler<Extract<Action, { type: "DISCARD_ITEM" }>> = (draft, ctx, action) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "item_overflow") return "Nessun oggetto in eccesso da scartare.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  const player = state.players[action.seat];

  if (action.item === "incoming") {
    // Si può scartare anche l'oggetto appena ricevuto (D-11).
    pushEvent(draft, { type: "ITEM_DISCARDED", seat: action.seat, item: card.incoming });
    finishCard(draft, ctx);
    return null;
  }

  const index = player.items.indexOf(action.item);
  if (index === -1) return "Non possiedi questo oggetto.";
  player.items.splice(index, 1);
  pushEvent(draft, { type: "ITEM_DISCARDED", seat: action.seat, item: action.item });
  player.items.push(card.incoming);
  pushEvent(draft, { type: "ITEM_RECEIVED", seat: action.seat, item: card.incoming });
  finishCard(draft, ctx);
  return null;
};
