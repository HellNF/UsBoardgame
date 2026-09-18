import { describe, expect, it } from "vitest";
import { classic } from "@/content/boards/classic";
import { RULES } from "./config";
import type { MinigameState } from "./minigames/types";
import { minigameTurn } from "./minigames";
import { createInitialState, reduce } from "./reducer";
import { createTestContext, DEFAULT_SETTINGS } from "./testing";
import { otherSeat, type Action, type GameState, type ItemId, type Seat } from "./types";

/**
 * Simulazione: partite giocate a caso sul tabellone `classic`, senza I/O e con RNG
 * deterministico (un seme per partita), per verificare che il motore non si blocchi
 * mai e che gli invarianti dello stato reggano (task F1-03, docs/rules.md).
 *
 * La strategia è volutamente stupida: a ogni passo si prendono le azioni che il
 * reducer accetta e se ne sceglie una a caso. Se **nessuna** azione passa, la partita è in
 * stallo e il test fallisce: da L1 (D-82) il tempo non è più una via d'uscita, quindi
 * l'orologio finto non salva più nessuna fase. Le uniche uscite sono le azioni dei due.
 */

// ---------------------------------------------------------------------------
// Caso e sequenze deterministiche
// ---------------------------------------------------------------------------

/** Generatore congruenziale: niente `Math.random` nei test del motore. */
function lcg(seed: number): () => number {
  let state = (seed * 2654435761) % 2147483648;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state;
  };
}

/** Valori per `ctx.randomInt` (0-99: dadi, pesca delle domande, mazzo del memory). */
const randomSequence = (seed: number, length = 512): number[] => {
  const next = lcg(seed);
  return Array.from({ length }, () => next() % 100);
};

const ITEM_IDS = Object.keys(RULES.items.prices) as ItemId[];
const VERDICTS = ["correct", "almost", "wrong"] as const;
const SEATS: Seat[] = [1, 2];

// ---------------------------------------------------------------------------
// Azioni candidate
// ---------------------------------------------------------------------------

/** Una mossa plausibile per il minigioco in corso (il reducer rifiuta le altre). */
function randomMove(minigame: MinigameState, next: () => number): unknown {
  switch (minigame.kind) {
    case "tic-tac-toe": {
      const free = minigame.board.map((cell, index) => (cell === null ? index : -1)).filter((i) => i >= 0);
      return free.length > 0 ? { cell: free[next() % free.length] } : null;
    }
    case "connect-four": {
      const columns: number[] = [];
      for (let column = 0; column < minigame.board[0].length; column++) {
        if (minigame.board[minigame.board.length - 1][column] === null) columns.push(column);
      }
      return columns.length > 0 ? { column: columns[next() % columns.length] } : null;
    }
    case "memory": {
      const hidden = minigame.cards
        .map((_, index) => index)
        .filter((index) => !minigame.matched[index] && !minigame.revealed.includes(index));
      return hidden.length > 0 ? { index: hidden[next() % hidden.length] } : null;
    }
  }
}

