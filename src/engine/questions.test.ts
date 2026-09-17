import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, testBoard, type TestGame } from "./testing";
import type { GameEvent, Seat } from "./types";

/**
 * Domande: chi risponde, verdetti, monete, Salta domanda e la regola della scala
 * con una sola domanda (docs/rules.md § Domande, D-06, D-07).
 */

const roll = (game: TestGame, dice: number[], seat: Seat = game.state.turn) => {
  game.test.setRandom(dice.map((die) => die - 1));
  return game.do({ type: "ROLL", seat });
};

/** Tira arrivando su una casella domanda (la 6, categoria `tastes`). */
const openQuestion = (game: TestGame, extraRandom: number[] = []) => {
  game.place(1, 4);
  game.test.setRandom([0, 0, ...extraRandom]);
  game.do({ type: "ROLL", seat: 1 });
  return game.state.card;
};

const boardWithDeepCell = (cell: number) => {
  const board = testBoard();
  board.cells[cell - 1] = { n: cell, kind: "question", category: "deep", illustration: "test-deep" };
  return board;
};

describe("chi risponde e cosa si pesca (docs/rules.md § Domande)", () => {
  it("risponde il giocatore di turno, sull'altro", () => {
    const game = createTestGame();
    openQuestion(game);
    expect(game.reject({ type: "ANSWER_QUESTION", seat: 2, answer: "x" })).toBe(
      "Non è il turno di questo giocatore.",
    );
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "pasta" });
    expect(game.test.multipleChoiceCalls).toEqual([]);
  });

  it("sulla casella domanda si pesca 'quanto mi conosci' con probabilità 60%", () => {
    const knowMe = createTestGame();
    openQuestion(knowMe, [10]);
    expect(knowMe.test.drawQuestionCalls[0]?.knowMeOnly).toBe(true);

    const open = createTestGame();
    openQuestion(open, [90]);
    expect(open.test.drawQuestionCalls[0]?.knowMeOnly).toBe(false);
    expect(open.state.card).toMatchObject({ kind: "open" });
  });

  it("le domande profonde usano il livello massimo della casella", () => {
    const low = createTestGame({ board: boardWithDeepCell(6) });
    openQuestion(low);
    expect(low.test.drawQuestionCalls[0]?.maxLevel).toBe(1);

    const high = createTestGame({ board: boardWithDeepCell(75) });
    high.place(1, 73);
    high.test.setRandom([0, 0]);
    high.do({ type: "ROLL", seat: 1 });
    expect(high.test.drawQuestionCalls[0]?.maxLevel).toBe(3);
  });

  it("le altre categorie non sono filtrate per livello", () => {
    const game = createTestGame();
    openQuestion(game);
    expect(game.test.drawQuestionCalls[0]).toMatchObject({ category: "tastes", maxLevel: 3 });
  });
});

describe("scelta multipla (docs/rules.md § Domande)", () => {
  it("risposta giusta: monete e conteggio per Sapientone", () => {
    const game = createTestGame({ questions: [{ id: "tastes-002", kind: "multiple", category: "tastes" }] });
    game.test.setSheetCorrect(["tastes-002"]);
    openQuestion(game, [10]);
    const events = game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "Mare" });
    expect(game.state.players[1].coins).toBe(RULES.coins.multipleCorrect);
    expect(game.state.players[1].stats.correctAnswers).toBe(1);
    expect(events.map((event) => event.type)).toContain("QUESTION_JUDGED");
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
  });

  it("risposta sbagliata: nessuna moneta e nessun conteggio", () => {
    const game = createTestGame({ questions: [{ id: "tastes-002", kind: "multiple", category: "tastes" }] });
    openQuestion(game, [10]);
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "Montagna" });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.players[1].stats.correctAnswers).toBe(0);
    expect(game.test.multipleChoiceCalls[0]).toMatchObject({ aboutSeat: 2, answer: "Montagna" });
  });

  it("non si risponde due volte", () => {
    const game = createTestGame({ questions: [{ id: "tastes-001", kind: "short", category: "tastes" }] });
    openQuestion(game, [10]);
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "pasta" });
    expect(game.reject({ type: "ANSWER_QUESTION", seat: 1, answer: "pizza" })).toBe(
      "Hai già risposto: tocca all'altro giocatore giudicare.",
    );
  });

  it("la risposta vuota è rifiutata", () => {
    const game = createTestGame({ questions: [{ id: "tastes-001", kind: "short", category: "tastes" }] });
    openQuestion(game, [10]);
    expect(game.reject({ type: "ANSWER_QUESTION", seat: 1, answer: "  " })).toBe(
      "La risposta non può essere vuota.",
    );
  });
});

