import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, type TestGame } from "./testing";
import type { ChallengeCard, Seat } from "./types";

/**
 * Sfide: duello o prova, verdetto automatico, giudice, doppia conferma, disputa,
 * timer e sfida lampo del serpente (docs/rules.md § Sfide, D-17, D-27, F4-02, F4-06).
 */

const duel: ChallengeCard = {
  id: "lichess-blitz",
  mode: "duel",
  verdict: "double_confirm",
  prize: 5,
  durationSeconds: { min: 300, max: 480 },
  snakeFlash: false,
  minigame: null,
};

const trial: ChallengeCard = {
  id: "mime",
  mode: "trial",
  verdict: "judge",
  prize: 2,
  durationSeconds: { min: 30, max: 30 },
  snakeFlash: false,
  minigame: null,
};

const automatic: ChallengeCard = {
  id: "tic-tac-toe",
  mode: "duel",
  verdict: "automatic",
  prize: 3,
  durationSeconds: { min: 60, max: 180 },
  snakeFlash: false,
  minigame: "tic-tac-toe",
};

/** Porta il giocatore 1 sulla casella sfida (la 14) e apre la carta. */
const openChallenge = (challenges: ChallengeCard[], seat: Seat = 1): TestGame => {
  const game = createTestGame({ challenges });
  game.place(seat, 12);
  game.test.setRandom([0, 0]);
  game.do({ type: "ROLL", seat });
  return game;
};

const snakeFlash = (): TestGame => {
  const game = createTestGame();
  game.place(1, 13);
  game.test.setRandom([0, 0]);
  game.do({ type: "ROLL", seat: 1 }); // 15: testa del serpente 15→4
  return game;
};

describe("duello a doppia conferma (docs/rules.md § Sfide)", () => {
  it("se le dichiarazioni coincidono, vince chi è stato dichiarato", () => {
    const game = openChallenge([duel]);
    expect(game.state.card).toMatchObject({ type: "challenge", mode: "duel", verdict: "double_confirm" });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    expect(game.state.phase).toBe("resolving");
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 1 });
    expect(game.state.players[1].coins).toBe(duel.prize);
    expect(game.state.players[1].stats.challengesWon).toBe(1);
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
  });

  it("se le dichiarazioni non coincidono si apre la disputa", () => {
    const game = openChallenge([duel]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    expect(game.events.map((event) => event.type)).toContain("CHALLENGE_DISPUTED");
    expect(game.state.card).toMatchObject({ disputed: true });
    expect(game.reject({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 })).toBe(
      "Le dichiarazioni non coincidono: si sceglie con RESOLVE_DISPUTE.",
    );
  });

  it("se entrambi scelgono la rivincita, la carta riparte", () => {
    const game = openChallenge([duel]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    game.do({ type: "RESOLVE_DISPUTE", seat: 1, method: "rematch" });
    expect(game.state.card).toMatchObject({ disputed: true });
    game.do({ type: "RESOLVE_DISPUTE", seat: 2, method: "rematch" });
    expect(game.events.map((event) => event.type)).toContain("CHALLENGE_REMATCH");
    expect(game.state.card).toMatchObject({ disputed: false, claims: {} });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.turn).toBe(1);
  });

  it("se scelgono in modo diverso decide il lancio di moneta del server", () => {
    const game = openChallenge([duel]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    game.do({ type: "RESOLVE_DISPUTE", seat: 1, method: "rematch" });
    game.test.setRandom([0]); // 0 → vince il posto 1
    game.do({ type: "RESOLVE_DISPUTE", seat: 2, method: "coin_flip" });
    expect(game.state.players[1].coins).toBe(duel.prize);
    expect(game.events.find((event) => event.type === "CHALLENGE_RESOLVED")).toMatchObject({
      seat: 1,
      method: "coin_flip",
    });
  });

  it("si sceglie una sola volta come sciogliere il nodo", () => {
    const game = openChallenge([duel]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    game.do({ type: "RESOLVE_DISPUTE", seat: 1, method: "coin_flip" });
    expect(game.reject({ type: "RESOLVE_DISPUTE", seat: 1, method: "rematch" })).toBe(
      "Hai già scelto come sciogliere il nodo.",
    );
  });

  it("pareggio dichiarato da entrambi: nessun premio", () => {
    const game = openChallenge([duel]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: "draw" });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: "draw" });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.players[1].stats.challengesWon).toBe(0);
    expect(game.state.turn).toBe(2);
  });
});

describe("prova (trial) giudicata dall'altro (docs/rules.md § Sfide)", () => {
  it("giudica solo chi è interrogato", () => {
    const game = openChallenge([trial]);
    expect(game.reject({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 })).toBe(
      "In una prova decide l'altro giocatore.",
    );
  });

  it("prova riuscita: il premio va a chi ha giocato e conta come sfida vinta", () => {
    const game = openChallenge([trial]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 1 });
    expect(game.state.players[1].coins).toBe(trial.prize);
    expect(game.state.players[1].stats.challengesWon).toBe(1);
    expect(game.state.players[2].coins).toBe(0);
  });

  it("prova fallita: nessun premio per nessuno", () => {
    const game = openChallenge([trial]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.players[2].coins).toBe(0);
    expect(game.state.players[1].stats.challengesWon).toBe(0);
    expect(game.state.players[2].stats.challengesWon).toBe(0);
  });
});

