import { nearestLadderAhead, nearestSnakeHeadBehind } from "./board";
import { RULES } from "./config";
import { gainCoins, loseCoins, transferCoins } from "./economy";
import { minigameById } from "./minigames";
import {
  climbLadder,
  finishCard,
  restartChallenge,
  resolveChallenge,
  resolveLadderOrSnake,
  slideDownSnake,
} from "./resolution";
import { movePlayer, pushEvent, reachFinish, type Draft } from "./turn";
import { ITEM_IDS, otherSeat, type Action, type AnswerVerdict, type EngineContext, type Seat } from "./types";

/**
 * Carte da risolvere con un'azione: domande (docs/rules.md § Domande), sfide
 * (§ Sfide), stelle (§ Economia) e imprevisti (§ Imprevisti).
 *
 * Ogni funzione ritorna `null` se l'azione è valida, altrimenti il messaggio
 * d'errore: il reducer lo restituisce come `{ ok: false, error }`.
 */

type Handler<A extends Action> = (draft: Draft, ctx: EngineContext, action: A) => string | null;

const NOT_YOUR_TURN = "Non è il turno di questo giocatore.";

// ---------------------------------------------------------------------------
// Domande
// ---------------------------------------------------------------------------

/** Chiude la domanda e prosegue (salita se la domanda serviva alla scala). */
function closeQuestion(draft: Draft, ctx: EngineContext, verdict: AnswerVerdict | null): void {
  const card = draft.state.card;
  if (card?.type !== "question") return;
  if (verdict === "correct" && card.forLadder) climbLadder(draft, ctx, draft.state.turn);
  finishCard(draft, ctx);
}

export const answerQuestion: Handler<Extract<Action, { type: "ANSWER_QUESTION" }>> = (draft, ctx, action) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "question") return "Nessuna domanda aperta.";
  if (state.phase !== "resolving") return "La domanda non è in risoluzione.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  if (card.givenAnswer !== null) return "Hai già risposto: tocca all'altro giocatore giudicare.";
  if (action.answer.trim() === "") return "La risposta non può essere vuota.";
  if (card.kind === "open") return "Le domande aperte si confermano con ACK_OPEN_QUESTION.";

  if (card.kind === "multiple") {
    // Verdetto automatico: il confronto con la scheda lo fa il server (mai il client).
    const correct = ctx.checkMultipleChoice({
      questionId: card.questionId,
      aboutSeat: otherSeat(action.seat),
      answer: action.answer,
    });
    pushEvent(draft, {
      type: "QUESTION_ANSWERED",
      seat: action.seat,
      questionId: card.questionId,
      answer: action.answer,
    });
    const verdict: AnswerVerdict = correct ? "correct" : "wrong";
    pushEvent(draft, { type: "QUESTION_JUDGED", seat: action.seat, questionId: card.questionId, verdict });
    if (correct) {
      gainCoins(draft, action.seat, RULES.coins.multipleCorrect, "question");
      state.players[action.seat].stats.correctAnswers += 1;
    }
    closeQuestion(draft, ctx, verdict);
    return null;
  }

  // Risposta breve: si aspetta il giudizio dell'interrogato.
  card.givenAnswer = action.answer;
  pushEvent(draft, {
    type: "QUESTION_ANSWERED",
    seat: action.seat,
    questionId: card.questionId,
    answer: action.answer,
  });
  return null;
};

export const judgeAnswer: Handler<Extract<Action, { type: "JUDGE_ANSWER" }>> = (draft, ctx, action) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "question") return "Nessuna domanda aperta.";
  if (card.kind !== "short") return "Solo le risposte brevi si giudicano.";
  if (card.givenAnswer === null) return "Non c'è ancora una risposta da giudicare.";
  if (action.seat !== otherSeat(state.turn)) return "Giudica solo chi è interrogato, non chi ha risposto.";

  pushEvent(draft, {
    type: "QUESTION_JUDGED",
    seat: action.seat,
    questionId: card.questionId,
    verdict: action.verdict,
  });
  if (action.verdict === "correct") {
    gainCoins(draft, state.turn, RULES.coins.shortCorrect, "question");
    state.players[state.turn].stats.correctAnswers += 1;
  } else if (action.verdict === "almost") {
    // "Quasi" dà una moneta ma non conta per Sapientone (D-10).
    gainCoins(draft, state.turn, RULES.coins.shortAlmost, "question");
  }
  closeQuestion(draft, ctx, action.verdict);
  return null;
};

export const skipQuestion: Handler<Extract<Action, { type: "SKIP_QUESTION" }>> = (draft, ctx, action) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "question") return "Nessuna domanda da saltare.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  const player = state.players[action.seat];
  const index = player.items.indexOf("skip_question");
  if (index === -1) return "Serve un oggetto Salta domanda.";
  player.items.splice(index, 1);
  pushEvent(draft, { type: "ITEM_USED", seat: action.seat, item: "skip_question" });
  pushEvent(draft, { type: "QUESTION_SKIPPED", seat: action.seat, questionId: card.questionId });
  // Niente monete, niente penalità, nessuna salita (docs/rules.md § Domande).
  closeQuestion(draft, ctx, null);
  return null;
};

