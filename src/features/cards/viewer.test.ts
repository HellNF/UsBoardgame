import { describe, expect, it } from "vitest";

import { createInitialState, MINIGAMES } from "@/engine";
import type { ActiveCard, GameState, QuizItem, Seat } from "@/engine";
import { DEFAULT_SETTINGS } from "@/engine/testing";
import { cardActor, viewerActs, waitingLine, type Viewer } from "./viewer";

/**
 * Chi vede cosa sulla carta aperta (F3-03, F4-02, F4-06, F5-05): i comandi sono di chi
 * deve agire, l'altro legge una riga di attesa. Nella hot seat li vedono tutti e due.
 */

const NAMES: Record<Seat, string> = { 1: "Leo", 2: "Marta" };

/** Orologio fisso: i minigiochi a tempo partono sempre dallo stesso istante. */
const CLOCK = { now: new Date("2026-09-17T21:00:00.000Z"), randomInt: () => 0 };

/** Stato di partita con la carta indicata e il turno indicato. */
function game(card: ActiveCard, turn: Seat = 1): GameState {
  const state = createInitialState(DEFAULT_SETTINGS, 1);
  return { ...state, turn, phase: "resolving", card };
}

const multiple: ActiveCard = {
  type: "question",
  questionId: "tastes-002",
  kind: "multiple",
  category: "tastes",
  forLadder: false,
  givenAnswer: null,
};

const shortOpen: ActiveCard = { ...multiple, kind: "short" };
const shortAnswered: ActiveCard = { ...shortOpen, givenAnswer: "Montagna" };
const open: ActiveCard = { ...multiple, kind: "open", questionId: "deep-004" };

type Challenge = Extract<ActiveCard, { type: "challenge" }>;

const challenge = (overrides: Partial<Challenge> = {}): Challenge => ({
  type: "challenge",
  challengeId: "mimo",
  mode: "trial",
  verdict: "judge",
  prize: 2,
  snakeFlash: false,
  suggestedSeconds: 120,
  timeUp: {},
  claims: {},
  disputeChoices: {},
  disputed: false,
  minigameId: null,
  minigame: null,
  quiz: null,
  ...overrides,
});

const judge = challenge();
const doubleConfirm = challenge({ challengeId: "karaoke-a-due", verdict: "double_confirm" });
const disputed = challenge({
  ...doubleConfirm,
  disputed: true,
  claims: { 1: 1, 2: 2 },
});

const QUIZ_ITEMS: QuizItem[] = [
  { question: "Quante corde ha una chitarra classica?", options: ["Quattro", "Sei"], correct: 1 },
];

const minigame = challenge({
  challengeId: "tic-tac-toe",
  verdict: "automatic",
  minigameId: "tic-tac-toe",
  minigame: MINIGAMES["tic-tac-toe"].init({ ...CLOCK, firstSeat: 2 }),
});

/** Quiz-lampo e riflessi sono a tempo (F4-04): i riflessi li giocano entrambi i posti. */
const quizCard = challenge({
  challengeId: "quiz-lampo",
  verdict: "automatic",
  minigameId: "quiz",
  quiz: QUIZ_ITEMS,
  minigame: MINIGAMES.quiz.init({ ...CLOCK, firstSeat: 2, content: QUIZ_ITEMS }),
});

const reflexCard = challenge({
  challengeId: "riflessi",
  verdict: "automatic",
  minigameId: "reflex",
  minigame: MINIGAMES.reflex.init({ ...CLOCK, firstSeat: 1 }),
});

const event: ActiveCard = { type: "event", eventId: "tailwind" };
const starOffer: ActiveCard = { type: "star_offer" };
const overflow: ActiveCard = { type: "item_overflow", incoming: "thief" };

describe("cardActor: chi deve agire sulla carta", () => {
  it("una domanda a scelta multipla o aperta è di chi ha il turno", () => {
    expect(cardActor(game(multiple), multiple)).toBe(1);
    expect(cardActor(game(open, 2), open)).toBe(2);
  });

  it("una domanda breve con la risposta già data passa in mano all'altro", () => {
    expect(cardActor(game(shortOpen), shortOpen)).toBe(1);
    expect(cardActor(game(shortAnswered), shortAnswered)).toBe(2);
    expect(cardActor(game(shortAnswered, 2), shortAnswered)).toBe(1);
  });

  it("una prova la giudica l'altro posto, una sfida a doppia conferma resta di chi ha il turno", () => {
    expect(cardActor(game(judge), judge)).toBe(2);
    expect(cardActor(game(doubleConfirm), doubleConfirm)).toBe(1);
    expect(cardActor(game(disputed), disputed)).toBe(1);
  });

  it("un minigioco a turni è di chi ha il turno nel minigioco", () => {
    // Il minigioco parte dal posto di turno (2) e il primo turno è suo.
    expect(cardActor(game(minigame, 2), minigame)).toBe(2);
    expect(cardActor(game(quizCard, 2), quizCard)).toBe(2);
  });

  it("i riflessi sono di tutti e due: chi tocca per primo", () => {
    expect(cardActor(game(reflexCard), reflexCard)).toBe("both");
  });
});

