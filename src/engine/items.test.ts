import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, testBoard, type TestGame } from "./testing";
import type { Cell, ChallengeCard, Seat } from "./types";

/**
 * Oggetti: acquisto, uso prima del tiro, un solo oggetto attivo per turno,
 * reattivi, limite di tre e scarto (docs/rules.md § Oggetti, D-11).
 */

const treasure: ChallengeCard = {
  id: "videocall-mime",
  mode: "trial",
  verdict: "judge",
  prize: 2,
  durationSeconds: { min: 30, max: 30 },
  snakeFlash: false,
  minigame: null,
};

type CellBody = Cell extends unknown ? Omit<Cell, "n"> : never;

const boardWithCell = (cell: number, value: CellBody) => {
  const board = testBoard();
  board.cells[cell - 1] = { n: cell, ...value } as Cell;
  return board;
};

const roll = (game: TestGame, dice: number[], seat: Seat = game.state.turn) => {
  game.test.setRandom(dice.map((die) => die - 1));
  return game.do({ type: "ROLL", seat });
};

describe("acquisto (docs/rules.md § Oggetti)", () => {
  it("si compra in qualunque momento prima del tiro, anche più di uno", () => {
    const game = createTestGame();
    game.place(1, 1, 20);
    game.do({ type: "BUY_ITEM", seat: 1, item: "single_die" });
    game.do({ type: "BUY_ITEM", seat: 1, item: "skip_question" });
    expect(game.state.players[1].items).toEqual(["single_die", "skip_question"]);
    expect(game.state.players[1].coins).toBe(
      20 - RULES.items.prices.single_die - RULES.items.prices.skip_question,
    );
  });

  it("non si compra senza monete", () => {
    const game = createTestGame();
    game.place(1, 1, 1);
    expect(game.reject({ type: "BUY_ITEM", seat: 1, item: "loaded_die" })).toBe(
      "Monete insufficienti per questo oggetto.",
    );
  });

  it("non si supera il massimo di tre oggetti", () => {
    const game = createTestGame();
    game.place(1, 1, 50);
    game.do({ type: "BUY_ITEM", seat: 1, item: "single_die" });
    game.do({ type: "BUY_ITEM", seat: 1, item: "single_die" });
    game.do({ type: "BUY_ITEM", seat: 1, item: "single_die" });
    expect(game.reject({ type: "BUY_ITEM", seat: 1, item: "single_die" })).toBe(
      `Hai già il massimo di oggetti (${RULES.items.max}).`,
    );
  });

  it("non si compra mentre c'è una carta da risolvere", () => {
    const game = createTestGame();
    game.place(1, 4, 20);
    roll(game, [1, 1]); // 6 = domanda
    expect(game.reject({ type: "BUY_ITEM", seat: 1, item: "single_die" })).toBe(
      "Gli oggetti si comprano prima del tiro.",
    );
  });
});

describe("uso (docs/rules.md § Oggetti)", () => {
  it("serve possedere l'oggetto", () => {
    const game = createTestGame();
    expect(game.reject({ type: "USE_ITEM", seat: 1, item: "single_die" })).toBe(
      "Non possiedi questo oggetto.",
    );
  });

  it("si usa un solo oggetto attivo per turno", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("single_die", "thief");
    });
    game.place(2, 20, 4);
    game.do({ type: "USE_ITEM", seat: 1, item: "thief" });
    expect(game.reject({ type: "USE_ITEM", seat: 1, item: "single_die" })).toBe(
      "Hai già usato un oggetto in questo turno.",
    );
  });

  it("Antidoto e Salta domanda non si usano prima del tiro", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("antidote");
    });
    expect(game.reject({ type: "USE_ITEM", seat: 1, item: "antidote" })).toBe(
      "Antidoto e Salta domanda si consumano da soli, durante la carta.",
    );
  });

  it("il dado truccato vuole un valore da 1 a 6", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("loaded_die");
    });
    expect(game.reject({ type: "USE_ITEM", seat: 1, item: "loaded_die", loadedDieValue: 7 })).toBe(
      `Il dado truccato vuole un valore da 1 a ${RULES.dice.faces}.`,
    );
  });

  it("la Scala portatile porta in cima alla scala più vicina davanti e poi si tira", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("portable_ladder");
    });
    game.place(1, 5); // la scala più vicina davanti è 8→30
    game.do({ type: "USE_ITEM", seat: 1, item: "portable_ladder" });
    expect(game.state.players[1].position).toBe(30);
    expect(game.state.phase).toBe("pre_roll");
    expect(game.state.arrivalCell).toBeNull();
    // Nessun effetto di casella e nessuna domanda: si tira e basta.
    roll(game, [1, 1]);
    expect(game.state.lastRoll?.total).toBe(2);
  });

  it("la Scala portatile non si usa se non c'è nessuna scala davanti", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("portable_ladder");
    });
    game.place(1, 97); // dopo la 88→99 non c'è più nessuna base
    expect(game.reject({ type: "USE_ITEM", seat: 1, item: "portable_ladder" })).toBe(
      "Non c'è nessuna scala davanti a te: la Scala portatile non si può usare.",
    );
    expect(game.state.players[1].items).toEqual(["portable_ladder"]);
  });

  it("lo Scambio inverte le posizioni senza effetti per nessuno", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("swap");
    });
    game.place(1, 5);
    game.place(2, 90, 4);
    game.do({ type: "USE_ITEM", seat: 1, item: "swap" });
    expect(game.state.players[1].position).toBe(90);
    expect(game.state.players[2].position).toBe(5);
    // La 90 non è una casella stella per il giocatore 1: nessuna carta aperta.
    expect(game.state.card).toBeNull();
  });
});

