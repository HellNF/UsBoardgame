import { describe, expect, it } from "vitest";

import { joinSchema, screenFor } from "./join";

describe("accesso alla stanza: corpo della richiesta (F0-04)", () => {
  it("normalizza il codice: spazi via e maiuscolo", () => {
    const parsed = joinSchema.parse({ code: "  coppia42 ", password: "prova-locale", seat: 2 });
    expect(parsed).toEqual({ code: "COPPIA42", password: "prova-locale", seat: 2 });
  });

  it("rifiuta un codice fuori formato senza dire perché nel dettaglio", () => {
    for (const code of ["abc", "troppo-lungo-per-la-stanza", "con spazi", "coppia!"]) {
      expect(joinSchema.safeParse({ code, password: "prova-locale", seat: 1 }).success).toBe(false);
    }
  });

  it("pretende la password e un posto 1 o 2", () => {
    expect(joinSchema.safeParse({ code: "COPPIA42", password: "", seat: 1 }).success).toBe(false);
    expect(joinSchema.safeParse({ code: "COPPIA42", password: "x", seat: 3 }).success).toBe(false);
    expect(joinSchema.safeParse({ code: "COPPIA42", password: "x" }).success).toBe(false);
  });
});

describe("schermata da aprire secondo la fase della serata (F0-04)", () => {
  it("porta nella schermata giusta", () => {
    expect(screenFor(null)).toBe("lobby");
    expect(screenFor("lobby")).toBe("lobby");
    expect(screenFor("sheets")).toBe("sheet");
    expect(screenFor("playing")).toBe("game");
    // Serata conclusa: la schermata finale, non il diario (D-64).
    expect(screenFor("finished")).toBe("game");
    expect(screenFor("abandoned")).toBe("lobby");
  });
});
