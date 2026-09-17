import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, testBoard, type TestGame } from "./testing";
import type { Cell, ChallengeCard, Seat } from "./types";

/**
 * Economia: monete doppie da 71 in su, mai sotto zero, trasferimenti, stella
 * (docs/rules.md § Economia, D-10).
 */

const boardWithCell = (cell: number, value: CellBody) => {
  const board = testBoard();
  board.cells[cell - 1] = { n: cell, ...value } as Cell;
  return board;
};

/** Casella senza il numero: il numero lo aggiunge `boardWithCell`. */
type Distributive<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type CellBody = Distributive<Cell, "n">;

const roll = (game: TestGame, dice: number[], seat: Seat = game.state.turn) => {
  game.test.setRandom(dice.map((die) => die - 1));
  return game.do({ type: "ROLL", seat });
};

/** Partita con il giocatore 1 sulla casella 75, di tipo scelto dal test. */
const atSeventyFive = (cell: CellBody, options: { coins?: number; challenges?: ChallengeCard[] } = {}) => {
  const game = createTestGame({
    board: boardWithCell(75, cell),
    challenges: options.challenges,
  });
  game.place(1, 73, options.coins ?? 0);
  return game;
};

describe("monete doppie nelle ultime tre file (docs/rules.md § Economia)", () => {
  it("un guadagno in una casella ≥ 71 vale il doppio", () => {
    const game = atSeventyFive({ kind: "coins", sign: "gain" });
    roll(game, [1, 1]);
    expect(game.state.players[1].coins).toBe(RULES.coins.cellGain * 2);
    expect(game.events.find((event) => event.type === "COINS_GAINED")).toMatchObject({
      amount: 6,
      doubled: true,
    });
  });

  it("un guadagno sotto la 71 non raddoppia", () => {
    const game = createTestGame();
    game.place(1, 8);
    roll(game, [1, 1]); // 10 = monete piene
    expect(game.state.players[1].coins).toBe(RULES.coins.cellGain);
    expect(game.events.find((event) => event.type === "COINS_GAINED")).toMatchObject({ doubled: false });
  });

  it("le perdite non raddoppiano", () => {
    const game = atSeventyFive({ kind: "coins", sign: "loss" }, { coins: 20 });
    roll(game, [1, 1]);
    expect(game.state.players[1].coins).toBe(20 - RULES.coins.cellLoss);
  });

  it("il premio di una sfida vinta oltre la 71 raddoppia", () => {
    const duel: ChallengeCard = {
      id: "lichess-blitz",
      mode: "duel",
      verdict: "double_confirm",
      prize: 5,
      durationSeconds: { min: 300, max: 480 },
      snakeFlash: false,
      minigame: null,
    };
    const game = atSeventyFive({ kind: "challenge" }, { challenges: [duel] });
    roll(game, [1, 1]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 1 });
    expect(game.state.players[1].coins).toBe(duel.prize * 2);
  });

  it("i trasferimenti fra i giocatori non raddoppiano mai", () => {
    const game = createTestGame();
    game.place(1, 90); // ora il giocatore 1 è oltre la 71
    game.place(2, 20, 8);
    game.edit((state) => {
      state.players[1].items.push("thief");
    });
    game.do({ type: "USE_ITEM", seat: 1, item: "thief" });
    expect(game.state.players[1].coins).toBe(RULES.items.thiefAmount);
    expect(game.state.players[2].coins).toBe(8 - RULES.items.thiefAmount);
  });

  it("il Ladro prende al massimo le monete che l'altro ha", () => {
    const game = createTestGame();
    game.place(2, 20, 2);
    game.edit((state) => {
      state.players[1].items.push("thief");
    });
    game.do({ type: "USE_ITEM", seat: 1, item: "thief" });
    expect(game.state.players[1].coins).toBe(2);
    expect(game.state.players[2].coins).toBe(0);
  });
});

describe("casella stella (docs/rules.md § Economia, F5-02)", () => {
  it("con 10 monete la stella si può comprare: −10 monete, +1 stella", () => {
    const game = createTestGame();
    game.place(1, 10, RULES.stars.price);
    roll(game, [1, 1]); // 12 = stella
    expect(game.state.card).toMatchObject({ type: "star_offer" });
    game.do({ type: "BUY_STAR", seat: 1 });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.players[1].stars).toBe(1);
    expect(game.state.turn).toBe(2);
  });

  it("l'offerta si può rifiutare senza conseguenze", () => {
    const game = createTestGame();
    game.place(1, 10, RULES.stars.price);
    roll(game, [1, 1]);
    game.do({ type: "DECLINE_STAR", seat: 1 });
    expect(game.state.players[1].coins).toBe(RULES.stars.price);
    expect(game.state.players[1].stars).toBe(0);
    expect(game.state.turn).toBe(2);
  });

  it("il prezzo non raddoppia oltre la 71 e non si compra senza monete", () => {
    const game = atSeventyFive({ kind: "star", illustration: "test-star" }, { coins: RULES.stars.price });
    roll(game, [1, 1]);
    expect(game.state.card).toMatchObject({ type: "star_offer" });
    game.do({ type: "BUY_STAR", seat: 1 });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.players[1].stars).toBe(1);
  });

  it("l'offerta è di un solo giocatore: l'altro non può comprare", () => {
    const game = createTestGame();
    game.place(1, 10, RULES.stars.price);
    roll(game, [1, 1]);
    expect(game.reject({ type: "BUY_STAR", seat: 2 })).toBe("Non è il turno di questo giocatore.");
  });

  it("senza offerta in corso, comprare è rifiutato", () => {
    const game = createTestGame();
    expect(game.reject({ type: "BUY_STAR", seat: 1 })).toBe("Nessuna offerta di stella in corso.");
  });
});

describe("mai sotto zero (docs/rules.md § Economia)", () => {
  it("una perdita più grande delle monete disponibili toglie solo quelle", () => {
    const game = createTestGame();
    game.place(1, 9, 1);
    roll(game, [1, 1]); // 11 = monete vuote
    expect(game.state.players[1].coins).toBe(0);
  });
});
