import { describe, expect, it } from "vitest";

import type { ChallengeCard } from "@/engine";
import {
  asDrawnQuestion,
  drawAttempts,
  fallbackCategories,
  matchesKind,
  selectChallenge,
  selectQuestion,
  type QuestionCandidate,
} from "./question-draw";

const questions: QuestionCandidate[] = [
  { id: "tastes-001", category: "tastes", level: 1, kind: "short" },
  { id: "tastes-002", category: "tastes", level: 1, kind: "multiple" },
  { id: "tastes-003", category: "tastes", level: 1, kind: "open" },
  { id: "deep-001", category: "deep", level: 1, kind: "multiple" },
  { id: "deep-002", category: "deep", level: 2, kind: "multiple" },
  { id: "deep-003", category: "deep", level: 3, kind: "open" },
];

const first = (_max: number) => 0;

describe("pesca delle domande (F3-01)", () => {
  it("pesca solo nella categoria chiesta", () => {
    const result = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: true,
      used: [],
      answerable: ["tastes-001", "tastes-002"],
      randomInt: first,
    });
    expect(result.ok && result.question.category).toBe("tastes");
  });

  it("con `knowMeOnly` non pesca mai una domanda aperta, e viceversa", () => {
    const knowMe = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: true,
      used: [],
      answerable: ["tastes-001", "tastes-002"],
      randomInt: first,
    });
    expect(knowMe.ok && knowMe.question.kind).not.toBe("open");

    const open = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: false,
      used: [],
      answerable: [],
      randomInt: first,
    });
    expect(open.ok && open.question.id).toBe("tastes-003");
  });

  it("rispetta il livello massimo della casella (solo le profonde)", () => {
    const low = selectQuestion({
      candidates: questions,
      category: "deep",
      maxLevel: 1,
      knowMeOnly: true,
      used: [],
      answerable: ["deep-001", "deep-002", "deep-003"],
      randomInt: first,
    });
    expect(low.ok && low.question.id).toBe("deep-001");

    const high = selectQuestion({
      candidates: questions,
      category: "deep",
      maxLevel: 3,
      knowMeOnly: true,
      used: ["deep-001"],
      answerable: ["deep-001", "deep-002", "deep-003"],
      randomInt: first,
    });
    expect(high.ok && high.question.id).toBe("deep-002");

    // A mazzo esaurito il registro si azzera: la domanda torna pescabile.
    const exhausted = selectQuestion({
      candidates: questions,
      category: "deep",
      maxLevel: 3,
      knowMeOnly: true,
      used: ["deep-001", "deep-002"],
      answerable: ["deep-001", "deep-002", "deep-003"],
      randomInt: first,
    });
    expect(exhausted.ok && exhausted.question.id).toBe("deep-001");
    expect(exhausted.ok && exhausted.exhausted).toBe(true);
  });

  it("non pesca una 'quanto mi conosci' senza risposta in scheda (D-28)", () => {
    const result = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: true,
      used: [],
      answerable: ["tastes-002"],
      randomInt: first,
    });
    expect(result.ok && result.question.id).toBe("tastes-002");
  });

  it("a mazzo esaurito segnala il registro da azzerare e ripesca (D-29)", () => {
    const result = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: true,
      used: ["tastes-002"],
      answerable: ["tastes-001", "tastes-002"],
      randomInt: first,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exhausted).toBe(false);
    expect(result.question.id).toBe("tastes-001");

    const exhausted = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: true,
      used: ["tastes-001", "tastes-002"],
      answerable: ["tastes-001", "tastes-002"],
      randomInt: first,
    });
    expect(exhausted.ok && exhausted.exhausted).toBe(true);
  });

  it("se non c'è nulla di pescabile lo dice, così l'adattatore prova un'altra categoria (D-30)", () => {
    const empty = selectQuestion({
      candidates: questions,
      category: "memories",
      maxLevel: 3,
      knowMeOnly: true,
      used: [],
      answerable: [],
      randomInt: first,
    });
    expect(empty.ok).toBe(false);

    const noSheet = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: true,
      used: [],
      answerable: [],
      randomInt: first,
    });
    expect(noSheet.ok).toBe(false);
  });

  it("sceglie fra i candidati senza uscire dall'indice", () => {
    for (const value of [0, 1, 2, 3, 99, -1]) {
      const result = selectQuestion({
        candidates: questions,
        category: "tastes",
        maxLevel: 3,
        knowMeOnly: false,
        used: [],
        answerable: [],
        randomInt: () => value,
      });
      expect(result.ok).toBe(true);
    }
  });

  it("le altre categorie escludono quella di partenza", () => {
    const others = fallbackCategories("deep");
    expect(others).toHaveLength(4);
    expect(others).not.toContain("deep");
  });

  it("riconosce il tipo giusto per la richiesta", () => {
    expect(matchesKind({ id: "x-001", category: "deep", level: 1, kind: "multiple" }, true)).toBe(true);
    expect(matchesKind({ id: "x-002", category: "deep", level: 1, kind: "open" }, true)).toBe(false);
    expect(matchesKind({ id: "x-002", category: "deep", level: 1, kind: "open" }, false)).toBe(true);
  });

  it("consegna al motore solo id, tipo e categoria", () => {
    const result = selectQuestion({
      candidates: questions,
      category: "tastes",
      maxLevel: 3,
      knowMeOnly: false,
      used: [],
      answerable: [],
      randomInt: first,
    });
    if (!result.ok) throw new Error("attesa una domanda");
    expect(asDrawnQuestion(result.question)).toEqual({ id: "tastes-003", kind: "open", category: "tastes" });
  });
});

