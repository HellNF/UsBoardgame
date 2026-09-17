import { describe, expect, it } from "vitest";

import { actionRequestSchema } from "./action-schema";

const base = { expectedVersion: 3 };

describe("validazione delle azioni del client (F2-01)", () => {
  it("accetta le azioni del motore, con i campi giusti", () => {
    const valid = [
      { type: "ROLL", seat: 2 },
      { type: "BUY_ITEM", seat: 1, item: "loaded_die" },
      { type: "USE_ITEM", seat: 1, item: "loaded_die", loadedDieValue: 6 },
      { type: "ANSWER_QUESTION", seat: 1, answer: "Cinema" },
      { type: "JUDGE_ANSWER", seat: 2, verdict: "almost" },
      { type: "SKIP_QUESTION", seat: 1 },
      { type: "ACK_OPEN_QUESTION", seat: 1 },
      { type: "CLAIM_CHALLENGE_RESULT", seat: 2, winner: "draw" },
      { type: "CLAIM_CHALLENGE_RESULT", seat: 1, winner: 2 },
      { type: "RESOLVE_DISPUTE", seat: 1, method: "coin_flip" },
      { type: "MINIGAME_MOVE", seat: 1, move: { cell: 4 } },
      { type: "TIMER_EXPIRED", seat: 2 },
      { type: "BUY_STAR", seat: 1 },
      { type: "DECLINE_STAR", seat: 2 },
      { type: "ACK_EVENT", seat: 1 },
      { type: "DISCARD_ITEM", seat: 1, item: "incoming" },
      { type: "DISCARD_ITEM", seat: 2, item: "antidote" },
    ];
    for (const action of valid) {
      const parsed = actionRequestSchema.safeParse({ ...base, action });
      expect(parsed.success, JSON.stringify(action)).toBe(true);
    }
  });

  it("rifiuta un posto che non è 1 o 2", () => {
    expect(actionRequestSchema.safeParse({ ...base, action: { type: "ROLL", seat: 3 } }).success).toBe(false);
    expect(actionRequestSchema.safeParse({ ...base, action: { type: "ROLL", seat: "1" } }).success).toBe(
      false,
    );
  });

  it("rifiuta un tipo di azione inventato e i campi di troppo", () => {
    expect(actionRequestSchema.safeParse({ ...base, action: { type: "TELEPORT", seat: 1 } }).success).toBe(
      false,
    );
    expect(
      actionRequestSchema.safeParse({ ...base, action: { type: "ROLL", seat: 1, dice: [6, 6] } }).success,
    ).toBe(false);
  });

  it("rifiuta un dado truccato fuori scala e un verdetto sconosciuto", () => {
    expect(
      actionRequestSchema.safeParse({
        ...base,
        action: { type: "USE_ITEM", seat: 1, item: "loaded_die", loadedDieValue: 7 },
      }).success,
    ).toBe(false);
    expect(
      actionRequestSchema.safeParse({ ...base, action: { type: "JUDGE_ANSWER", seat: 1, verdict: "quasi" } })
        .success,
    ).toBe(false);
  });

  it("rifiuta una versione attesa mancante o negativa", () => {
    expect(actionRequestSchema.safeParse({ action: { type: "ROLL", seat: 1 } }).success).toBe(false);
    expect(
      actionRequestSchema.safeParse({ action: { type: "ROLL", seat: 1 }, expectedVersion: -1 }).success,
    ).toBe(false);
  });

  it("rifiuta una risposta vuota a una domanda", () => {
    expect(
      actionRequestSchema.safeParse({ ...base, action: { type: "ANSWER_QUESTION", seat: 1, answer: "" } })
        .success,
    ).toBe(false);
  });
});