describe("Antidoto (docs/rules.md § Turno 4)", () => {
  it("sul serpente si consuma da solo e non si scende", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("antidote");
    });
    game.place(1, 13);
    roll(game, [1, 1]); // 15 = testa del serpente 15→4
    expect(game.state.players[1].position).toBe(15);
    expect(game.state.players[1].items).toEqual([]);
    expect(game.events.map((event) => event.type)).toContain("SNAKE_BLOCKED");
    expect(game.test.drawChallengeCalls).toEqual([]);
    expect(game.state.turn).toBe(2);
  });
});

describe("Tesoro e scarto (docs/rules.md § Oggetti, D-11)", () => {
  it("il quarto oggetto chiede cosa scartare, anche quello nuovo", () => {
    const game = createTestGame({ board: boardWithCell(13, { kind: "event" }) });
    game.edit((state) => {
      state.players[1].items.push("single_die", "thief", "swap");
      state.players[1].stats.correctAnswers = 0;
    });
    game.place(1, 11);
    game.test.setRandom([0, 0, 3, 3]); // Terzo valore: Tesoro; quarto: l'oggetto pescato (antidoto)
    game.do({ type: "ROLL", seat: 1 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.card?.type).toBe("item_overflow");
    const incoming = (game.state.card as Extract<typeof game.state.card, { type: "item_overflow" }>).incoming;

    game.do({ type: "DISCARD_ITEM", seat: 1, item: "thief" });
    expect(game.state.players[1].items).toContain(incoming);
    expect(game.state.players[1].items).not.toContain("thief");
    expect(game.state.players[1].items).toHaveLength(RULES.items.max);
    expect(game.state.turn).toBe(2);
  });

  it("si può scartare l'oggetto appena ricevuto", () => {
    const game = createTestGame({ board: boardWithCell(13, { kind: "event" }) });
    game.edit((state) => {
      state.players[1].items.push("single_die", "thief", "swap");
    });
    game.place(1, 11);
    game.test.setRandom([0, 0, 3, 3]);
    game.do({ type: "ROLL", seat: 1 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    const incoming = (game.state.card as Extract<typeof game.state.card, { type: "item_overflow" }>).incoming;
    game.do({ type: "DISCARD_ITEM", seat: 1, item: "incoming" });
    expect(game.state.players[1].items).toEqual(["single_die", "thief", "swap"]);
    expect(game.state.players[1].items).not.toContain(incoming);
  });

  it("non si scarta un oggetto che non si possiede", () => {
    const game = createTestGame({ board: boardWithCell(13, { kind: "event" }) });
    game.edit((state) => {
      state.players[1].items.push("single_die", "thief", "swap");
    });
    game.place(1, 11);
    game.test.setRandom([0, 0, 3, 3]);
    game.do({ type: "ROLL", seat: 1 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.reject({ type: "DISCARD_ITEM", seat: 1, item: "antidote" })).toBe(
      "Non possiedi questo oggetto.",
    );
  });

  it("senza un oggetto in eccesso, scartare è rifiutato", () => {
    const game = createTestGame({ challenges: [treasure] });
    expect(game.reject({ type: "DISCARD_ITEM", seat: 1, item: "single_die" })).toBe(
      "Nessun oggetto in eccesso da scartare.",
    );
  });
});

describe("oggetti: chi può agire", () => {
  it("l'altro non può comprare né usare oggetti nel turno sbagliato", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[2].items.push("single_die");
    });
    game.place(2, 1, 10);
    expect(game.reject({ type: "BUY_ITEM", seat: 2, item: "single_die" })).toBe(
      "Non è il turno di questo giocatore.",
    );
    expect(game.reject({ type: "USE_ITEM", seat: 2, item: "single_die" })).toBe(
      "Non è il turno di questo giocatore.",
    );
  });
});
