import { describe, expect, it } from "vitest";

import { boards } from "@/content/boards";
import { QUESTION_CATEGORIES, type QuestionCategory } from "@/engine";
import { ILLUSTRATIONS, illustrationFor, illustrationGroups } from "./index";

/**
 * Il registro delle illustrazioni (F6-02) e la disposizione devono restare d'accordo: un id
 * scritto in `src/content/boards` che non esiste nel registro lascia la casella senza disegno,
 * e non è un errore visibile (il tabellone ripiega sul numero).
 */

/** Le illustrazioni usate dal tabellone, con la categoria della casella che le usa. */
const usedInBoards = (): { id: string; category: QuestionCategory | null; kind: string }[] =>
  boards.flatMap((board) =>
    board.cells.flatMap<{ id: string; category: QuestionCategory | null; kind: string }>((cell) => {
      if (cell.kind === "question")
        return [{ id: cell.illustration, category: cell.category, kind: cell.kind }];
      if (cell.kind === "star") return [{ id: cell.illustration, category: null, kind: cell.kind }];
      return [];
    }),
  );

describe("illustrazioni: il registro e il tabellone", () => {
  it("ogni illustrazione usata dalla disposizione esiste nel registro", () => {
    const missing = usedInBoards()
      .filter((used) => illustrationFor(used.id) === null)
      .map((used) => used.id);
    expect(missing).toEqual([]);
  });

  it("ogni voce del registro è un componente", () => {
    const broken = Object.entries(ILLUSTRATIONS)
      .filter(([, component]) => typeof component !== "function")
      .map(([id]) => id);
    expect(broken).toEqual([]);
  });

  it("gli id sono in kebab-case e cominciano dalla categoria", () => {
    for (const id of Object.keys(ILLUSTRATIONS)) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)+$/);
    }
    const questionIds = Object.keys(ILLUSTRATIONS).filter((id) => !id.startsWith("stars-"));
    for (const id of questionIds) {
      const prefix = id.split("-")[0];
      expect([...QUESTION_CATEGORIES, "stars"]).toContain(prefix);
    }
  });

  it("un id sconosciuto non fa esplodere niente: `illustrationFor` ritorna null", () => {
    expect(illustrationFor("tastes-bicicletta")).toBe(null);
    expect(illustrationFor("")).toBe(null);
  });
});

describe("illustrazioni: quante e per chi (F6-02)", () => {
  it("il tabellone usa 35 illustrazioni di domanda e 3 stelle, una per casella", () => {
    const used = usedInBoards();
    const questions = used.filter((entry) => entry.kind === "question");
    const stars = used.filter((entry) => entry.kind === "star");
    expect(questions).toHaveLength(35);
    expect(stars).toHaveLength(3);
    // Una casella domanda, un disegno: nessuna ripetizione (e 35 disegni diversi in tutto).
    expect(new Set(questions.map((entry) => entry.id)).size).toBe(35);
    expect(new Set(used.map((entry) => entry.id)).size).toBe(38);
  });

  it("ogni categoria ha le sue illustrazioni (almeno tre)", () => {
    const counts = new Map<string, number>();
    for (const id of Object.keys(ILLUSTRATIONS)) {
      if (id.startsWith("stars-")) continue;
      const prefix = id.split("-")[0];
      counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
    }
    for (const category of QUESTION_CATEGORIES) {
      expect(counts.get(category) ?? 0).toBeGreaterThanOrEqual(3);
    }
    // Le stelle sono tre, come le caselle stella.
    expect(Object.keys(ILLUSTRATIONS).filter((id) => id.startsWith("stars-"))).toHaveLength(3);
  });

  it("l'illustrazione di una casella è della categoria della casella", () => {
    for (const used of usedInBoards()) {
      if (used.kind !== "question" || used.category === null) continue;
      expect(used.id.startsWith(`${used.category}-`)).toBe(true);
    }
  });

  it("`illustrationGroups` raccoglie tutto, senza perdere nessun id", () => {
    const groups = illustrationGroups();
    const collected = groups.flatMap((group) => group.ids);
    expect(collected).toHaveLength(Object.keys(ILLUSTRATIONS).length);
    expect(new Set(collected).size).toBe(collected.length);
    expect(groups.map((group) => group.prefix)).toContain("stars");
  });
});
