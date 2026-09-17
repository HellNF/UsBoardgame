import { describe, expect, it } from "vitest";
import { challenges } from "./challenges";
import { questions } from "./questions";
import type { QuestionContent } from "./schema";

/**
 * Controlli di forma sui contenuti (task F3-04 e F4-01): i numeri chiesti da docs/content.md.
 * La revisione dei testi resta al proprietario.
 */

const CATEGORIES = ["tastes", "memories", "future", "deep", "funny"] as const;
const byCategory = (category: string) => questions.filter((question) => question.category === category);
const sheetQuestions = (list: QuestionContent[]) =>
  list.filter((question) => question.kind === "multiple" || question.kind === "short");

describe("mazzo di domande (F3-04)", () => {
  it("contiene 150 domande, 30 per categoria", () => {
    expect(questions).toHaveLength(150);
    for (const category of CATEGORIES) {
      expect(byCategory(category)).toHaveLength(30);
    }
  });

  it("ogni categoria ha 8 domande da scheda e 22 aperte", () => {
    for (const category of CATEGORIES) {
      const list = byCategory(category);
      expect(sheetQuestions(list)).toHaveLength(8);
      expect(list.filter((question) => question.kind === "open")).toHaveLength(22);
    }
  });

  it("gli id sono unici e non rinumerati", () => {
    const ids = questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Gli id delle domande già pubblicate non cambiano mai (docs/data-model.md).
    expect(ids).toContain("tastes-001");
    expect(ids).toContain("memories-001");
    expect(ids).toContain("future-001");
    expect(ids).toContain("deep-001");
    expect(ids).toContain("funny-001");
  });

  it("le profonde sono distribuite sui tre livelli", () => {
    for (const level of [1, 2, 3] as const) {
      expect(byCategory("deep").filter((question) => question.level === level).length).toBeGreaterThanOrEqual(
        8,
      );
    }
  });

  it("le domande a scelta multipla hanno da 2 a 6 opzioni distinte", () => {
    for (const question of questions.filter((item) => item.kind === "multiple")) {
      const options = question.options ?? [];
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(options.length).toBeLessThanOrEqual(6);
      expect(new Set(options).size).toBe(options.length);
    }
  });
});

describe("mazzo di sfide (F4-01)", () => {
  it("ha almeno 5 sfide integrate, 10 in videochiamata e 2 esterne", () => {
    expect(challenges.filter((challenge) => challenge.category === "builtin").length).toBeGreaterThanOrEqual(
      5,
    );
    expect(challenges.filter((challenge) => challenge.category === "videocall")).toHaveLength(10);
    expect(challenges.filter((challenge) => challenge.category === "external")).toHaveLength(2);
    expect(challenges.some((challenge) => challenge.category === "emulator")).toBe(false);
  });

  it("copre tris, forza 4, memory, quiz e riflessi", () => {
    const names = challenges.map((challenge) => challenge.id);
    for (const id of ["tic-tac-toe", "connect-four", "memory", "quiz-lampo", "riflessi"]) {
      expect(names).toContain(id);
    }
  });

  it("ha almeno 6 sfide lampo, tutte entro i 30 secondi", () => {
    const flash = challenges.filter((challenge) => challenge.snakeFlash);
    expect(flash.length).toBeGreaterThanOrEqual(6);
    for (const challenge of flash) {
      expect(challenge.durationSeconds.max).toBeLessThanOrEqual(30);
    }
  });

  it("i minigiochi automatici sono quelli che il motore conosce", () => {
    // Id dei moduli registrati in `src/engine/minigames` (pacchetto A). Quando quel branch sarà in `main`
    // questo controllo può leggere direttamente la mappa dei moduli invece di ripetere la lista.
    const known = ["tic-tac-toe", "connect-four", "memory"];
    for (const challenge of challenges.filter((item) => item.verdict === "automatic")) {
      expect(challenge.minigame).toBeDefined();
      expect(known).toContain(challenge.minigame);
    }
    for (const id of known) {
      expect(challenges.some((challenge) => challenge.minigame === id)).toBe(true);
    }
  });

  it("le sfide esterne portano un link", () => {
    for (const challenge of challenges.filter((item) => item.category === "external")) {
      expect(challenge.url).toBeTruthy();
    }
  });

  it("gli id delle sfide sono unici", () => {
    const ids = challenges.map((challenge) => challenge.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
