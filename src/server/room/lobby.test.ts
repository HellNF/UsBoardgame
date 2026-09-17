import { describe, expect, it } from "vitest";

import { bothReady, needsSheets, nextStatus, readyOutcome, toggleReady } from "./lobby";

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

describe("lobby: il pronto applicato alla riga letta adesso (F2-02, D-53)", () => {
  it("il primo pronto non fa partire la serata, il secondo sì", () => {
    const first = readyOutcome({}, 1, true, false);
    expect(first.ready).toEqual({ 1: true });
    expect(first.starts).toBe(false);
    expect(first.status).toBe("lobby");

    // Secondo clic quasi simultaneo: legge la riga già aggiornata dal primo.
    const second = readyOutcome(first.ready, 2, true, false);
    expect(second.ready).toEqual({ 1: true, 2: true });
    expect(second.starts).toBe(true);
    expect(second.status).toBe("playing");
  });

  it("vale in entrambi gli ordini: parte chi arriva per secondo", () => {
    const first = readyOutcome({}, 2, true, false);
    expect(first.starts).toBe(false);
    const second = readyOutcome(first.ready, 1, true, false);
    expect(second.starts).toBe(true);
    expect(second.status).toBe("playing");
  });

  it("con una scheda incompleta il secondo pronto porta a `sheets`, non a `playing`", () => {
    const first = readyOutcome({}, 1, true, true);
    const second = readyOutcome(first.ready, 2, true, true);
    expect(second.starts).toBe(true);
    expect(second.status).toBe("sheets");
  });

  it("chi si dichiara non pronto non fa partire nulla, anche se l'altro è pronto", () => {
    const out = readyOutcome({ 1: true, 2: true }, 2, false, false);
    expect(out.ready).toEqual({ 1: true, 2: false });
    expect(out.starts).toBe(false);
    expect(out.status).toBe("lobby");
  });

  it("il pronto dello stesso posto due volte non raddoppia niente", () => {
    const first = readyOutcome({}, 1, true, false);
    const again = readyOutcome(first.ready, 1, true, false);
    expect(again.ready).toEqual({ 1: true });
    expect(again.starts).toBe(false);
  });
});