describe("risposta breve (docs/rules.md § Domande)", () => {
  const shortGame = () => {
    const game = createTestGame({ questions: [{ id: "tastes-001", kind: "short", category: "tastes" }] });
    openQuestion(game, [10]);
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "pasta al pesto" });
    return game;
  };

  it("giudica l'interrogato, non chi ha risposto", () => {
    const game = shortGame();
    expect(game.reject({ type: "JUDGE_ANSWER", seat: 1, verdict: "correct" })).toBe(
      "Giudica solo chi è interrogato, non chi ha risposto.",
    );
  });

  it("'giusta' dà 3 monete e conta per Sapientone", () => {
    const game = shortGame();
    game.do({ type: "JUDGE_ANSWER", seat: 2, verdict: "correct" });
    expect(game.state.players[1].coins).toBe(RULES.coins.shortCorrect);
    expect(game.state.players[1].stats.correctAnswers).toBe(1);
    expect(game.state.turn).toBe(2);
  });

  it("'quasi' dà 1 moneta e non conta per Sapientone", () => {
    const game = shortGame();
    game.do({ type: "JUDGE_ANSWER", seat: 2, verdict: "almost" });
    expect(game.state.players[1].coins).toBe(RULES.coins.shortAlmost);
    expect(game.state.players[1].stats.correctAnswers).toBe(0);
  });

  it("'sbagliata' non dà niente", () => {
    const game = shortGame();
    game.do({ type: "JUDGE_ANSWER", seat: 2, verdict: "wrong" });
    expect(game.state.players[1].coins).toBe(0);
  });

  it("non si giudica prima che ci sia una risposta", () => {
    const game = createTestGame({ questions: [{ id: "tastes-001", kind: "short", category: "tastes" }] });
    openQuestion(game, [10]);
    expect(game.reject({ type: "JUDGE_ANSWER", seat: 2, verdict: "correct" })).toBe(
      "Non c'è ancora una risposta da giudicare.",
    );
  });
});

describe("domande aperte (docs/rules.md § Domande)", () => {
  it("si confermano in videochiamata e valgono 1 moneta", () => {
    const game = createTestGame({ questions: [{ id: "tastes-003", kind: "open", category: "tastes" }] });
    openQuestion(game, [90]);
    expect(game.reject({ type: "ANSWER_QUESTION", seat: 1, answer: "x" })).toBe(
      "Le domande aperte si confermano con ACK_OPEN_QUESTION.",
    );
    game.do({ type: "ACK_OPEN_QUESTION", seat: 1 });
    expect(game.state.players[1].coins).toBe(RULES.coins.openQuestion);
    expect(game.state.players[1].stats.correctAnswers).toBe(0);
    expect(game.state.turn).toBe(2);
  });
});

describe("Salta domanda (docs/rules.md § Domande)", () => {
  it("serve l'oggetto: senza, l'azione è rifiutata", () => {
    const game = createTestGame();
    openQuestion(game);
    expect(game.reject({ type: "SKIP_QUESTION", seat: 1 })).toBe("Serve un oggetto Salta domanda.");
  });

  it("consuma l'oggetto e chiude la carta senza monete", () => {
    const game = createTestGame();
    openQuestion(game);
    game.edit((state) => {
      state.players[1].items.push("skip_question");
    });
    game.do({ type: "SKIP_QUESTION", seat: 1 });
    expect(game.state.players[1].items).toEqual([]);
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
  });
});

