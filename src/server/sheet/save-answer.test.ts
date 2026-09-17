import { describe, expect, it } from "vitest";

import { checkSheetAnswer } from "./save-answer";

describe("risposta della scheda (F3-02)", () => {
  const multiple = { id: "tastes-002", kind: "multiple" as const, options: ["Cinema", "Cena fuori"] };

  it("accetta una risposta breve, anche lunga", () => {
    expect(checkSheetAnswer({ id: "tastes-001", kind: "short", options: null }, "Risotto ai funghi")).toEqual(
      {
        ok: true,
      },
    );
  });

  it("accetta solo una delle opzioni per le domande a scelta multipla", () => {
    expect(checkSheetAnswer(multiple, "Cinema")).toEqual({ ok: true });
    expect(checkSheetAnswer(multiple, "cinema").ok).toBe(false);
    expect(checkSheetAnswer(multiple, "Teatro").ok).toBe(false);
  });

  it("rifiuta le domande aperte: non stanno in scheda", () => {
    expect(checkSheetAnswer({ id: "tastes-003", kind: "open", options: null }, "qualsiasi cosa").ok).toBe(
      false,
    );
  });

  it("rifiuta una risposta vuota e una domanda inesistente", () => {
    expect(checkSheetAnswer({ id: "tastes-001", kind: "short", options: null }, "   ").ok).toBe(false);
    const missing = checkSheetAnswer(null, "Cinema");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toMatch(/inesistente/);
  });
});