/** Tutte le azioni che lo stato corrente ammette, per i posti che possono agire. */
function candidates(state: GameState, next: () => number): Action[] {
  const actions: Action[] = [];
  const card = state.card;
  const turn = state.turn;
  const other = otherSeat(turn);
  const player = state.players[turn];

  if (state.phase === "pre_roll") actions.push({ type: "ROLL", seat: turn });

  // Oggetti e stella (il reducer rifiuta ciò che non è permesso in questa fase).
  actions.push({ type: "BUY_ITEM", seat: turn, item: ITEM_IDS[next() % ITEM_IDS.length] });
  actions.push({ type: "BUY_STAR", seat: turn });
  if (player.items.length > 0) {
    const owned = player.items[next() % player.items.length];
    actions.push({
      type: "USE_ITEM",
      seat: turn,
      item: owned,
      loadedDieValue: 1 + (next() % RULES.dice.faces),
    });
    actions.push({ type: "DISCARD_ITEM", seat: turn, item: owned });
  }

  if (card) {
    switch (card.type) {
      case "question":
        if (card.kind === "open") actions.push({ type: "ACK_OPEN_QUESTION", seat: turn });
        else if (card.kind === "multiple")
          actions.push({ type: "ANSWER_QUESTION", seat: turn, answer: "prova" });
        else if (card.givenAnswer === null)
          actions.push({ type: "ANSWER_QUESTION", seat: turn, answer: "risposta di prova" });
        else actions.push({ type: "JUDGE_ANSWER", seat: other, verdict: VERDICTS[next() % VERDICTS.length] });
        actions.push({ type: "SKIP_QUESTION", seat: turn });
        break;
      case "challenge": {
        if (card.minigame) {
          const move = randomMove(card.minigame, next);
          const who = minigameTurn(card.minigame);
          if (move !== null && who !== "both") actions.push({ type: "MINIGAME_MOVE", seat: who, move });
        } else if (card.disputed) {
          for (const seat of SEATS) {
            if (card.disputeChoices[seat] === undefined) {
              actions.push({
                type: "RESOLVE_DISPUTE",
                seat,
                method: next() % 2 === 0 ? "rematch" : "coin_flip",
              });
            }
          }
        } else {
          // Prova: giudica l'altro. Duello a doppia conferma: dichiarano entrambi.
          const canClaim =
            card.verdict === "judge" ? [other] : SEATS.filter((seat) => card.claims[seat] === undefined);
          for (const seat of canClaim) {
            actions.push({
              type: "CLAIM_CHALLENGE_RESULT",
              seat,
              winner: [1, 2, "draw"][next() % 3] as Seat | "draw",
            });
          }
        }
        // Il tempo è un'informazione (D-82): i due possono dire che è finito, ma serve dirlo in due.
        for (const seat of SEATS) {
          if (card.timeUp[seat] !== true) actions.push({ type: "DECLARE_TIME_UP", seat });
        }
        break;
      }
      case "event":
        actions.push({ type: "ACK_EVENT", seat: turn });
        break;
      case "star_offer":
        actions.push({ type: "BUY_STAR", seat: turn }, { type: "DECLINE_STAR", seat: turn });
        break;
      case "item_overflow":
        actions.push({ type: "DISCARD_ITEM", seat: turn, item: card.incoming });
        break;
    }
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Simulazione
// ---------------------------------------------------------------------------

type GameReport = {
  steps: number;
  stalls: number;
  rounds: number;
  reason: "finish" | "maxRounds" | null;
  winner: Seat | "draw" | null;
};

const MAX_STEPS = 3000;

function simulate(seed: number): GameReport {
  const test = createTestContext({ board: structuredClone(classic), random: randomSequence(seed) });
  const next = lcg(seed + 7);
  const settings = { ...DEFAULT_SETTINGS, boardId: classic.id };
  let state = createInitialState(settings, seed % 2 === 0 ? 1 : 2);

  let steps = 0;
  let stalls = 0;
  let reason: GameReport["reason"] = null;

  const check = (before: GameState, after: GameState, action: Action): void => {
    // 1. `version` aumenta di esattamente 1 a ogni azione accettata.
    expect(after.version, `${action.type}: version`).toBe(before.version + 1);
    // 2. Invarianti di stato.
    for (const seat of SEATS) {
      const player = after.players[seat];
      expect(player.coins, `posto ${seat}: monete`).toBeGreaterThanOrEqual(0);
      expect(player.stars, `posto ${seat}: stelle`).toBeGreaterThanOrEqual(0);
      expect(player.items.length, `posto ${seat}: oggetti`).toBeLessThanOrEqual(RULES.items.max);
      expect(player.position, `posto ${seat}: posizione`).toBeGreaterThanOrEqual(1);
      expect(player.position, `posto ${seat}: posizione`).toBeLessThanOrEqual(RULES.board.cells);
    }
    // 3. Il round non supera mai il limite: a fine partita è l'ultimo round giocato.
    expect(after.round, `round dopo ${action.type}`).toBeLessThanOrEqual(RULES.maxRounds);
    expect(after.round).toBeGreaterThanOrEqual(1);
    // 4. Il turno è sempre di uno dei due posti.
    expect([1, 2]).toContain(after.turn);
  };

  const apply = (action: Action): void => {
    const result = reduce(state, action, test.ctx);
    if (!result.ok)
      throw new Error(`Il reducer ha rifiutato un'azione accettata (${action.type}): ${result.error}`);
    check(state, result.state, action);
    state = result.state;
    for (const event of result.events) {
      if (event.type === "GAME_FINISHED") reason = event.reason;
    }
  };

  while (state.phase !== "finished") {
    steps += 1;
    expect(steps, `partita ${seed}: troppi passi (${MAX_STEPS})`).toBeLessThanOrEqual(MAX_STEPS);

    const usable = candidates(state, next).filter((action) => reduce(state, action, test.ctx).ok);
    if (usable.length > 0) {
      apply(usable[next() % usable.length]);
      continue;
    }

    // Nessuna azione accettata: da L1 (D-82) il tempo non apre più nessuna porta, quindi non
    // c'è nessun orologio da far avanzare. Se lo stato non offre un'uscita, la partita è in stallo.
    stalls += 1;
    console.info(
      `[simulazione] partita ${seed}: stallo in fase ${state.phase}, ` +
        `carta ${state.card?.type ?? "nessuna"}, turno ${state.turn}`,
    );
    break;
  }

  return { steps, stalls, rounds: state.round, reason, winner: state.winner };
}

describe("simulazione di partite casuali (docs/rules.md)", () => {
  const GAMES = 200;
  const reports: { seed: number; report: GameReport }[] = [];

  it(`${GAMES} partite sul tabellone classic finiscono senza bloccarsi`, () => {
    for (let seed = 1; seed <= GAMES; seed++) {
      const report = simulate(seed);
      expect(report.stalls, `partita ${seed}: stallo`).toBe(0);
      expect(report.rounds, `partita ${seed}: round`).toBeLessThanOrEqual(RULES.maxRounds);
      expect(report.winner).not.toBeNull();
      reports.push({ seed, report });
    }

    const games = reports.map((item) => item.report);
    const rounds = games.map((game) => game.rounds);
    const averageRounds = rounds.reduce((sum, value) => sum + value, 0) / games.length;
    const byReason = {
      finish: games.filter((game) => game.reason === "finish").length,
      maxRounds: games.filter((game) => game.reason === "maxRounds").length,
    };
    console.info(
      `[simulazione] ${GAMES} partite · round medi ${averageRounds.toFixed(1)} (min ${Math.min(...rounds)}, max ${Math.max(...rounds)}) · ` +
        `fine per arrivo ${byReason.finish}, per limite di round ${byReason.maxRounds} · passi medi ${Math.round(
          games.reduce((sum, game) => sum + game.steps, 0) / games.length,
        )}`,
    );

    // Le partite devono durare un numero di round plausibile, non finire subito né al limite.
    expect(averageRounds).toBeGreaterThan(1);
    expect(averageRounds).toBeLessThan(RULES.maxRounds);
    // La maggior parte delle partite deve finire perché qualcuno arriva alla 100, non per il limite.
    expect(byReason.finish).toBeGreaterThan(byReason.maxRounds);
    expect(games.every((game) => game.steps > 2)).toBe(true);
  }, 120_000);
});
