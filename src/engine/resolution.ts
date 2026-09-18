import { ladderAt, snakeAt } from "./board";
import { RULES } from "./config";
import { gainCoins, loseCoins } from "./economy";
import { MINIGAMES } from "./minigames";
import type { QuizItem } from "./minigames/types";
import { endTurn, movePlayer, pushEvent, type Draft } from "./turn";
import {
  QUESTION_CATEGORIES,
  type ActiveCard,
  type Cell,
  type CellNumber,
  type ChallengeCard,
  type ChallengeResultMethod,
  type EngineContext,
  type EventCardId,
  type QuestionCategory,
  type QuestionLevel,
  type Seat,
  type Snake,
} from "./types";

/**
 * Flusso di risoluzione (docs/rules.md § Turno, § Scala o serpente):
 * effetto della casella d'arrivo, carte che ne nascono, scale, serpenti e chiusura
 * della sfida. Sono le funzioni che compongono il "come" delle regole; il reducer
 * le chiama in ordine.
 */

/** Gli imprevisti si pescano con uguale probabilità (docs/rules.md § Imprevisti). */
export const EVENT_CARDS: readonly EventCardId[] = [
  "tailwind",
  "wrong_path",
  "gift",
  "treasure",
  "sudden_snake",
  "lucky_ladder",
  "snack_break",
];

/** La casella di una disposizione; errore esplicito se la disposizione è incoerente. */
export function cellAt(ctx: EngineContext, cell: CellNumber): Cell {
  const found = ctx.board.cells.find((candidate) => candidate.n === cell);
  if (!found) throw new Error(`La disposizione \`${ctx.board.id}\` non ha la casella ${cell}.`);
  return found;
}

/** Base di una scala in questa casella. */
export const isLadderBase = (ctx: EngineContext, cell: CellNumber): boolean =>
  ladderAt(ctx.board, cell) !== null;

/** Chiude la carta attiva senza passare la mano. */
export function closeCard(draft: Draft): void {
  draft.state.card = null;
  draft.state.phase = "pre_roll";
}

/**
 * Chiude una carta risolta e prosegue: se il giocatore è ancora sulla casella
 * d'arrivo tocca a scala/serpente, altrimenti il turno passa all'altro.
 */
export function finishCard(draft: Draft, ctx: EngineContext): void {
  closeCard(draft);
  resolveLadderOrSnake(draft, ctx, draft.state.turn);
}

/**
 * Pesa una domanda e apre la carta (docs/rules.md § Domande).
 * `forLadder` = la domanda serve anche a salire (D-07).
 */
export function drawQuestionCard(
  draft: Draft,
  ctx: EngineContext,
  forLadder: boolean,
  cell: Cell | null,
): void {
  const state = draft.state;
  const seat = state.turn;
  const position = state.players[seat].position;

  let category: QuestionCategory;
  let knowMeOnly: boolean;
  if (cell && cell.kind === "question") {
    category = cell.category;
    knowMeOnly = forLadder || ctx.randomInt(100) < Math.round(RULES.questions.knowMeRatio * 100);
  } else {
    // Base di scala su una casella che non è una domanda: categoria a caso, sempre "quanto mi conosci".
    category = QUESTION_CATEGORIES[ctx.randomInt(QUESTION_CATEGORIES.length)];
    knowMeOnly = true;
  }

  const maxLevel: QuestionLevel = category === "deep" ? RULES.questions.deepLevelByCell(position) : 3;
  const drawn = ctx.drawQuestion({ category, maxLevel, knowMeOnly });
  state.card = {
    type: "question",
    questionId: drawn.id,
    kind: drawn.kind,
    category: drawn.category,
    forLadder,
    givenAnswer: null,
  };
  state.phase = "resolving";
  pushEvent(draft, {
    type: "QUESTION_DRAWN",
    seat,
    questionId: drawn.id,
    kind: drawn.kind,
    category: drawn.category,
    forLadder,
  });
}

/**
 * Durata suggerita di una sfida: la durata della carta, entro il massimo della serata e — per la sfida
 * lampo — entro [`challenges.snakeFlashSeconds`]. È un numero per la schermata, non una scadenza:
 * nessuno chiude la carta al suo posto (D-82).
 */
export function challengeSuggestedSeconds(ctx: EngineContext, card: ChallengeCard): number {
  const serata = Math.min(card.durationSeconds.max, ctx.settings.maxChallengeSeconds);
  const flash = card.snakeFlash ? RULES.challenges.snakeFlashSeconds : serata;
  return Math.max(1, Math.min(serata, flash));
}

