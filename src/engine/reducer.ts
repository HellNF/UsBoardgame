import {
  ackEvent,
  ackOpenQuestion,
  answerQuestion,
  buyStar,
  claimChallengeResult,
  declineStar,
  judgeAnswer,
  minigameMove,
  resolveDispute,
  skipQuestion,
  declareTimeUp,
} from "./cards";
import { RULES } from "./config";
import { activateItem, buyItem, discardItem } from "./items";
import { applyArrival } from "./resolution";
import { endTurn, pushEvent, reachFinish, type Draft } from "./turn";
import {
  otherSeat,
  type Action,
  type EngineContext,
  type GameSettings,
  type GameState,
  type PlayerState,
  type ReduceResult,
  type Seat,
} from "./types";

/**
 * L'unico punto in cui girano le regole: (stato, azione, contesto) → nuovo stato.
 * Gira solo sul server (src/server/game), mai nel browser.
 *
 * Il reducer lavora su una copia profonda dello stato (`Draft`): se l'azione non è
 * valida ritorna `{ ok: false, error }` senza toccare nulla, altrimenti restituisce
 * il nuovo stato con `version` aumentata e gli eventi da animare o raccontare.
 */

const NOT_YOUR_TURN = "Non è il turno di questo giocatore.";

const newPlayer = (seat: Seat): PlayerState => ({
  seat,
  position: 1,
  coins: 0,
  stars: 0,
  items: [],
  finishedAtRound: null,
  stats: { correctAnswers: 0, challengesWon: 0 },
});

/** Stato iniziale: entrambi alla casella 1, zero monete, zero stelle, zero oggetti. */
export function createInitialState(_settings: GameSettings, firstSeat: Seat): GameState {
  return {
    version: 0,
    round: 1,
    turn: firstSeat,
    firstSeat,
    phase: "pre_roll",
    players: { 1: newPlayer(1), 2: newPlayer(2) },
    lastRoll: null,
    card: null,
    itemUsedThisTurn: null,
    forcedDie: null,
    singleDie: false,
    winner: null,
    arrivalCell: null,
    handled: { ladder: false, snake: false },
  };
}

/**
 * Tiro dei dadi (docs/rules.md § Turno 2): due dadi (uno con Dado singolo, uno
 * scelto con Dado truccato), +2 di rimonta se l'altro è avanti di almeno 20
 * caselle. Chi arriva alla 100 finisce: nessun effetto di casella.
 */
function roll(draft: Draft, ctx: EngineContext, seat: Seat): string | null {
  const state = draft.state;
  if (state.phase !== "pre_roll") return "Non si può tirare adesso: c'è una carta da risolvere.";
  if (state.turn !== seat) return NOT_YOUR_TURN;

  const player = state.players[seat];
  const other = state.players[otherSeat(seat)];
  const forced = state.forcedDie;
  const count = state.singleDie ? 1 : RULES.dice.count;
  const dice: number[] = [];
  for (let i = 0; i < count - (forced !== null ? 1 : 0); i++) {
    dice.push(ctx.randomInt(RULES.dice.faces) + 1);
  }
  if (forced !== null) dice.push(forced);

  const gap = other.position - player.position;
  const comebackBonus = gap >= RULES.comeback.minGap ? RULES.comeback.bonus : 0;
  const total = dice.reduce((sum, die) => sum + die, 0) + comebackBonus;
  const from = player.position;
  const to = Math.min(RULES.board.cells, from + total);

  state.lastRoll = { dice, comebackBonus, total };
  state.forcedDie = null;
  state.singleDie = false;
  state.arrivalCell = to;
  state.handled = { ladder: false, snake: false };
  pushEvent(draft, { type: "ROLLED", seat, dice, comebackBonus, total, from, to });
  player.position = to;
  if (to !== from) pushEvent(draft, { type: "MOVED", seat, from, to, reason: "roll" });

  if (to >= RULES.board.cells) {
    reachFinish(draft, seat);
    endTurn(draft, ctx);
    return null;
  }

  applyArrival(draft, ctx, seat);
  return null;
}

/** Instrada l'azione sul gestore giusto; ritorna il messaggio d'errore se non è valida. */
function dispatch(draft: Draft, ctx: EngineContext, action: Action): string | null {
  switch (action.type) {
    case "ROLL":
      return roll(draft, ctx, action.seat);
    case "BUY_ITEM":
      return buyItem(draft, ctx, action);
    case "USE_ITEM":
      return activateItem(draft, ctx, action);
    case "DISCARD_ITEM":
      return discardItem(draft, ctx, action);
    case "ANSWER_QUESTION":
      return answerQuestion(draft, ctx, action);
    case "JUDGE_ANSWER":
      return judgeAnswer(draft, ctx, action);
    case "SKIP_QUESTION":
      return skipQuestion(draft, ctx, action);
    case "ACK_OPEN_QUESTION":
      return ackOpenQuestion(draft, ctx, action);
    case "CLAIM_CHALLENGE_RESULT":
      return claimChallengeResult(draft, ctx, action);
    case "RESOLVE_DISPUTE":
      return resolveDispute(draft, ctx, action);
    case "MINIGAME_MOVE":
      return minigameMove(draft, ctx, action);
    case "DECLARE_TIME_UP":
      return declareTimeUp(draft, ctx, action);
    case "BUY_STAR":
      return buyStar(draft, ctx, action);
    case "DECLINE_STAR":
      return declineStar(draft, ctx, action);
    case "ACK_EVENT":
      return ackEvent(draft, ctx, action);
  }
}

export function reduce(state: GameState, action: Action, ctx: EngineContext): ReduceResult {
  if (state.phase === "finished") return { ok: false, error: "La partita è finita." };

  const draft: Draft = { state: structuredClone(state), events: [] };
  const error = dispatch(draft, ctx, action);
  if (error) return { ok: false, error };

  draft.state.version = state.version + 1;
  return { ok: true, state: draft.state, events: draft.events };
}
