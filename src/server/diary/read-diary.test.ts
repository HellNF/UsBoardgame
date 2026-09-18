import { describe, expect, it } from "vitest";

import { challenges } from "@/content/challenges";
import { questions } from "@/content/questions";
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

/** Domanda vera del catalogo: il diario deve scriverne il testo, non l'id. */
const realQuestion = questions.find((question) => question.kind === "multiple")!;

describe("diario della serata (F5-06)", () => {
  it("costruisce un momento per ogni evento che vale la pena raccontare", () => {
    const events: EventRow[] = [
      row(1, "GAME_STARTED", null, { round: 1 }),
      row(2, "ROUND_STARTED", 1, { round: 5 }),
      row(3, "QUESTION_ANSWERED", 1, { questionId: realQuestion.id, answer: "Cinema" }),
      row(4, "QUESTION_JUDGED", 1, { questionId: realQuestion.id, verdict: "correct" }),
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
    expect(entries[0]).toMatchObject({ kind: "question", seat: 1, title: realQuestion.text });
    expect(entries[1].detail).toBe("Verdetto: giusta.");
    expect(entries[2].detail).toBe("Dalla domanda, raddoppiate.");
    expect(entries[3]).toMatchObject({ kind: "challenge", seat: 2, title: "Tris" });
    expect(entries[3].detail).toBe("Vinta: +3 monete (minigioco).");
    expect(entries[4].title).toBe("Vento a favore");
    expect(entries[4].detail).toBe("casella 65");
    expect(entries[5]).toMatchObject({ kind: "event", title: "La scala" });
    expect(entries[5].detail).toBe("Su, dalla 8 alla 26.");
    expect(entries[6]).toMatchObject({ kind: "star", seat: 2 });
    expect(entries[7].title).toBe("Ladro");
  });

  it("scrive il testo della domanda, non l'id (anche per le sfide, dal catalogo)", () => {
    const named = challenges.find((challenge) => challenge.category === "external")!;
    const entries = diaryEntriesFromEvents([
      row(1, "QUESTION_ANSWERED", 1, { questionId: realQuestion.id, answer: "Montagna" }),
      row(2, "CHALLENGE_RESOLVED", 1, { challengeId: named.id, prize: 5, method: "double_confirm" }),
    ]);
    expect(entries[0].title).toBe(realQuestion.text);
    expect(entries[0].title).not.toContain(realQuestion.id);
    expect(entries[1].title).toBe(named.name);
  });

  it("una domanda fuori catalogo resta leggibile invece di sparire", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "QUESTION_JUDGED", 1, { questionId: "tastes-999", verdict: "quasi" }),
    ]);
    expect(entries[0].title).toBe("Domanda tastes-999");
    expect(entries[0].detail).toBe("Verdetto: quasi.");
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

  it("le monete a zero non sono un momento della serata", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "COINS_GAINED", 1, { amount: 0, source: "cell" }),
      row(2, "COINS_LOST", 2, { amount: 0, source: "cell" }),
      row(3, "COINS_GAINED", 1, { amount: 3, source: "cell" }),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("+3 monete");
    expect(entries[0].detail).toBe("Dalla casella.");
  });

  it("una sfida in pareggio non dà premio, e il diario lo dice", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "CHALLENGE_RESOLVED", 1, { challengeId: "memory", prize: 0, method: "automatic", seat: "draw" }),
    ]);
    expect(entries[0].detail).toContain("Pareggio");
  });

  it("una prova finita senza verdetto è una prova non riuscita", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "CHALLENGE_TIME_UP", 1, { challengeId: "mimo", outcome: "failed" }),
      row(2, "CHALLENGE_TIME_UP", 1, { challengeId: "karaoke-a-due", outcome: "double_confirm" }),
    ]);
    expect(entries[0].title).toBe("Il tempo è finito: Mimo in 30 secondi");
    expect(entries[0].detail).toContain("non è riuscita");
    expect(entries[1].detail).toContain("dichiarazioni");
  });

  it("una prova non riuscita non è una vittoria, ed è il momento di chi ha provato (D-59)", () => {
    // Il verdetto va al posto 1 (la prova del posto 2 è fallita): il momento è del posto 2.
    const entries = diaryEntriesFromEvents([
      row(1, "CHALLENGE_RESOLVED", 1, {
        challengeId: "mimo",
        prize: 0,
        method: "judge",
        seat: 1,
        won: false,
      }),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].seat).toBe(2);
    expect(entries[0].detail).toContain("Prova non riuscita");
    expect(entries[0].detail).not.toContain("+0");
  });

  it("una sfida vinta senza premio non scrive «+0 monete»", () => {
    const entries = diaryEntriesFromEvents([
      row(1, "CHALLENGE_RESOLVED", 2, {
        challengeId: "mimo",
        prize: 0,
        method: "judge",
        seat: 2,
        won: true,
      }),
    ]);
    expect(entries[0].seat).toBe(2);
    expect(entries[0].detail).toContain("nessun premio in monete");
    expect(entries[0].detail).not.toContain("+0");
  });

  it("le monete perse si vedono con il segno meno", () => {
    const entries = diaryEntriesFromEvents([row(1, "COINS_LOST", 2, { amount: 4, source: "thief" })]);
    expect(entries[0].title).toBe("−4 monete");
    expect(entries[0].detail).toBe("Al ladro.");
  });
});