export const ackOpenQuestion: Handler<Extract<Action, { type: "ACK_OPEN_QUESTION" }>> = (
  draft,
  ctx,
  action,
) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "question") return "Nessuna domanda aperta.";
  if (card.kind !== "open") return "Solo le domande aperte si confermano così.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  gainCoins(draft, action.seat, RULES.coins.openQuestion, "question");
  closeQuestion(draft, ctx, null);
  return null;
};

// ---------------------------------------------------------------------------
// Sfide
// ---------------------------------------------------------------------------

export const claimChallengeResult: Handler<Extract<Action, { type: "CLAIM_CHALLENGE_RESULT" }>> = (
  draft,
  ctx,
  action,
) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "challenge") return "Nessuna sfida aperta.";
  if (card.verdict === "automatic") return "Questa sfida si decide con il minigioco.";
  if (card.disputed) return "Le dichiarazioni non coincidono: si sceglie con RESOLVE_DISPUTE.";

  if (card.verdict === "judge") {
    // Prova: gioca chi è sulla casella, giudica l'altro ("riuscita" = vince chi ha giocato).
    if (action.seat !== otherSeat(state.turn)) return "In una prova decide l'altro giocatore.";
    pushEvent(draft, {
      type: "CHALLENGE_CLAIMED",
      seat: action.seat,
      challengeId: card.challengeId,
      winner: action.winner,
    });
    resolveChallenge(draft, ctx, { winner: action.winner, method: "judge" });
    return null;
  }

  // Duello a doppia conferma: dichiarano entrambi.
  pushEvent(draft, {
    type: "CHALLENGE_CLAIMED",
    seat: action.seat,
    challengeId: card.challengeId,
    winner: action.winner,
  });
  card.claims[action.seat] = action.winner;
  const { 1: one, 2: two } = card.claims;
  if (one === undefined || two === undefined) return null;
  if (one === two) {
    resolveChallenge(draft, ctx, { winner: one, method: "double_confirm" });
    return null;
  }
  card.disputed = true;
  pushEvent(draft, { type: "CHALLENGE_DISPUTED", seat: null, challengeId: card.challengeId });
  return null;
};

export const resolveDispute: Handler<Extract<Action, { type: "RESOLVE_DISPUTE" }>> = (draft, ctx, action) => {
  const card = draft.state.card;
  if (card?.type !== "challenge") return "Nessuna sfida aperta.";
  if (!card.disputed) return "Non c'è nessun disaccordo da sciogliere.";
  if (card.disputeChoices[action.seat] !== undefined) return "Hai già scelto come sciogliere il nodo.";

  card.disputeChoices[action.seat] = action.method;
  const { 1: one, 2: two } = card.disputeChoices;
  if (one === undefined || two === undefined) return null;

  if (one === "rematch" && two === "rematch") {
    restartChallenge(draft, ctx);
    return null;
  }
  // Scelte diverse o lancio di moneta: decide il server (D-27).
  const winner: Seat = ctx.randomInt(2) === 0 ? 1 : 2;
  resolveChallenge(draft, ctx, { winner, method: "coin_flip" });
  return null;
};

export const minigameMove: Handler<Extract<Action, { type: "MINIGAME_MOVE" }>> = (draft, ctx, action) => {
  const card = draft.state.card;
  if (card?.type !== "challenge" || card.minigame === null || card.verdict !== "automatic") {
    return "La sfida aperta non ha un minigioco.";
  }
  const minigame = minigameById(card.minigame.kind);
  if (!minigame) return `Minigioco sconosciuto: ${card.minigame.kind}.`;
  if (minigame.turn(card.minigame) !== action.seat) return "Non tocca a te nel minigioco.";

  const applied = minigame.applyMove(card.minigame, action.seat, action.move);
  if (!applied.ok) return applied.error;
  card.minigame = applied.state;
  pushEvent(draft, { type: "MINIGAME_MOVED", seat: action.seat, minigame: minigame.id, move: action.move });

  const outcome = minigame.result(applied.state);
  if (outcome === null) return null;
  pushEvent(draft, { type: "MINIGAME_FINISHED", seat: null, minigame: minigame.id, winner: outcome });
  if (outcome === "draw") {
    // I minigiochi integrati ripartono da soli: rivincita (docs/rules.md § Sfide).
    restartChallenge(draft, ctx);
    return null;
  }
  resolveChallenge(draft, ctx, { winner: outcome, method: "automatic" });
  return null;
};

