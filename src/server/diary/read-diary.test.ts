import { describe, expect, it } from "vitest";

import { diaryEntriesFromEvents, type EventRow } from "./read-diary";

const row = (
  id: number,
  type: string,
  seat: number | null,
  payload: Record<string, unknown> = {},
): EventRow => ({
  id,
  version: id,
  seat,
  type,
  payload,
});

describe("diario della serata (F5-06)", () => {
  it("costruisce un momento per ogni evento che vale la pena raccontare", () => {
    const events: EventRow[] = [
      row(1, "GAME_STARTED", null, { round: 1 }),
      row(2, "ROUND_STARTED", 1, { round: 5 }),
      row(3, "QUESTION_ANSWERED", 1, { questionId: "tastes-002", answer: "Cinema" }),
      row(4, "QUESTION_JUDGED", 1, { questionId: "tastes-002", verdict: "correct" }),
      row(5, "COINS_GAINED", 1, { amount: 6, source: "question", doubled: true }),
      row(6, "CHALLENGE_RESOLVED", 2, { challengeId: "tic-tac-toe", prize: 3, method: "automatic" }),
      row(7, "EVENT_RESOLVED", 2, { eventId: "tailwind", detail: "casella 65" }),
      row(8, "CLIMBED_LADDER", 1, { from: 8, to: 26 }),
      row(9, "STAR_BOUGHT", 2, { price: 10 }),
      row(10, "ITEM_BOUGHT", 1, { item: "thief", price: 6 }),
    ];

    const entries = diaryEntriesFromEvents(events);

    expect(entries).toHaveLength(8);
    expect(entries.map((entry) => entry.round)).toEqual([5, 5, 5, 5, 5, 5, 5, 5]);
    expect(entries[0]).toMatchObject({ kind: "question", seat: 1, title: "Domanda tastes-002" });
    expect(entries[1].detail).toBe("Verdetto: giusta.");
    expect(entries[2].detail).toBe("domanda (raddoppiate).");
    expect(entries[3]).toMatchObject({ kind: "challenge", seat: 2 });
    expect(entries[3].detail).toBe("Vinta: +3 monete (minigioco).");
    expect(entries[4].title).toBe("Vento a favore");
    expect(entries[4].detail).toBe("casella 65");
    expect(entries[5]).toMatchObject({ kind: "event", title: "Scala" });
    expect(entries[6]).toMatchObject({ kind: "star", seat: 2 });
    expect(entries[7].title).toBe("Ladro");
  });

  it("salta i rumori: tiri, cambi di turno, eventi di partita", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "ROLLED", 1, { dice: [3, 4], total: 7 }),
      row(2, "MOVED", 1, { from: 4, to: 11 }),
      row(3, "TURN_ENDED", 1, { round: 1 }),
      row(4, "GAME_FINISHED", null, { winner: 1 }),
    ]);
    expect(entries).toEqual([]);
  });

  it("una sfida in pareggio non dà premio, e il diario lo dice", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "CHALLENGE_RESOLVED", 1, { challengeId: "memory", prize: 0, method: "automatic", seat: "draw" }),
    ]);
    expect(entries[0].detail).toContain("Pareggio");
  });

  it("una prova scaduta è una prova fallita", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "TIMER_EXPIRED", 1, { challengeId: "mimo", outcome: "failed" }),
      row(2, "TIMER_EXPIRED", 1, { challengeId: "karaoke", outcome: "double_confirm" }),
    ]);
    expect(entries[0].detail).toContain("Prova fallita");
    expect(entries[1].detail).toContain("doppia conferma");
  });

  it("le monete perse si vedono con il segno meno", () => {
    const entries = diaryEntriesFromEvents([row(1, "COINS_LOST", 2, { amount: 4, source: "thief" })]);
    expect(entries[0].title).toBe("−4 monete");
    expect(entries[0].detail).toBe("ladro.");
  });
});
