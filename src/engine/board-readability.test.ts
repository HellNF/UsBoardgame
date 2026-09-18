import { describe, expect, it } from "vitest";

import {
  READABILITY_BUDGET,
  addLine,
  describeBudget,
  fitsBudget,
  measureReadability,
  readabilityState,
} from "@/engine/board-readability";
import { elementFootprints } from "@/engine/board-geometry";
import type { BoardLayout, Ladder } from "@/engine/types";

/**
 * Il budget di leggibilità (F7-02, pacchetto I).
 *
 * Il conto è quello che il generatore applica mentre piazza: quante caselle hanno più di una linea
 * sopra, e quante linee al massimo passano sulla stessa casella. Qui si prova la misura in piccolo
 * (un elemento, due elementi sovrapposti, un rifiuto); il comportamento del generatore sta in
 * `board-generator.test.ts`.
 */

const empty: Pick<BoardLayout, "ladders" | "snakes"> = { ladders: [], snakes: [] };

describe("measureReadability: il conto delle linee", () => {
  it("un tabellone senza scale e serpenti non ha incroci", () => {
    const measure = measureReadability(empty);
    expect(measure.crossings).toBe(0);
    expect(measure.linesPerCell).toBe(0);
    expect(measure.linesByCell.size).toBe(0);
  });

  it("una scala sola: nessun incrocio, una linea sulle sue caselle", () => {
    const ladder: Ladder = { from: 2, to: 22 };
    const measure = measureReadability({ ladders: [ladder], snakes: [] });
    const cells = elementFootprints({ ladders: [ladder], snakes: [] })[0].cells;
    expect(cells.size).toBeGreaterThan(1);
    expect(measure.crossings).toBe(0);
    expect(measure.linesPerCell).toBe(1);
    for (const cell of cells) expect(measure.linesByCell.get(cell)).toBe(1);
    // Gli estremi sono fra le caselle contate: la linea appoggia sulle due caselle.
    expect(measure.linesByCell.has(2)).toBe(true);
    expect(measure.linesByCell.has(22)).toBe(true);
  });

  it("due volte la stessa scala: ogni sua casella ha due linee, tutti gli incroci", () => {
    const ladder: Ladder = { from: 2, to: 22 };
    const footprint = elementFootprints({ ladders: [ladder], snakes: [] })[0].cells;
    const measure = measureReadability({ ladders: [ladder, ladder], snakes: [] });
    expect(measure.linesPerCell).toBe(2);
    expect(measure.crossings).toBe(footprint.size);
  });

  it("il tetto dice se il conto ci sta", () => {
    const measure = measureReadability({ ladders: [{ from: 2, to: 22 }], snakes: [] });
    expect(fitsBudget(measure, READABILITY_BUDGET)).toBe(true);
    expect(fitsBudget(measure, { crossings: 0, linesPerCell: 0 })).toBe(false);
  });

  it("il budget si legge in una riga", () => {
    expect(describeBudget({ crossings: 6, linesPerCell: 2 })).toBe("6 incroci, 2 linee per casella");
  });
});

describe("addLine: si aggiunge una linea alla volta, senza superare il tetto", () => {
  it("aggiunge una linea libera e lascia il conto aggiornato", () => {
    const state = readabilityState();
    expect(addLine(state, [5, 6, 7], { crossings: 1, linesPerCell: 2 })).toBe(true);
    expect(state.linesByCell.get(5)).toBe(1);
    expect(state.crossings).toBe(0);
    expect(state.linesPerCell).toBe(1);
  });

  it("rifiuta la linea che porterebbe una casella oltre le due linee", () => {
    const state = readabilityState();
    addLine(state, [5], { crossings: 2, linesPerCell: 2 });
    addLine(state, [5], { crossings: 2, linesPerCell: 2 });
    expect(addLine(state, [5], { crossings: 2, linesPerCell: 2 })).toBe(false);
    expect(state.linesByCell.get(5)).toBe(2);
    expect(state.linesPerCell).toBe(2);
  });

  it("rifiuta la linea che aggiungerebbe un incrocio di troppo", () => {
    const state = readabilityState();
    addLine(state, [5], { crossings: 0, linesPerCell: 2 });
    expect(addLine(state, [5], { crossings: 0, linesPerCell: 2 })).toBe(false);
    // Rifiutata: il conto non si è mosso di un passo.
    expect(state.linesByCell.get(5)).toBe(1);
    expect(state.crossings).toBe(0);
  });
});