export const timerExpired: Handler<Extract<Action, { type: "TIMER_EXPIRED" }>> = (draft, ctx) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "challenge") return "Nessuna sfida aperta.";
  if (card.deadlineAt === null) return "Questa sfida non ha un timer.";
  if (ctx.now().getTime() < new Date(card.deadlineAt).getTime()) return "Il tempo non è ancora scaduto.";

  const activeSeat = state.turn;
  if (card.verdict === "judge") {
    // Prova scaduta senza verdetto = fallita: nessun premio per nessuno.
    state.card = null;
    state.phase = "pre_roll";
    pushEvent(draft, { type: "TIMER_EXPIRED", seat: null, challengeId: card.challengeId, outcome: "failed" });
    pushEvent(draft, {
      type: "CHALLENGE_RESOLVED",
      seat: "draw",
      challengeId: card.challengeId,
      prize: 0,
      method: "judge",
    });
    if (card.snakeFlash) slideDownSnake(draft, ctx, activeSeat);
    resolveLadderOrSnake(draft, ctx, activeSeat);
    return null;
  }

  // Duello scaduto: si passa alla doppia conferma.
  card.verdict = "double_confirm";
  card.deadlineAt = null;
  card.claims = {};
  card.minigame = null;
  card.minigameId = null;
  pushEvent(draft, {
    type: "TIMER_EXPIRED",
    seat: null,
    challengeId: card.challengeId,
    outcome: "double_confirm",
  });
  return null;
};

// ---------------------------------------------------------------------------
// Stella
// ---------------------------------------------------------------------------

export const buyStar: Handler<Extract<Action, { type: "BUY_STAR" }>> = (draft, ctx, action) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "star_offer") return "Nessuna offerta di stella in corso.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  const player = state.players[action.seat];
  if (player.coins < RULES.stars.price) return "Monete insufficienti per comprare la stella.";
  loseCoins(draft, action.seat, RULES.stars.price, "star_purchase");
  player.stars += 1;
  pushEvent(draft, { type: "STAR_BOUGHT", seat: action.seat, price: RULES.stars.price });
  finishCard(draft, ctx);
  return null;
};

export const declineStar: Handler<Extract<Action, { type: "DECLINE_STAR" }>> = (draft, ctx, action) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "star_offer") return "Nessuna offerta di stella in corso.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  pushEvent(draft, { type: "STAR_DECLINED", seat: action.seat });
  finishCard(draft, ctx);
  return null;
};

// ---------------------------------------------------------------------------
// Imprevisti
// ---------------------------------------------------------------------------

export const ackEvent: Handler<Extract<Action, { type: "ACK_EVENT" }>> = (draft, ctx, action) => {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "event") return "Nessun imprevisto in corso.";
  if (state.turn !== action.seat) return NOT_YOUR_TURN;
  const seat = action.seat;
  const player = state.players[seat];
  let detail: string | undefined;

  switch (card.eventId) {
    case "tailwind": {
      const to = Math.min(RULES.board.cells, player.position + RULES.events.tailwindSteps);
      movePlayer(draft, seat, to, "tailwind");
      detail = `casella ${to}`;
      // Arrivare alla 100 con uno spostamento speciale conta come arrivo (D-11).
      if (to >= RULES.board.cells) reachFinish(draft, seat);
      break;
    }
    case "wrong_path": {
      const to = Math.max(1, player.position - RULES.events.wrongPathSteps);
      movePlayer(draft, seat, to, "wrong_path");
      detail = `casella ${to}`;
      break;
    }
    case "gift": {
      const given = transferCoins(draft, otherSeat(seat), seat, RULES.events.giftCoins, "gift");
      detail = `${given} monete`;
      break;
    }
    case "treasure": {
      const item = ITEM_IDS[ctx.randomInt(ITEM_IDS.length)];
      if (player.items.length >= RULES.items.max) {
        // Massimo tre oggetti: al quarto si sceglie cosa scartare (D-11).
        state.card = { type: "item_overflow", incoming: item };
        pushEvent(draft, { type: "ITEM_OVERFLOW", seat, incoming: item });
        return null;
      }
      player.items.push(item);
      pushEvent(draft, { type: "ITEM_RECEIVED", seat, item });
      detail = item;
      break;
    }
    case "sudden_snake": {
      const snake = nearestSnakeHeadBehind(ctx.board, player.position);
      if (snake) {
        movePlayer(draft, seat, snake.to, "sudden_snake");
        detail = `casella ${snake.to}`;
      }
      break;
    }
    case "lucky_ladder": {
      const ladder = nearestLadderAhead(ctx.board, player.position);
      if (ladder) {
        movePlayer(draft, seat, ladder.to, "lucky_ladder");
        pushEvent(draft, { type: "CLIMBED_LADDER", seat, from: ladder.from, to: ladder.to });
        detail = `casella ${ladder.to}`;
      }
      break;
    }
    case "snack_break": {
      detail = `${RULES.events.snackBreakSeconds} secondi di pausa`;
      break;
    }
  }

  pushEvent(draft, { type: "EVENT_RESOLVED", seat, eventId: card.eventId, detail });
  finishCard(draft, ctx);
  return null;
};
