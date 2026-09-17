import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, testBoard, type TestGame } from "./testing";
import type { GameEvent, Seat } from "./types";

/**
 * Turno: tiro, rimonta, movimento, caselle libere e monete, turni e round
 * (docs/rules.md § Turno).
 */

/** Tira i dadi indicati (1-6): il contesto finto non usa `Math.random`. */
const roll = (game: TestGame, dice: number[], seat: Seat = game.state.turn) => {
  game.test.setRandom(dice.map((die) => die - 1));
  return game.do({ type: "ROLL", seat });
};

const types = (events: GameEvent[]) => events.map((event) => event.type);

/** Copia della disposizione di prova con una casella sostituita (per i test mirati). */
const boardWithCell = (cell: number, value: object) => {
  const board = testBoard();
  board.cells[cell - 1] = { n: cell, ...value } as (typeof board.cells)[number];
  return board;
};

describe("preparazione (docs/rules.md § Preparazione)", () => {
  it("entrambi partono dalla casella 1 con 0 monete, 0 stelle e 0 oggetti", () => {
    const game = createTestGame();
    for (const seat of [1, 2] as const) {
      const player = game.state.players[seat];
      expect(player.position).toBe(1);
      expect(player.coins).toBe(0);
      expect(player.stars).toBe(0);
      expect(player.items).toEqual([]);
      expect(player.finishedAtRound).toBeNull();
    }
    expect(game.state.round).toBe(1);
    expect(game.state.phase).toBe("pre_roll");
    expect(game.state.winner).toBeNull();
  });

  it("comincia chi è sorteggiato dal server", () => {
    const game = createTestGame({ firstSeat: 2 });
    expect(game.state.firstSeat).toBe(2);
    expect(game.state.turn).toBe(2);
  });
});

describe("tiro (docs/rules.md § Turno 2)", () => {
  it("somma i due dadi e sposta il giocatore", () => {
    const game = createTestGame();
    roll(game, [1, 3]);
    expect(game.state.players[1].position).toBe(5);
    const rolled = game.events.find((event) => event.type === "ROLLED");
    expect(rolled).toMatchObject({ dice: [1, 3], comebackBonus: 0, total: 4, from: 1, to: 5 });
  });

  it("la rimonta aggiunge +2 quando l'altro è avanti di almeno 20 caselle", () => {
    const game = createTestGame();
    game.place(1, 20);
    game.place(2, 45);
    roll(game, [1, 1]);
    expect(game.state.lastRoll).toEqual({ dice: [1, 1], comebackBonus: RULES.comeback.bonus, total: 4 });
    expect(game.state.players[1].position).toBe(24);
  });

  it("la rimonta non scatta con 19 caselle di distacco", () => {
    const game = createTestGame();
    game.place(1, 20);
    game.place(2, 39);
    roll(game, [1, 1]);
    expect(game.state.lastRoll?.comebackBonus).toBe(0);
  });

  it("solo il giocatore di turno può tirare", () => {
    const game = createTestGame();
    expect(game.reject({ type: "ROLL", seat: 2 })).toBe("Non è il turno di questo giocatore.");
  });

  it("non si può tirare mentre c'è una carta da risolvere", () => {
    const game = createTestGame();
    game.place(1, 4);
    roll(game, [1, 1]); // arriva sulla 6, casella domanda
    expect(game.state.phase).toBe("resolving");
    expect(game.reject({ type: "ROLL", seat: 1 })).toContain("c'è una carta da risolvere");
  });

  it("la nuova posizione non supera mai la 100", () => {
    const game = createTestGame();
    game.place(1, 96);
    roll(game, [6, 6]);
    expect(game.state.players[1].position).toBe(100);
  });
});