describe("minigioco integrato (docs/rules.md § Sfide, D-26)", () => {
  it("si avvia da solo e muove chi ha pescato la carta", () => {
    const game = openChallenge([automatic]);
    expect(game.state.card?.type).toBe("challenge");
    const card = game.state.card as Extract<typeof game.state.card, { type: "challenge" }>;
    expect(card.minigameId).toBe("tic-tac-toe");
    expect(card.minigame?.kind).toBe("tic-tac-toe");
    expect(game.events.map((event) => event.type)).toContain("MINIGAME_STARTED");
    expect(game.reject({ type: "MINIGAME_MOVE", seat: 2, move: { cell: 0 } })).toBe(
      "Non tocca a te nel minigioco.",
    );
  });

  it("una mossa fuori dal tris è rifiutata", () => {
    const game = openChallenge([automatic]);
    expect(game.reject({ type: "MINIGAME_MOVE", seat: 1, move: { cell: 12 } })).toBe(
      "Mossa del tris non valida: serve `cell` da 0 a 8.",
    );
  });

  it("vincendo il tris si prende il premio", () => {
    const game = openChallenge([automatic]);
    for (const [seat, cell] of [
      [1, 0],
      [2, 3],
      [1, 1],
      [2, 4],
      [1, 2],
    ] as const) {
      game.do({ type: "MINIGAME_MOVE", seat, move: { cell } });
    }
    expect(game.events.map((event) => event.type)).toContain("MINIGAME_FINISHED");
    expect(game.state.players[1].coins).toBe(automatic.prize);
    expect(game.state.players[1].stats.challengesWon).toBe(1);
    expect(game.state.turn).toBe(2);
  });

  it("pareggio nel minigioco: si riparte con una rivincita", () => {
    const game = openChallenge([automatic]);
    game.edit((state) => {
      state.card = {
        ...(state.card as Extract<typeof state.card, { type: "challenge" }>),
        minigame: {
          kind: "tic-tac-toe",
          board: [1, 1, 2, 2, 2, 1, 1, 2, null],
          turn: 1,
          winner: null,
        },
      };
    });
    game.do({ type: "MINIGAME_MOVE", seat: 1, move: { cell: 8 } });
    expect(game.events.map((event) => event.type)).toContain("CHALLENGE_REMATCH");
    const card = game.state.card as Extract<typeof game.state.card, { type: "challenge" }>;
    expect(card.minigame).toMatchObject({ board: Array(9).fill(null) });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.turn).toBe(1);
  });
});

describe("timer (docs/rules.md § Sfide, D-25)", () => {
  it("prima della scadenza TIMER_EXPIRED è rifiutato", () => {
    const game = openChallenge([trial]);
    expect(game.reject({ type: "TIMER_EXPIRED", seat: 1 })).toBe("Il tempo non è ancora scaduto.");
  });

  it("una prova scaduta senza verdetto è fallita", () => {
    const game = openChallenge([trial]);
    game.test.advanceSeconds(30);
    game.do({ type: "TIMER_EXPIRED", seat: 1 });
    expect(game.events.map((event) => event.type)).toContain("TIMER_EXPIRED");
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
  });

  it("un duello scaduto passa alla doppia conferma", () => {
    const game = openChallenge([duel]);
    game.test.advanceSeconds(300);
    game.do({ type: "TIMER_EXPIRED", seat: 1 });
    expect(game.state.card).toMatchObject({ verdict: "double_confirm", deadlineAt: null });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 2 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    expect(game.state.players[2].coins).toBe(duel.prize);
  });

  it("la scadenza è la durata della carta, entro il massimo della serata", () => {
    const game = createTestGame({ challenges: [trial], settings: { maxChallengeSeconds: 10 } });
    game.place(1, 12);
    game.test.setRandom([0, 0]);
    game.do({ type: "ROLL", seat: 1 });
    const card = game.state.card as Extract<typeof game.state.card, { type: "challenge" }>;
    expect(card.deadlineAt).toBe("2026-09-17T20:00:10.000Z");
  });
});

describe("sfida lampo del serpente (docs/rules.md § Turno 4, F4-06)", () => {
  it("si apre una carta con snakeFlash e 30 secondi di tempo", () => {
    const game = snakeFlash();
    expect(game.state.card).toMatchObject({ type: "challenge", snakeFlash: true });
    expect(game.test.drawChallengeCalls[0]).toEqual({ snakeFlash: true });
    const card = game.state.card as Extract<typeof game.state.card, { type: "challenge" }>;
    expect(card.deadlineAt).toBe("2026-09-17T20:00:30.000Z");
  });

  it("vinta: si resta dov'è, una sfida vinta e nessuna moneta", () => {
    const game = snakeFlash();
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 1 });
    expect(game.state.players[1].position).toBe(15);
    expect(game.state.players[1].stats.challengesWon).toBe(1);
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.turn).toBe(2);
  });

  it("persa: si scende alla coda del serpente", () => {
    const game = snakeFlash();
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    expect(game.state.players[1].position).toBe(4);
    expect(game.state.players[1].stats.challengesWon).toBe(0);
    expect(game.events.map((event) => event.type)).toContain("SLID_DOWN_SNAKE");
  });

  it("scaduta: la prova è fallita e si scende", () => {
    const game = snakeFlash();
    game.test.advanceSeconds(RULES.challenges.snakeFlashSeconds);
    game.do({ type: "TIMER_EXPIRED", seat: 1 });
    expect(game.state.players[1].position).toBe(4);
    expect(game.state.players[1].stats.challengesWon).toBe(0);
  });
});
