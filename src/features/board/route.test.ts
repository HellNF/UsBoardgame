import { describe, expect, it } from "vitest";

import { classic } from "@/content/boards/classic";
import { cellsBetween, pawnRouteFor, routeDuration } from "./route";

/**
 * Percorso della pedina (F2-05): cella per cella sui movimenti normali, gradino per gradino
 * sulle scale, lungo il corpo sui serpenti. La durata serve a chi accoda gli eventi.
 */

describe("percorso della pedina", () => {
  it("si ferma dov'è quando non c'è nessun movimento", () => {
    const route = pawnRouteFor(classic, 12, 12);
    expect(route.points).toHaveLength(1);
    expect(route.duration).toBe(0);
  });

  it("attraversa una casella per volta, avanti e indietro", () => {
    expect(cellsBetween(4, 8)).toEqual([5, 6, 7, 8]);
    expect(cellsBetween(8, 4)).toEqual([7, 6, 5, 4]);
    expect(cellsBetween(7, 7)).toEqual([]);
  });

  it("un tiro normale fa un saltello per ogni casella attraversata", () => {
    const route = pawnRouteFor(classic, 4, 8);
    // Quattro caselle: due punti per ognuna (culmine e atterraggio).
    expect(route.points).toHaveLength(8);
    expect(route.to).toBe(8);
    expect(route.duration).toBeGreaterThan(0);
    // L'ultimo punto è il centro della casella d'arrivo.
    expect(route.points.at(-1)).toEqual(pawnRouteFor(classic, 8, 8).points[0]);
  });

  it("un percorso più lungo dura di più", () => {
    const short = routeDuration(classic, 4, 5);
    const long = routeDuration(classic, 4, 12);
    expect(long).toBeGreaterThan(short);
  });

  it("sulla scala sale gradino per gradino", () => {
    const ladder = classic.ladders[0];
    const route = pawnRouteFor(classic, ladder.from, ladder.to);
    const rows = Math.abs(route.points.length);
    expect(rows).toBeGreaterThan(1);
    // Un punto per ogni fila percorsa: l'ultimo è la cima.
    expect(route.points.at(-1)).toEqual(pawnRouteFor(classic, ladder.to, ladder.to).points[0]);
    expect(route.duration).toBeGreaterThanOrEqual(0.22);
  });

  it("sul serpente scende seguendo il corpo, non in linea retta", () => {
    const snake = classic.snakes[0];
    const route = pawnRouteFor(classic, snake.from, snake.to);
    expect(route.points.length).toBeGreaterThan(2);
    expect(route.points.at(-1)).toEqual(pawnRouteFor(classic, snake.to, snake.to).points[0]);
    expect(route.duration).toBeGreaterThan(0.5);
  });

  it("un movimento che non è né scala né serpente resta un salto normale", () => {
    // 11 → 13 non è né una scala né un serpente nella disposizione approvata.
    const route = pawnRouteFor(classic, 11, 13);
    expect(route.points).toHaveLength(4);
  });
});