describe("effetto della casella d'arrivo (docs/rules.md § Turno 3)", () => {
  it("casella libera: nessun effetto e il turno passa all'altro", () => {
    const game = createTestGame();
    game.place(1, 3);
    const events = roll(game, [1, 1]);
    expect(game.state.players[1].position).toBe(5);
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
    expect(game.state.phase).toBe("pre_roll");
    expect(types(events)).toContain("TURN_ENDED");
  });

  it("casella monete piena: +3 monete", () => {
    const game = createTestGame();
    game.place(1, 8);
    roll(game, [1, 1]); // 10 = monete piene
    expect(game.state.players[1].coins).toBe(RULES.coins.cellGain);
    expect(game.events.find((event) => event.type === "COINS_GAINED")).toMatchObject({
      amount: 3,
      source: "cell",
    });
  });

  it("casella monete vuota: −2 monete", () => {
    const game = createTestGame();
    game.place(1, 9, 10);
    roll(game, [1, 1]); // 11 = monete vuote
    expect(game.state.players[1].coins).toBe(10 - RULES.coins.cellLoss);
  });

  it("le monete non vanno mai sotto zero", () => {
    const game = createTestGame();
    game.place(1, 9, 1);
    roll(game, [1, 1]); // 11 = monete vuote, ma ha solo 1 moneta
    expect(game.state.players[1].coins).toBe(0);
    expect(game.events.find((event) => event.type === "COINS_LOST")).toMatchObject({ amount: 1 });
  });

  it("casella stella senza 10 monete: nessuna offerta", () => {
    const game = createTestGame();
    game.place(1, 10, 9);
    roll(game, [1, 1]); // 12 = stella
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
  });

  it("casella domanda: si apre una carta domanda della categoria della casella", () => {
    const game = createTestGame();
    game.place(1, 4);
    roll(game, [1, 1]); // 6 = domanda "tastes"
    expect(game.state.card).toMatchObject({ type: "question", category: "tastes" });
    expect(game.state.phase).toBe("resolving");
    expect(game.test.drawQuestionCalls[0]).toMatchObject({ category: "tastes" });
  });

  it("casella sfida: si apre una carta sfida non lampo", () => {
    const game = createTestGame();
    game.place(1, 12);
    roll(game, [1, 1]); // 14 = sfida
    expect(game.state.card).toMatchObject({ type: "challenge", snakeFlash: false });
    expect(game.test.drawChallengeCalls).toEqual([{ snakeFlash: false }]);
  });

  it("casella imprevisto: si apre una carta imprevisto", () => {
    const game = createTestGame();
    game.place(1, 11);
    roll(game, [1, 1]); // 13 = imprevisto
    expect(game.state.card?.type).toBe("event");
    expect(game.events.find((event) => event.type === "EVENT_DRAWN")).toBeDefined();
  });
});

describe("turni e round (docs/rules.md § Turno 5)", () => {
  it("il turno passa all'altro giocatore", () => {
    const game = createTestGame();
    game.place(1, 3);
    roll(game, [1, 1]);
    expect(game.state.turn).toBe(2);
    expect(game.state.round).toBe(1);
  });

  it("quando hanno giocato entrambi il round aumenta", () => {
    const game = createTestGame();
    game.place(1, 3);
    roll(game, [1, 1]);
    game.place(2, 3);
    roll(game, [1, 1], 2);
    expect(game.state.round).toBe(2);
    expect(game.state.turn).toBe(1);
  });

  it("l'oggetto usato nel turno si dimentica al turno dopo", () => {
    const game = createTestGame();
    game.place(1, 3);
    game.edit((state) => {
      state.players[1].items.push("single_die");
    });
    game.do({ type: "USE_ITEM", seat: 1, item: "single_die" });
    expect(game.state.itemUsedThisTurn).toBe("single_die");
    roll(game, [2]); // un dado solo: dalla 3 alla 5, casella libera
    expect(game.state.turn).toBe(2);
    expect(game.state.itemUsedThisTurn).toBeNull();
    expect(game.state.singleDie).toBe(false);
  });
});

describe("dado singolo e dado truccato (docs/rules.md § Oggetti)", () => {
  it("il dado singolo fa tirare un dado solo", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("single_die");
    });
    game.do({ type: "USE_ITEM", seat: 1, item: "single_die" });
    roll(game, [4]);
    expect(game.state.lastRoll?.dice).toEqual([4]);
    expect(game.state.players[1].position).toBe(5);
  });

  it("il dado truccato fissa il valore di un dado e l'altro si tira", () => {
    const game = createTestGame();
    game.edit((state) => {
      state.players[1].items.push("loaded_die");
    });
    game.do({ type: "USE_ITEM", seat: 1, item: "loaded_die", loadedDieValue: 6 });
    roll(game, [2]);
    expect(game.state.lastRoll?.dice).toEqual([2, 6]);
    // 1 + 2 + 6 = 9, poi il tiro è normale: nessun dado truccato residuo.
    expect(game.state.players[1].position).toBe(9);
    expect(game.state.forcedDie).toBeNull();
  });
});

