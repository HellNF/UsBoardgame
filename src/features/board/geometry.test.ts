import { describe, expect, it } from "vitest";

import { cellCenter, insideFrame, ladderGeometry, snakeGeometry } from "./geometry";

/**
 * La geometria di scale e serpenti (F6-03) si genera dagli estremi della disposizione: qui si
 * controlla che le forme restino quelle promesse da docs/design.md — montanti e pioli per le
 * scale, corpo a macchie con la coda assottigliata per i serpenti — e che siano deterministiche.
 */

describe("scale: montanti e pioli (F6-03)", () => {
  it("i due montanti sono paralleli e i pioli stanno fra loro", () => {
    const ladder = ladderGeometry(8, 26);
    expect(ladder.rails.split("M").length - 1).toBe(2);
    expect(ladder.rungs.length).toBeGreaterThan(2);
    for (const rung of ladder.rungs) {
      expect(rung.a.x).toBeGreaterThan(rung.b.x);
    }
  });

  it("la scala parte dal bordo della casella di base e arriva a quella di cima", () => {
    const base = cellCenter(8);
    const top = cellCenter(26);
    const ladder = ladderGeometry(8, 26);
    // Il primo piolo è più in alto della base e più in basso della cima.
    const first = ladder.rungs[0];
    expect(first.a.y).toBeLessThan(base.y);
    expect(first.a.y).toBeGreaterThan(top.y);
  });
});

describe("serpenti: corpo a macchie e coda assottigliata (F6-03)", () => {
  const snake = snakeGeometry(62, 18);

  it("il corpo è una curva sola, dalla testa alla coda", () => {
    expect(snake.body.startsWith("M")).toBe(true);
    expect(snake.points.length).toBeGreaterThan(20);
  });

  it("le macchie stanno sul corpo, una sì e una no, e sono orientate", () => {
    expect(snake.spots.length).toBeGreaterThan(4);
    const radius = 30; // l'ampiezza delle onde: una macchia non può allontanarsi più di così
    for (const spot of snake.spots) {
      const nearest = Math.min(
        ...snake.points.map((point) => Math.hypot(point.x - spot.at.x, point.y - spot.at.y)),
      );
      expect(nearest).toBeLessThan(radius);
      expect(Number.isFinite(spot.angle)).toBe(true);
    }
  });

  it("la coda si assottiglia: ogni tratto è più sottile del precedente", () => {
    expect(snake.tail).toHaveLength(4);
    const widths = snake.tail.map((segment) => segment.width);
    expect(widths).toEqual([...widths].sort((a, b) => b - a));
    // L'ultimo tratto è la punta: parte dalla coda del corpo.
    expect(snake.tail[snake.tail.length - 1].to).toEqual(snake.points[snake.points.length - 1]);
  });

  it("stessa coppia di estremi, stessa forma: nessun caso nel disegno", () => {
    expect(snakeGeometry(87, 37)).toEqual(snakeGeometry(87, 37));
  });
});

describe("insideFrame: le pedine di bordo non finiscono sotto la cornice", () => {
  // La cornice copre i primi ~14,5 di una casella di bordo (D-65 per le decorazioni, e la
  // stessa cosa vale per le pedine). Lo scostamento va verso il centro del tabellone, e negli
  // angoli vale sui due assi.
  it("la casella 1 (angolo in basso a sinistra) si scosta a destra e in alto", () => {
    const center = cellCenter(1);
    const moved = insideFrame(1, center, 7);
    expect(moved.x).toBe(center.x + 7);
    expect(moved.y).toBe(center.y - 7);
  });

  it("la casella 100 (angolo in alto a sinistra) si scosta a destra e in basso", () => {
    const center = cellCenter(100);
    const moved = insideFrame(100, center, 7);
    expect(moved.x).toBe(center.x + 7);
    expect(moved.y).toBe(center.y + 7);
  });

  it("una casella di mezzo non si scosta", () => {
    const center = cellCenter(45);
    expect(insideFrame(45, center, 7)).toEqual(center);
  });

  it("una casella di bordo su un asse solo si scosta su quell'asse solo", () => {
    // La 10 è l'ultima della prima riga: bordo destro e bordo basso, quindi è un angolo.
    // La 11 le sta sopra, sul bordo destro e basta.
    const center = cellCenter(11);
    const moved = insideFrame(11, center, 7);
    expect(moved.x).toBe(center.x - 7);
    expect(moved.y).toBe(center.y);
  });
});