describe("la domanda di una scala (docs/rules.md § Turno 4, D-07)", () => {
  it("sulla base di una scala si pesca sempre 'quanto mi conosci' della casella", () => {
    const game = createTestGame();
    game.place(1, 46);
    roll(game, [1, 1]); // 48: casella domanda (memories) e base della scala 48→70
    expect(game.state.card).toMatchObject({ type: "question", category: "memories", forLadder: true });
    expect(game.test.drawQuestionCalls[0]).toMatchObject({ category: "memories", knowMeOnly: true });
  });

  it("una sola domanda per casella e scala: giusta fa salire in cima", () => {
    const game = createTestGame();
    game.place(1, 46);
    roll(game, [1, 1]);
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "il mare" });
    game.do({ type: "JUDGE_ANSWER", seat: 2, verdict: "correct" });
    expect(game.state.players[1].position).toBe(70);
    expect(game.events.map((event) => event.type)).toContain("CLIMBED_LADDER");
    expect(game.state.players[1].coins).toBe(RULES.coins.shortCorrect);
  });

  it("sbagliata: si resta alla base", () => {
    const game = createTestGame();
    game.place(1, 46);
    roll(game, [1, 1]);
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "la montagna" });
    game.do({ type: "JUDGE_ANSWER", seat: 2, verdict: "wrong" });
    expect(game.state.players[1].position).toBe(48);
    expect(game.state.turn).toBe(2);
  });

  it("'quasi' dà una moneta ma non fa salire", () => {
    const game = createTestGame();
    game.place(1, 46);
    roll(game, [1, 1]);
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "il mare" });
    game.do({ type: "JUDGE_ANSWER", seat: 2, verdict: "almost" });
    expect(game.state.players[1].position).toBe(48);
    expect(game.state.players[1].coins).toBe(RULES.coins.shortAlmost);
  });

  it("Salta domanda chiude la carta e non fa salire", () => {
    const game = createTestGame();
    game.place(1, 46);
    roll(game, [1, 1]);
    game.edit((state) => {
      state.players[1].items.push("skip_question");
    });
    game.do({ type: "SKIP_QUESTION", seat: 1 });
    expect(game.state.players[1].position).toBe(48);
    expect(game.state.turn).toBe(2);
  });

  it("base di scala su una casella non domanda: categoria a caso, sempre 'quanto mi conosci'", () => {
    const game = createTestGame();
    game.place(1, 6);
    roll(game, [1, 1]); // 8: casella libera, base della scala 8→30
    expect(game.test.drawQuestionCalls[0]).toMatchObject({ knowMeOnly: true });
    expect(game.state.card).toMatchObject({ type: "question", forLadder: true });
  });

  it("categoria della domanda a caso = prima categoria con RNG a zero", () => {
    const game = createTestGame();
    game.place(1, 6);
    game.test.setRandom([0, 0, 0]);
    game.do({ type: "ROLL", seat: 1 });
    expect(game.test.drawQuestionCalls[0]?.category).toBe("tastes");
  });
});

describe("niente ripetizioni: il pescaggio passa dal contesto", () => {
  it("la richiesta arriva al contesto con categoria e livello", () => {
    const game = createTestGame();
    openQuestion(game);
    expect(game.test.drawQuestionCalls).toHaveLength(1);
    expect(game.test.drawQuestionCalls[0]).toMatchObject({
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: true,
    });
  });
});

describe("eventi delle domande", () => {
  it("la risposta breve finisce nell'evento, così il diario può raccontarla", () => {
    const game = createTestGame({ questions: [{ id: "tastes-001", kind: "short", category: "tastes" }] });
    openQuestion(game, [10]);
    game.do({ type: "ANSWER_QUESTION", seat: 1, answer: "pasta al pesto" });
    const event = game.events.find((item) => item.type === "QUESTION_ANSWERED") as
      Extract<GameEvent, { type: "QUESTION_ANSWERED" }> | undefined;
    expect(event?.answer).toBe("pasta al pesto");
  });
});