describe("disposizione di prova", () => {
  it("la casella 10 è monete piene e la 11 monete vuote", () => {
    const board = boardWithCell(10, { kind: "coins", sign: "gain" });
    expect(board.cells[9]).toEqual({ n: 10, kind: "coins", sign: "gain" });
  });
});

describe("azioni rifiutate (ogni rifiuto ha un messaggio)", () => {
  it("nessuna carta aperta: le azioni che la richiedono sono rifiutate", () => {
    const game = createTestGame();
    expect(game.reject({ type: "ANSWER_QUESTION", seat: 1, answer: "x" })).toBe("Nessuna domanda aperta.");
    expect(game.reject({ type: "JUDGE_ANSWER", seat: 1, verdict: "correct" })).toBe(
      "Nessuna domanda aperta.",
    );
    expect(game.reject({ type: "ACK_OPEN_QUESTION", seat: 1 })).toBe("Nessuna domanda aperta.");
    expect(game.reject({ type: "SKIP_QUESTION", seat: 1 })).toBe("Nessuna domanda da saltare.");
    expect(game.reject({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 })).toBe("Nessuna sfida aperta.");
    expect(game.reject({ type: "RESOLVE_DISPUTE", seat: 1, method: "rematch" })).toBe(
      "Nessuna sfida aperta.",
    );
    expect(game.reject({ type: "TIMER_EXPIRED", seat: 1 })).toBe("Nessuna sfida aperta.");
    expect(game.reject({ type: "DECLINE_STAR", seat: 1 })).toBe("Nessuna offerta di stella in corso.");
    expect(game.reject({ type: "MINIGAME_MOVE", seat: 1, move: { cell: 0 } })).toBe(
      "La sfida aperta non ha un minigioco.",
    );
  });

  it("giudicare una domanda a scelta multipla è rifiutato", () => {
    const game = createTestGame({ questions: [{ id: "tastes-002", kind: "multiple", category: "tastes" }] });
    game.place(1, 4);
    game.test.setRandom([0, 0, 10]);
    game.do({ type: "ROLL", seat: 1 });
    expect(game.reject({ type: "JUDGE_ANSWER", seat: 2, verdict: "correct" })).toBe(
      "Solo le risposte brevi si giudicano.",
    );
  });

  it("confermare una domanda non aperta è rifiutato", () => {
    const game = createTestGame({ questions: [{ id: "tastes-001", kind: "short", category: "tastes" }] });
    game.place(1, 4);
    game.test.setRandom([0, 0, 10]);
    game.do({ type: "ROLL", seat: 1 });
    expect(game.reject({ type: "ACK_OPEN_QUESTION", seat: 1 })).toBe(
      "Solo le domande aperte si confermano così.",
    );
  });

  it("la rimonta vale anche con i dadi speciali", () => {
    const game = createTestGame();
    game.place(1, 20);
    game.place(2, 45);
    game.edit((state) => {
      state.players[1].items.push("loaded_die");
    });
    game.do({ type: "USE_ITEM", seat: 1, item: "loaded_die", loadedDieValue: 1 });
    roll(game, [1]);
    expect(game.state.lastRoll).toEqual({ dice: [1, 1], comebackBonus: RULES.comeback.bonus, total: 4 });
  });

  it("non si usa un minigioco durante una carta che non ne ha", () => {
    const game = createTestGame({
      challenges: [
        {
          id: "mime",
          mode: "trial",
          verdict: "judge",
          prize: 2,
          durationSeconds: { min: 30, max: 30 },
          snakeFlash: false,
          minigame: null,
        },
      ],
    });
    game.place(1, 12);
    game.test.setRandom([0, 0]);
    game.do({ type: "ROLL", seat: 1 });
    expect(game.reject({ type: "MINIGAME_MOVE", seat: 1, move: { cell: 0 } })).toBe(
      "La sfida aperta non ha un minigioco.",
    );
  });

  it("in una sfida automatica non si dichiara il vincitore", () => {
    const game = createTestGame();
    game.place(1, 12);
    game.test.setRandom([0, 0]);
    game.do({ type: "ROLL", seat: 1 });
    expect(game.reject({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 })).toBe(
      "Questa sfida si decide con il minigioco.",
    );
  });
});
