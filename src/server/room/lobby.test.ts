import { describe, expect, it } from "vitest";

import { bothReady, needsSheets, nextStatus, toggleReady } from "./lobby";

describe("lobby: pronto dei posti e stato della serata (F2-02)", () => {
  it("il pronto di un posto non tocca quello dell'altro", () => {
    expect(toggleReady({}, 1, true)).toEqual({ 1: true });
    expect(toggleReady({ 1: true, 2: true }, 2, false)).toEqual({ 1: true, 2: false });
  });

  it("si parte solo con entrambi pronti", () => {
    expect(bothReady({ 1: true })).toBe(false);
    expect(bothReady({ 1: true, 2: true })).toBe(true);
    expect(nextStatus({ 1: true }, true)).toBe("lobby");
    expect(nextStatus({ 1: true, 2: true }, false)).toBe("playing");
  });

  it("con una scheda incompleta si passa da `sheets` (D-28: si può giocare lo stesso)", () => {
    expect(nextStatus({ 1: true, 2: true }, true)).toBe("sheets");
  });

  it("una scheda è incompleta se mancano risposte alle domande non aperte", () => {
    expect(needsSheets([{ answered: 30, required: 30 }])).toBe(false);
    expect(
      needsSheets([
        { answered: 30, required: 30 },
        { answered: 12, required: 30 },
      ]),
    ).toBe(true);
    // Con poche domande in catalogo (o nessuna) non si blocca nulla.
    expect(needsSheets([{ answered: 0, required: 0 }])).toBe(false);
    expect(needsSheets([])).toBe(false);
  });
});