describe("waitingLine: la riga di attesa di chi non agisce", () => {
  it("domanda breve: chi risponde vede il campo, l'altro aspetta e poi giudica", () => {
    expect(waitingLine(game(shortOpen), shortOpen, 1, NAMES)).toBeNull();
    expect(waitingLine(game(shortOpen), shortOpen, 2, NAMES)).toBe("Leo sta scrivendo la risposta…");
    expect(waitingLine(game(shortAnswered), shortAnswered, 2, NAMES)).toBeNull();
    expect(waitingLine(game(shortAnswered), shortAnswered, 1, NAMES)).toBe(
      "Marta sta giudicando la tua risposta…",
    );
  });

  it("domanda a scelta multipla e domanda aperta", () => {
    expect(waitingLine(game(multiple), multiple, 2, NAMES)).toBe("Leo sta scegliendo la risposta…");
    expect(waitingLine(game(open), open, 2, NAMES)).toBe("Tocca a Leo confermare di averne parlato.");
  });

  it("sfida a giudizio: giudica l'altro, chi ha tirato aspetta", () => {
    expect(waitingLine(game(judge), judge, 2, NAMES)).toBeNull();
    expect(waitingLine(game(judge), judge, 1, NAMES)).toBe("Marta sta giudicando…");
  });

  it("doppia conferma e disaccordo: nessuno aspetta, ognuno dichiara il suo pezzo", () => {
    expect(waitingLine(game(doubleConfirm), doubleConfirm, 1, NAMES)).toBeNull();
    expect(waitingLine(game(doubleConfirm), doubleConfirm, 2, NAMES)).toBeNull();
    expect(waitingLine(game(disputed), disputed, 2, NAMES)).toBeNull();
  });

  it("minigioco a turni: tocca a chi ha il turno nel minigioco", () => {
    expect(waitingLine(game(minigame, 2), minigame, 2, NAMES)).toBeNull();
    expect(waitingLine(game(minigame, 2), minigame, 1, NAMES)).toBe("Tocca a Marta muovere.");
  });

  it("nel quiz si risponde, non si muove", () => {
    expect(waitingLine(game(quizCard, 2), quizCard, 1, NAMES)).toBe("Tocca a Marta rispondere.");
  });

  it("riflessi: nessuna riga di attesa, il pulsante ce l'hanno tutti e due", () => {
    expect(waitingLine(game(reflexCard), reflexCard, 1, NAMES)).toBeNull();
    expect(waitingLine(game(reflexCard), reflexCard, 2, NAMES)).toBeNull();
    expect(viewerActs(1, "both")).toBe(true);
    expect(viewerActs(2, "both")).toBe(true);
  });

  it("imprevisto, offerta della stella e zaino pieno", () => {
    expect(waitingLine(game(event), event, 1, NAMES)).toBeNull();
    expect(waitingLine(game(event), event, 2, NAMES)).toBe("Tocca a Leo leggere l'imprevisto.");
    expect(waitingLine(game(starOffer), starOffer, 2, NAMES)).toBe(
      "Leo sta decidendo se comprare la stella…",
    );
    expect(waitingLine(game(overflow), overflow, 2, NAMES)).toBe("Leo sta scegliendo cosa scartare…");
  });

  it("nella hot seat (tutti e due) non c'è mai una riga di attesa", () => {
    const cards: ActiveCard[] = [
      multiple,
      shortAnswered,
      judge,
      event,
      starOffer,
      overflow,
      minigame,
      quizCard,
      reflexCard,
    ];
    for (const card of cards) {
      expect(waitingLine(game(card), card, "all", NAMES)).toBeNull();
      expect(viewerActs("all", 1)).toBe(true);
      expect(viewerActs("all", 2)).toBe(true);
    }
  });
});

describe("viewerActs: chi può usare i comandi", () => {
  it("un posto vede i comandi suoi, non quelli dell'altro", () => {
    const viewer: Viewer = 1;
    expect(viewerActs(viewer, 1)).toBe(true);
    expect(viewerActs(viewer, 2)).toBe(false);
  });
});
