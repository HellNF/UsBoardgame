import { RULES } from "./config";
import {
  otherSeat,
  type CellNumber,
  type EngineContext,
  type GameEvent,
  type GameState,
  type MoveReason,
  type Seat,
} from "./types";

/**
 * Turno, round e fine partita (docs/rules.md § Turno, § Fine partita).
 * Queste funzioni lavorano su una copia di lavoro dello stato (`Draft`) e
 * accumulano gli eventi: le chiama solo il reducer.
 */

export type Draft = {
  state: GameState;
  events: GameEvent[];
};

export const pushEvent = (draft: Draft, event: GameEvent): void => {
  draft.events.push(event);
};

/** Sposta un giocatore e registra l'evento (nessun effetto di casella). */
export function movePlayer(draft: Draft, seat: Seat, to: CellNumber, reason: MoveReason): void {
  const player = draft.state.players[seat];
  if (to === player.position) return;
  const from = player.position;
  player.position = to;
  pushEvent(draft, { type: "MOVED", seat, from, to, reason });
}

/**
 * Il giocatore di turno raggiunge (o supera) la 100: si segna il round e, se è il
 * primo ad arrivarci, prende le stelle dell'arrivo (docs/rules.md § Fine partita).
 */
export function reachFinish(draft: Draft, seat: Seat): void {
  const state = draft.state;
  const player = state.players[seat];
  if (player.finishedAtRound !== null) return;
  player.finishedAtRound = state.round;
  const other = state.players[otherSeat(seat)];
  if (other.finishedAtRound === null) player.stars += RULES.stars.finishBonus;
  pushEvent(draft, { type: "FINISH_REACHED", seat, round: state.round });
}

/** Chi ha il valore più alto di una statistica, `null` in caso di pareggio. */
function leader(state: GameState, key: "correctAnswers" | "challengesWon"): Seat | null {
  const one = state.players[1].stats[key];
  const two = state.players[2].stats[key];
  if (one === two) return null;
  return one > two ? 1 : 2;
}

/**
 * Fine partita: stelle bonus una alla volta, poi vincitore (più stelle, poi più
 * monete, altrimenti pareggio). docs/rules.md § Fine partita.
 */
export function finalizeGame(draft: Draft, reason: "finish" | "maxRounds"): void {
  const state = draft.state;
  state.phase = "finished";
  state.card = null;

  const knowItAll = leader(state, "correctAnswers");
  const champion = leader(state, "challengesWon");
  if (knowItAll !== null) state.players[knowItAll].stars += RULES.stars.knowItAllBonus;
  if (champion !== null) state.players[champion].stars += RULES.stars.championBonus;
  pushEvent(draft, { type: "BONUS_STARS", seat: null, knowItAll, champion });

  const { 1: one, 2: two } = state.players;
  const winner: Seat | "draw" =
    one.stars === two.stars
      ? one.coins === two.coins
        ? "draw"
        : one.coins > two.coins
          ? 1
          : 2
      : one.stars > two.stars
        ? 1
        : 2;
  state.winner = winner;
  pushEvent(draft, { type: "GAME_FINISHED", seat: null, winner, reason });
}

function shouldFinish(state: GameState): boolean {
  return (
    state.players[1].finishedAtRound !== null ||
    state.players[2].finishedAtRound !== null ||
    state.round > RULES.maxRounds
  );
}

/**
 * Chiusura del turno: azzera lo stato del turno e passa la mano. Quando ha giocato
 * il secondo della coppia il round è completo: si controlla la fine partita
 * (docs/rules.md § Turno passo 5, § Fine partita).
 */
export function endTurn(draft: Draft, ctx: EngineContext): void {
  const state = draft.state;
  state.card = null;
  state.arrivalCell = null;
  state.handled = { ladder: false, snake: false };
  state.itemUsedThisTurn = null;
  state.forcedDie = null;
  state.singleDie = false;

  const justPlayed = state.turn;
  pushEvent(draft, { type: "TURN_ENDED", seat: justPlayed, round: state.round });
  advance(draft, ctx);
}

function advance(draft: Draft, ctx: EngineContext): void {
  const state = draft.state;

  if (state.turn !== state.firstSeat) {
    // Ha giocato il secondo: il round è completo (D-05).
    state.round += 1;
    if (shouldFinish(state)) {
      const reason = state.round > RULES.maxRounds ? "maxRounds" : "finish";
      // A partita finita `round` è l'**ultimo round giocato**: il round appena incrementato non è mai
      // iniziato, quindi non va mostrato (docs/rules.md § Fine partita).
      state.round -= 1;
      finalizeGame(draft, reason);
      return;
    }
    state.turn = state.firstSeat;
  } else {
    state.turn = otherSeat(state.turn);
  }

  // Chi ha già raggiunto la 100 salta i turni che restano nel round.
  if (state.players[state.turn].finishedAtRound !== null) {
    pushEvent(draft, { type: "TURN_SKIPPED", seat: state.turn, round: state.round });
    endTurn(draft, ctx);
    return;
  }

  state.phase = "pre_roll";
  pushEvent(draft, { type: "ROUND_STARTED", seat: state.turn, round: state.round });
}