const challenge = (id: string, snakeFlash: boolean): ChallengeCard => ({
  id,
  mode: "duel",
  verdict: "double_confirm",
  prize: 3,
  durationSeconds: { min: 30, max: 60 },
  snakeFlash,
  minigame: null,
});

const challenges = [challenge("memory", false), challenge("mimo", true), challenge("karaoke", false)];

describe("pesca delle sfide (F3-01)", () => {
  it("la sfida lampo è lampo, la sfida normale non lo è", () => {
    const flash = selectChallenge({ candidates: challenges, snakeFlash: true, used: [], randomInt: () => 5 });
    expect(flash.ok && flash.challenge.id).toBe("mimo");

    const normal = selectChallenge({
      candidates: challenges,
      snakeFlash: false,
      used: [],
      randomInt: () => 0,
    });
    expect(normal.ok && normal.challenge.snakeFlash).toBe(false);
  });

  it("evita le sfide già uscite e a mazzo esaurito riparte", () => {
    const fresh = selectChallenge({
      candidates: challenges,
      snakeFlash: false,
      used: ["memory"],
      randomInt: () => 0,
    });
    expect(fresh.ok && fresh.challenge.id).toBe("karaoke");

    const exhausted = selectChallenge({
      candidates: challenges,
      snakeFlash: false,
      used: ["memory", "karaoke"],
      randomInt: () => 0,
    });
    expect(exhausted.ok && exhausted.exhausted).toBe(true);
  });

  it("se non ci sono sfide del tipo chiesto lo dice", () => {
    const result = selectChallenge({
      candidates: [challenge("memory", false)],
      snakeFlash: true,
      used: [],
      randomInt: () => 0,
    });
    expect(result.ok).toBe(false);
  });

  describe("ripieghi quando la scheda è vuota (D-58)", () => {
    const shortIds = ["tastes-001"];

    it("per una aperta non c'è nessun ripiego: un tentativo solo", () => {
      const attempts = drawAttempts({ knowMeOnly: false, answerable: [], shortIds });
      expect(attempts).toEqual([{ knowMeOnly: false, answerable: [] }]);
    });

    it("per una «quanto mi conosci» prima la scheda, poi le brevi, poi le aperte", () => {
      const attempts = drawAttempts({
        knowMeOnly: true,
        answerable: ["tastes-002"],
        shortIds,
      });
      expect(attempts).toEqual([
        { knowMeOnly: true, answerable: ["tastes-002"] },
        { knowMeOnly: true, answerable: shortIds },
        { knowMeOnly: false, answerable: ["tastes-002"] },
      ]);
    });

    it("con la scheda vuota il primo tentativo non pesca e il secondo dà una breve", () => {
      const withSheet = selectQuestion({
        candidates: questions,
        category: "tastes",
        maxLevel: 3,
        knowMeOnly: true,
        used: [],
        answerable: [],
        randomInt: first,
      });
      expect(withSheet.ok).toBe(false);

      const [, fallback] = drawAttempts({ knowMeOnly: true, answerable: [], shortIds });
      const short = selectQuestion({
        candidates: questions,
        category: "tastes",
        maxLevel: 3,
        knowMeOnly: fallback.knowMeOnly,
        used: [],
        answerable: fallback.answerable,
        randomInt: first,
      });
      // Una breve: la giudica l'interrogato, quindi la scheda non serve e la scala resta possibile.
      expect(short.ok && short.question.id).toBe("tastes-001");
      expect(short.ok && short.question.kind).toBe("short");
    });

    it("senza nemmeno una breve si finisce sulla domanda aperta", () => {
      const onlyOpenAndMultiple = questions.filter((question) => question.kind !== "short");
      const [, , last] = drawAttempts({ knowMeOnly: true, answerable: [], shortIds: [] });
      const open = selectQuestion({
        candidates: onlyOpenAndMultiple,
        category: "tastes",
        maxLevel: 3,
        knowMeOnly: last.knowMeOnly,
        used: [],
        answerable: last.answerable,
        randomInt: first,
      });
      expect(open.ok && open.question.kind).toBe("open");
    });
  });
});
