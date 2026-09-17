import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, type TestGame } from "./testing";
import type { Seat } from "./types";

/**
 * Fine partita: stelle dell'arrivo, completamento del round, limite di round,
 * stelle bonus e vincitore (docs/rules.md § Fine partita, D-05).
 */

const roll = (game: TestGame, dice: number[], seat: Seat = game.state.turn) => {
  game.test.setRandom(dice.map((die) => die - 1));
  return game.do({ type: "ROLL", seat });
};

/** Gioca un turno su casella libera (dalla 3 alla 5). */
const quietTurn = (game: TestGame, seat: Seat) => {
  game.place(seat, 3);
  roll(game, [1, 1], seat);
};

const winnerEvent = (game: TestGame) =>
  game.events.find((event) => event.type === "GAME_FINISHED") as
    Extract<ReturnType<TestGame["do"]>[number], { type: "GAME_FINISHED" }> | undefined;

describe("arrivo alla 100 (docs/rules.md § Fine partita)", () => {
  it("il primo che arriva prende le 3 stelle dell'arrivo", () => {
    const game = createTestGame();
    game.place(1, 98);
    roll(game, [1, 1]);
    expect(game.state.players[1].position).toBe(100);
    expect(game.state.players[1].stars).toBe(RULES.stars.finishBonus);
    expect(game.state.players[1].finishedAtRound).toBe(1);
    expect(game.state.phase).toBe("pre_roll"); // si completa il round
    expect(game.state.turn).toBe(2);
  });

  it("chi arriva per secondo non prende le stelle dell'arrivo", () => {
    const game = createTestGame();
    game.place(1, 98);
    roll(game, [1, 1]);
    game.place(2, 98);
    roll(game, [1, 1], 2);
    expect(game.state.players[2].position).toBe(100);
    expect(game.state.players[2].finishedAtRound).toBe(1);
    expect(game.state.players[2].stars).toBe(0);
  });

  it("la partita finisce alla fine del round e mostra il vincitore", () => {
    const game = createTestGame();
    game.place(1, 98);
    roll(game, [1, 1]);
    game.place(2, 98);
    roll(game, [1, 1], 2);
    expect(game.state.phase).toBe("finished");
    expect(game.state.winner).toBe(1);
    expect(winnerEvent(game)).toMatchObject({ winner: 1, reason: "finish" });
    expect(game.state.round).toBe(2);
  });

  it("non si agisce più a partita finita", () => {
    const game = createTestGame();
    game.place(1, 98);
    roll(game, [1, 1]);
    game.place(2, 98);
    roll(game, [1, 1], 2);
    expect(game.reject({ type: "ROLL", seat: 1 })).toBe("La partita è finita.");
  });
});

describe("limite di round (docs/rules.md § Fine partita)", () => {
  it(`dopo ${RULES.maxRounds} round completi la partita finisce comunque`, () => {
    const game = createTestGame();
    for (let round = 0; round < RULES.maxRounds; round++) {
      quietTurn(game, 1);
      quietTurn(game, 2);
    }
    expect(game.state.phase).toBe("finished");
    expect(game.state.round).toBe(RULES.maxRounds + 1);
    expect(winnerEvent(game)).toMatchObject({ reason: "maxRounds" });
  });

  it("se nessuno arriva, vince chi ha più monete a parità di stelle", () => {
    const game = createTestGame();
    for (let round = 0; round < RULES.maxRounds; round++) {
      quietTurn(game, 1);
      quietTurn(game, 2);
    }
    expect(game.state.players[1].stars).toBe(0);
    expect(game.state.winner).toBe("draw");
  });

  it("a parità di stelle vince chi ha più monete", () => {
    const game = createTestGame();
    game.place(2, 20, 5);
    for (let round = 0; round < RULES.maxRounds; round++) {
      quietTurn(game, 1);
      quietTurn(game, 2);
    }
    expect(game.state.players[1].stars).toBe(game.state.players[2].stars);
    expect(game.state.players[2].coins).toBeGreaterThan(game.state.players[1].coins);
    expect(game.state.winner).toBe(2);
  });
});

describe("stelle bonus (docs/rules.md § Fine partita)", () => {
  /** Porta la partita a finire con le statistiche preparate dal test. */
  const gameWithStats = (one: { correct: number; challenges: number }, two: typeof one) => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].stats = { correctAnswers: one.correct, challengesWon: one.challenges };
      state.players[2].stats = { correctAnswers: two.correct, challengesWon: two.challenges };
    });
    game.place(1, 98);
    roll(game, [1, 1]);
    game.place(2, 3);
    roll(game, [1, 1], 2);
    return game;
  };

  it("Sapientone e Campione vanno a chi ha più risposte giuste e più sfide vinte", () => {
    const game = gameWithStats({ correct: 3, challenges: 2 }, { correct: 1, challenges: 0 });
    const bonus = game.events.find((event) => event.type === "BONUS_STARS");
    expect(bonus).toMatchObject({ knowItAll: 1, champion: 1 });
    expect(game.state.players[1].stars).toBe(RULES.stars.finishBonus + 2);
    expect(game.state.players[2].stars).toBe(0);
    expect(game.state.winner).toBe(1);
  });

  it("in caso di pareggio la stella non va a nessuno", () => {
    const game = gameWithStats({ correct: 2, challenges: 1 }, { correct: 2, challenges: 1 });
    expect(game.events.find((event) => event.type === "BONUS_STARS")).toMatchObject({
      knowItAll: null,
      champion: null,
    });
    expect(game.state.players[1].stars).toBe(RULES.stars.finishBonus);
    expect(game.state.players[2].stars).toBe(0);
  });

  it("il vincitore è chi ha più stelle", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[2].stars = 9;
    });
    game.place(1, 98);
    roll(game, [1, 1]);
    game.place(2, 3);
    roll(game, [1, 1], 2);
    expect(game.state.phase).toBe("finished");
    expect(game.state.winner).toBe(2);
  });
});