/**
 * Pesa una sfida e apre la carta; con verdetto automatico avvia anche il minigioco
 * (docs/rules.md § Sfide, D-26).
 */
export function drawChallengeCard(draft: Draft, ctx: EngineContext, snakeFlash: boolean): void {
  const state = draft.state;
  const seat = state.turn;
  const card = ctx.drawChallenge({ snakeFlash });
  const active: ActiveCard = {
    type: "challenge",
    challengeId: card.id,
    mode: card.mode,
    verdict: card.verdict,
    prize: card.prize,
    snakeFlash: card.snakeFlash,
    suggestedSeconds: challengeSuggestedSeconds(ctx, card),
    timeUp: {},
    claims: {},
    disputeChoices: {},
    disputed: false,
    minigameId: card.minigame,
    minigame: null,
    quiz: card.quiz ?? null,
  };
  state.card = active;
  state.phase = "resolving";
  pushEvent(draft, {
    type: "CHALLENGE_DRAWN",
    seat,
    challengeId: card.id,
    mode: card.mode,
    verdict: card.verdict,
    snakeFlash: card.snakeFlash,
    suggestedSeconds: active.suggestedSeconds,
  });
  if (card.verdict === "automatic") startMinigame(draft, ctx, card, active.quiz);
}

/**
 * Avvia (o riavvia) il minigioco della carta attiva. `quiz` è il contenuto della carta
 * per i minigiochi che ne hanno bisogno (il quiz-lampo): il resto lo ignora.
 */
export function startMinigame(
  draft: Draft,
  ctx: EngineContext,
  card: ChallengeCard,
  quiz: QuizItem[] | null = null,
): void {
  const state = draft.state;
  if (!card.minigame) {
    throw new Error(`La sfida \`${card.id}\` ha verdetto automatico ma nessun minigioco.`);
  }
  const minigame = MINIGAMES[card.minigame];
  if (state.card?.type === "challenge") {
    state.card.minigame = minigame.init({
      randomInt: ctx.randomInt,
      firstSeat: state.turn,
      now: ctx.now(),
      content: quiz,
    });
  }
  pushEvent(draft, { type: "MINIGAME_STARTED", seat: null, minigame: card.minigame });
}

/** Apre la carta imprevisto (pescata a caso fra le sette). */
export function drawEventCard(draft: Draft, ctx: EngineContext): void {
  const seat = draft.state.turn;
  const eventId = EVENT_CARDS[ctx.randomInt(EVENT_CARDS.length)];
  draft.state.card = { type: "event", eventId };
  draft.state.phase = "resolving";
  pushEvent(draft, { type: "EVENT_DRAWN", seat, eventId });
}

/** Il giocatore sale in cima alla scala su cui si trova. */
export function climbLadder(draft: Draft, ctx: EngineContext, seat: Seat): void {
  const ladder = ladderAt(ctx.board, draft.state.players[seat].position);
  if (!ladder) return;
  movePlayer(draft, seat, ladder.to, "ladder");
  pushEvent(draft, { type: "CLIMBED_LADDER", seat, from: ladder.from, to: ladder.to });
}

/** Il giocatore scende alla coda del serpente su cui si trova. */
export function slideDownSnake(draft: Draft, ctx: EngineContext, seat: Seat): void {
  const snake = snakeAt(ctx.board, draft.state.players[seat].position);
  if (!snake) return;
  movePlayer(draft, seat, snake.to, "snake");
  pushEvent(draft, { type: "SLID_DOWN_SNAKE", seat, from: snake.from, to: snake.to });
}

/** Testa di un serpente: Antidoto (si consuma) oppure sfida lampo (docs/rules.md § Turno 4). */
export function resolveSnakeHead(draft: Draft, ctx: EngineContext, seat: Seat, snake: Snake): void {
  const player = draft.state.players[seat];
  const antidote = player.items.indexOf("antidote");
  if (antidote !== -1) {
    player.items.splice(antidote, 1);
    pushEvent(draft, { type: "ITEM_USED", seat, item: "antidote" });
    pushEvent(draft, { type: "SNAKE_BLOCKED", seat, cell: snake.from, item: "antidote" });
    endTurn(draft, ctx);
    return;
  }
  drawChallengeCard(draft, ctx, true);
}

/**
 * Scala o serpente della casella d'arrivo. Si applica solo se il giocatore è
 * **ancora** sulla casella d'arrivo: uno spostamento lo annulla (D-11).
 * Se non c'è più niente da risolvere, chiude il turno.
 */
