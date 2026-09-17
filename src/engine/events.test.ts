import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, testBoard, type TestGame } from "./testing";
import type { Cell, EventCardId } from "./types";

/**
 * Imprevisti: i sette effetti, tutti equiprobabili, e la regola "nessuna reazione
 * a catena" (docs/rules.md § Imprevisti, D-11).
 */

type CellBody = Cell extends unknown ? Omit<Cell, "n"> : never;

const boardWithCell = (cell: number, value: CellBody) => {
  const board = testBoard();
  board.cells[cell - 1] = { n: cell, ...value } as Cell;
  return board;
};

/** Ordine di pesca degli imprevisti in `resolution.ts`. */
const CARD_ORDER: EventCardId[] = [
  "tailwind",
  "wrong_path",
  "gift",
  "treasure",
  "sudden_snake",
  "lucky_ladder",
  "snack_break",
];

/** Porta il giocatore 1 sulla casella 13 (imprevisto) pescando la carta indicata. */
const drawEvent = (
  eventId: EventCardId,
  options: { from?: number; cell?: number; board?: ReturnType<typeof testBoard> } = {},
): TestGame => {
  const cell = options.cell ?? 13;
  const from = options.from ?? cell - 2;
  const game = createTestGame({ board: options.board ?? boardWithCell(cell, { kind: "event" }) });
  game.place(1, from);
  game.test.setRandom([0, 0, CARD_ORDER.indexOf(eventId)]);
  game.do({ type: "ROLL", seat: 1 });
  return game;
};


describe("pesca (docs/rules.md § Imprevisti)", () => {
  it("la carta si pesca a caso e resta aperta finché non si conferma", () => {
    const game = drawEvent("snack_break");
    expect(game.state.card).toMatchObject({ type: "event", eventId: "snack_break" });
    expect(game.state.phase).toBe("resolving");
    expect(game.reject({ type: "ACK_EVENT", seat: 2 })).toBe("Non è il turno di questo giocatore.");
  });

  it("tutti i sette imprevisti sono pescabili e equiprobabili", () => {
    const drawn = CARD_ORDER.map((eventId) => {
      const game = drawEvent(eventId);
      return (game.state.card as Extract<typeof game.state.card, { type: "event" }>).eventId;
    });
    expect(drawn).toEqual(CARD_ORDER);
  });

  it("senza imprevisto in corso ACK_EVENT è rifiutato", () => {
    const game = createTestGame();
    expect(game.reject({ type: "ACK_EVENT", seat: 1 })).toBe("Nessun imprevisto in corso.");
  });
});

describe("Vento a favore (docs/rules.md § Imprevisti)", () => {
  it("avanza di 5 caselle", () => {
    const game = drawEvent("tailwind");
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(13 + RULES.events.tailwindSteps);
    expect(game.state.turn).toBe(2);
  });

  it("arrivare alla 100 conta come arrivo", () => {
    const game = drawEvent("tailwind", { cell: 97 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(100);
    expect(game.state.players[1].finishedAtRound).toBe(1);
    expect(game.state.players[1].stars).toBe(RULES.stars.finishBonus);
  });
});

describe("Sentiero sbagliato (docs/rules.md § Imprevisti)", () => {
  it("indietro di 5 caselle", () => {
    const game = drawEvent("wrong_path");
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(13 - RULES.events.wrongPathSteps);
  });

  it("non si scende sotto la casella 1", () => {
    const game = drawEvent("wrong_path", { cell: 3, from: 1 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(1);
  });
});

describe("Regalo (docs/rules.md § Imprevisti)", () => {
  it("l'altro dà 3 monete", () => {
    const game = drawEvent("gift");
    game.edit((state) => {
      state.players[2].coins = 10;
    });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].coins).toBe(RULES.events.giftCoins);
    expect(game.state.players[2].coins).toBe(10 - RULES.events.giftCoins);
  });

  it("dà al massimo le monete che l'altro ha", () => {
    const game = drawEvent("gift");
    game.edit((state) => {
      state.players[2].coins = 1;
    });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].coins).toBe(1);
    expect(game.state.players[2].coins).toBe(0);
  });
});

describe("Tesoro (docs/rules.md § Imprevisti)", () => {
  it("ricevi un oggetto a caso", () => {
    const game = drawEvent("treasure");
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].items).toHaveLength(1);
    expect(game.events.map((event) => event.type)).toContain("ITEM_RECEIVED");
  });
});

describe("Serpente improvviso e Scala fortunata (docs/rules.md § Imprevisti)", () => {
  it("il Serpente improvviso scende alla testa più vicina dietro", () => {
    const game = drawEvent("sudden_snake", { cell: 18, from: 16 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(4); // 15→4 è la testa più vicina dietro la 18
  });

  it("se non c'è nessun serpente dietro, non succede niente", () => {
    const game = drawEvent("sudden_snake");
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(13);
  });

  it("la Scala fortunata sale in cima alla scala più vicina davanti", () => {
    const game = drawEvent("lucky_ladder", { cell: 18, from: 16 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(44); // 22→44 è la base più vicina davanti alla 18
  });

  it("se non c'è nessuna scala davanti, non succede niente", () => {
    const game = drawEvent("lucky_ladder", { cell: 93, from: 91 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(93);
  });
});

describe("Pausa ghiotta (docs/rules.md § Imprevisti)", () => {
  it("nessun effetto, si chiude e il turno passa", () => {
    const game = drawEvent("snack_break");
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(13);
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.turn).toBe(2);
  });
});

describe("nessuna reazione a catena (docs/rules.md § Imprevisti, D-11)", () => {
  it("tornare su una base di scala con un imprevisto non apre nessuna domanda", () => {
    // Dal 13 il Sentiero sbagliato riporta sulla 8, che è la base della scala 8→30:
    // nessun effetto di casella, nessuna salita (D-11).
    const game = drawEvent("wrong_path");
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(8);
    expect(game.state.card).toBeNull();
    expect(game.test.drawQuestionCalls).toEqual([]);
    expect(game.state.turn).toBe(2);
  });

  it("spostarsi su una casella monete con un imprevisto non dà monete", () => {
    const game = drawEvent("wrong_path", { cell: 13 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    expect(game.state.players[1].position).toBe(8);
    expect(game.state.players[1].coins).toBe(0);
  });

  it("nessuno spostamento da imprevisto attiva la casella d'arrivo", () => {
    const game = drawEvent("sudden_snake", { cell: 18 });
    game.do({ type: "ACK_EVENT", seat: 1 });
    // Scende sulla coda del serpente (4): niente domanda, niente monete, turno finito.
    expect(game.state.players[1].position).toBe(4);
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
  });
});
