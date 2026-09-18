import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { createTestGame, type TestGame } from "./testing";
import type { ChallengeCard, Seat } from "./types";

/**
 * Sfide: duello o prova, verdetto automatico, giudice, doppia conferma, disputa,
 * tempo finito e sfida lampo del serpente (docs/rules.md § Sfide, D-17, D-27, D-82, F4-02, F4-06).
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

  it("l'esito della sfida sta nell'evento: `won` distingue la prova fallita (D-59)", () => {
    const riuscita = openChallenge([trial]);
    riuscita.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 1 });
    const vinta = riuscita.events.find((event) => event.type === "CHALLENGE_RESOLVED");
    expect(vinta).toMatchObject({ seat: 1, won: true, prize: trial.prize });

    const fallita = openChallenge([trial]);
    fallita.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    const persa = fallita.events.find((event) => event.type === "CHALLENGE_RESOLVED");
    // Il verdetto è a favore del posto 2, ma nessuno ha vinto: il diario non deve dire «Vinta».
    expect(persa).toMatchObject({ seat: 2, won: false, prize: 0 });
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

describe("il tempo è indicativo (docs/rules.md § Sfide, D-82)", () => {
  it("la durata suggerita è la durata della carta, entro il massimo della serata", () => {
    const game = createTestGame({ challenges: [trial], settings: { maxChallengeSeconds: 10 } });
    game.place(1, 12);
    game.test.setRandom([0, 0]);
    game.do({ type: "ROLL", seat: 1 });
    const card = game.state.card as Extract<typeof game.state.card, { type: "challenge" }>;
    expect(card.suggestedSeconds).toBe(10);
  });

  it("una sfida lampo non suggerisce più dei secondi di `snakeFlashSeconds`", () => {
    const lunga: ChallengeCard = { ...trial, snakeFlash: true, durationSeconds: { min: 30, max: 300 } };
    const game = createTestGame({ challenges: [lunga], settings: { maxChallengeSeconds: 600 } });
    game.place(1, 13);
    game.test.setRandom([0, 0]);
    game.do({ type: "ROLL", seat: 1 }); // 15: testa del serpente 15→4, quindi sfida lampo
    const card = game.state.card as Extract<typeof game.state.card, { type: "challenge" }>;
    expect(card.snakeFlash).toBe(true);
    expect(card.suggestedSeconds).toBe(RULES.challenges.snakeFlashSeconds);
  });

  it("l'orologio che passa non chiude la carta e non produce nessun evento", () => {
    const game = openChallenge([trial]);
    const before = structuredClone(game.state);
    game.test.advanceSeconds(3600);
    expect(game.state).toEqual(before);
    expect(game.state.phase).toBe("resolving");
    expect(game.state.players[1].coins).toBe(0);
    // La carta è ancora viva: chi giudica la chiude come sempre.
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 1 });
    expect(game.state.players[1].coins).toBe(trial.prize);
  });

  it("una dichiarazione sola non chiude niente: la sfida continua", () => {
    const game = openChallenge([trial]);
    game.do({ type: "DECLARE_TIME_UP", seat: 1 });
    expect(game.events.map((event) => event.type)).toContain("TIME_UP_DECLARED");
    expect(game.events.map((event) => event.type)).not.toContain("CHALLENGE_TIME_UP");
    expect(game.state.card).toMatchObject({ timeUp: { 1: true } });
    expect(game.state.turn).toBe(1);
  });

  it("la stessa dichiarazione due volte è rifiutata", () => {
    const game = openChallenge([trial]);
    game.do({ type: "DECLARE_TIME_UP", seat: 1 });
    expect(game.reject({ type: "DECLARE_TIME_UP", seat: 1 })).toBe(
      "L'hai già detto: manca l'altro giocatore.",
    );
  });

  it("una prova finita senza verdetto è non riuscita quando lo dicono entrambi", () => {
    const game = openChallenge([trial]);
    game.do({ type: "DECLARE_TIME_UP", seat: 1 });
    game.do({ type: "DECLARE_TIME_UP", seat: 2 });
    expect(game.events.find((event) => event.type === "CHALLENGE_TIME_UP")).toMatchObject({
      outcome: "failed",
    });
    expect(game.state.players[1].coins).toBe(0);
    expect(game.state.card).toBeNull();
    expect(game.state.turn).toBe(2);
  });

  it("un duello finito passa alla doppia conferma e si chiude con le dichiarazioni", () => {
    const game = openChallenge([duel]);
    game.do({ type: "DECLARE_TIME_UP", seat: 1 });
    game.do({ type: "DECLARE_TIME_UP", seat: 2 });
    expect(game.events.find((event) => event.type === "CHALLENGE_TIME_UP")).toMatchObject({
      outcome: "double_confirm",
    });
    expect(game.state.card).toMatchObject({ verdict: "double_confirm" });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 2 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    expect(game.state.players[2].coins).toBe(duel.prize);
  });

  it("un duello automatico abbandona il minigioco e non resta a metà", () => {
    const game = openChallenge([automatic]);
    game.do({ type: "DECLARE_TIME_UP", seat: 1 });
    game.do({ type: "DECLARE_TIME_UP", seat: 2 });
    expect(game.state.card).toMatchObject({
      verdict: "double_confirm",
      minigame: null,
      minigameId: null,
    });
    // Il minigioco abbandonato non accetta più mosse: la carta si chiude con le dichiarazioni.
    expect(game.reject({ type: "MINIGAME_MOVE", seat: 1, move: { cell: 0 } })).toBe(
      "La sfida aperta non ha un minigioco.",
    );
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 1 });
    expect(game.state.players[1].coins).toBe(automatic.prize);
  });

  it("la rivincita azzera le dichiarazioni del tempo finito", () => {
    const game = openChallenge([duel]);
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 1 });
    game.do({ type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: 2 });
    game.do({ type: "RESOLVE_DISPUTE", seat: 1, method: "rematch" });
    game.do({ type: "RESOLVE_DISPUTE", seat: 2, method: "rematch" });
    expect(game.state.card).toMatchObject({ timeUp: {} });
  });

  it("senza una sfida aperta la dichiarazione è rifiutata", () => {
    const game = createTestGame({ challenges: [trial] });
    expect(game.reject({ type: "DECLARE_TIME_UP", seat: 1 })).toBe("Nessuna sfida aperta.");
  });
});

describe("sfida lampo del serpente (docs/rules.md § Turno 4, F4-06)", () => {
  it("si apre una carta con snakeFlash e una durata suggerita", () => {
    const game = snakeFlash();
    expect(game.state.card).toMatchObject({ type: "challenge", snakeFlash: true });
    expect(game.test.drawChallengeCalls[0]).toEqual({ snakeFlash: true });
    const card = game.state.card as Extract<typeof game.state.card, { type: "challenge" }>;
    expect(card.suggestedSeconds).toBe(30);
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

  it("finita senza un vincitore: la prova è non riuscita e si scende", () => {
    const game = snakeFlash();
    game.do({ type: "DECLARE_TIME_UP", seat: 1 });
    game.do({ type: "DECLARE_TIME_UP", seat: 2 });
    expect(game.state.players[1].position).toBe(4);
    expect(game.state.players[1].stats.challengesWon).toBe(0);
  });
});

describe("minigiochi a tempo: quiz-lampo e riflessi (F4-04, D-55)", () => {
  const quizCard: ChallengeCard = {
    id: "quiz-lampo",
    mode: "duel",
    verdict: "automatic",
    prize: 3,
    durationSeconds: { min: 60, max: 120 },
    snakeFlash: false,
    minigame: "quiz",
    quiz: [
      { question: "Quante corde ha una chitarra classica?", options: ["Quattro", "Sei"], correct: 1 },
      { question: "In quale città si trova la Torre Eiffel?", options: ["Parigi", "Lione"], correct: 0 },
      { question: "Qual è il pianeta più vicino al Sole?", options: ["Venere", "Mercurio"], correct: 1 },
    ],
  };

  const reflexCard: ChallengeCard = {
    id: "riflessi",
    mode: "duel",
    verdict: "automatic",
    prize: 3,
    durationSeconds: { min: 60, max: 120 },
    snakeFlash: false,
    minigame: "reflex",
  };

  const open = (card: ChallengeCard): TestGame => {
    const game = createTestGame({ challenges: [card] });
    game.place(1, 12);
    game.test.setRandom([0, 0]);
    game.do({ type: "ROLL", seat: 1 });
    return game;
  };

  const challengeOf = (game: TestGame) => {
    const card = game.state.card;
    if (card?.type !== "challenge") throw new Error("Nessuna carta sfida aperta.");
    return card;
  };

  it("il quiz parte dalle domande della carta e si chiude da solo", () => {
    const game = open(quizCard);
    expect(challengeOf(game).minigame?.kind).toBe("quiz");
    expect(game.events.map((event) => event.type)).toContain("MINIGAME_STARTED");

    // 1 risponde giusto, 2 sbaglia, 1 risponde giusto: vince il posto 1 senza dichiarazioni.
    game.do({ type: "MINIGAME_MOVE", seat: 1, move: { option: 1 } });
    game.do({ type: "MINIGAME_MOVE", seat: 2, move: { option: 1 } });
    game.do({ type: "MINIGAME_MOVE", seat: 1, move: { option: 1 } });

    expect(game.state.card).toBeNull();
    expect(game.state.players[1].coins).toBe(quizCard.prize);
    expect(game.state.players[1].stats.challengesWon).toBe(1);
    expect(game.events.map((event) => event.type)).toContain("MINIGAME_FINISHED");
  });

  it("nel quiz l'altro posto non può rispondere al posto tuo", () => {
    const game = open(quizCard);
    expect(game.reject({ type: "MINIGAME_MOVE", seat: 2, move: { option: 0 } })).toBe(
      "Non tocca a te nel minigioco.",
    );
  });

  it("i riflessi li giocano tutti e due: chi tocca dopo il segnale prende il punto", () => {
    const game = open(reflexCard);
    const card = challengeOf(game);
    if (card.minigame?.kind !== "reflex") throw new Error("Il minigioco non è quello dei riflessi.");
    expect(card.minigame.scores).toEqual({ 1: 0, 2: 0 });

    // Il segnale arriva entro pochi secondi: si aspetta la finestra dei RULES e si tocca.
    game.test.advanceSeconds(RULES.minigames.reflex.maxDelayMs / 1000 + 1);
    game.do({ type: "MINIGAME_MOVE", seat: 2, move: { press: true } });
    const after = challengeOf(game).minigame;
    if (after?.kind !== "reflex") throw new Error("Il minigioco non è quello dei riflessi.");
    expect(after.scores).toEqual({ 1: 0, 2: 1 });
    expect(after.round).toBe(2);
  });

  it("nei riflessi chi tocca prima del segnale regala il punto all'altro", () => {
    const game = open(reflexCard);
    game.do({ type: "MINIGAME_MOVE", seat: 1, move: { press: true } });
    const after = challengeOf(game).minigame;
    if (after?.kind !== "reflex") throw new Error("Il minigioco non è quello dei riflessi.");
    expect(after.scores).toEqual({ 1: 0, 2: 1 });
    expect(after.lastRound).toEqual({ winner: 2, falseStart: true });
  });
});