export function resolveLadderOrSnake(draft: Draft, ctx: EngineContext, seat: Seat): void {
  const state = draft.state;
  const player = state.players[seat];

  if (state.arrivalCell === null || player.position !== state.arrivalCell) {
    endTurn(draft, ctx);
    return;
  }

  const snake = snakeAt(ctx.board, player.position);
  if (snake && !state.handled.snake) {
    state.handled.snake = true;
    resolveSnakeHead(draft, ctx, seat, snake);
    return;
  }

  const ladder = ladderAt(ctx.board, player.position);
  if (ladder && !state.handled.ladder) {
    state.handled.ladder = true;
    drawQuestionCard(draft, ctx, true, null);
    return;
  }

  endTurn(draft, ctx);
}

/** Effetto della casella d'arrivo (docs/rules.md § Turno 3). */
export function applyArrival(draft: Draft, ctx: EngineContext, seat: Seat): void {
  const state = draft.state;
  const cell = cellAt(ctx, state.players[seat].position);

  switch (cell.kind) {
    case "coins": {
      if (cell.sign === "gain") gainCoins(draft, seat, RULES.coins.cellGain, "cell");
      else loseCoins(draft, seat, RULES.coins.cellLoss, "cell");
      break;
    }
    case "star": {
      // L'offerta c'è solo se il giocatore può permettersela (docs/rules.md § Turno 3).
      if (state.players[seat].coins >= RULES.stars.price) {
        state.card = { type: "star_offer" };
        state.phase = "resolving";
        pushEvent(draft, { type: "STAR_OFFERED", seat, cell: cell.n, price: RULES.stars.price });
        return;
      }
      break;
    }
    case "question": {
      const forLadder = isLadderBase(ctx, cell.n);
      // La stessa domanda vale per la casella e per la scala (D-07).
      if (forLadder) state.handled.ladder = true;
      drawQuestionCard(draft, ctx, forLadder, cell);
      return;
    }
    case "challenge": {
      drawChallengeCard(draft, ctx, false);
      return;
    }
    case "event": {
      drawEventCard(draft, ctx);
      return;
    }
    default:
      break; // libera, partenza, arrivo: nessun effetto
  }

  resolveLadderOrSnake(draft, ctx, seat);
}

/**
 * Chiusura della sfida: premio a chi vince, nessuna moneta per il pareggio
 * (i minigiochi fanno invece una rivincita, gestita in `cards.ts`).
 */
export function resolveChallenge(
  draft: Draft,
  ctx: EngineContext,
  args: { winner: Seat | "draw"; method: ChallengeResultMethod },
): void {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "challenge") return;
  const activeSeat = state.turn;

  state.card = null;
  state.phase = "pre_roll";

  let prize = 0;
  // In una prova il premio va solo a chi ha giocato ed è stato dichiarato riuscito: se il
  // giudizio va all'altro posto la prova è fallita e nessuno ha vinto (D-59).
  const won = args.winner !== "draw" && (args.method === "judge" ? args.winner === activeSeat : true);
  if (won && args.winner !== "draw") {
    state.players[args.winner].stats.challengesWon += 1;
    if (!card.snakeFlash) {
      prize = card.prize;
      gainCoins(draft, args.winner, card.prize, "challenge");
    }
  }
  pushEvent(draft, {
    type: "CHALLENGE_RESOLVED",
    seat: args.winner,
    challengeId: card.challengeId,
    prize,
    method: args.method,
    won,
  });

  // Nella sfida lampo chi non vince scende: vincere serve a restare dov'è.
  if (card.snakeFlash && args.winner !== activeSeat) slideDownSnake(draft, ctx, activeSeat);

  resolveLadderOrSnake(draft, ctx, activeSeat);
}

/** Riporta la carta sfida al minigioco (rivincita) azzerando le dichiarazioni. */
export function restartChallenge(draft: Draft, ctx: EngineContext): void {
  const state = draft.state;
  const card = state.card;
  if (card?.type !== "challenge") return;

  card.claims = {};
  card.disputeChoices = {};
  card.disputed = false;
  // La rivincita è una sfida nuova: le dichiarazioni «il tempo è finito» si azzerano.
  card.timeUp = {};
  if (card.verdict === "automatic" && card.minigameId) {
    startMinigame(
      draft,
      ctx,
      {
        id: card.challengeId,
        mode: card.mode,
        verdict: card.verdict,
        prize: card.prize,
        durationSeconds: { min: 1, max: RULES.challenges.snakeFlashSeconds },
        snakeFlash: card.snakeFlash,
        minigame: card.minigameId,
        quiz: card.quiz,
      },
      card.quiz,
    );
  }
  pushEvent(draft, {
    type: "CHALLENGE_REMATCH",
    seat: null,
    challengeId: card.challengeId,
  });
}
