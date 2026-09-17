import { describe, expect, it } from "vitest";

import { RULES } from "../config";
import { reflex } from "./reflex";
import type { MinigameState, ReflexState } from "./types";

/**
 * Riflessi (F4-04, D-55): un segnale parte a sorpresa, il primo che lo tocca prende il punto;
 * si gioca al meglio di cinque e chi tocca prima del segnale regala il punto all'altro.
 */

const START = new Date("2026-09-17T21:00:00.000Z");

/** Orologio finto: si sposta a mano per far arrivare (o non arrivare) il segnale. */
function clock(start = START) {
  let now = start;
  return {
    now: () => now,
    /** Avanza il tempo e ritorna l'orologio del server nella forma dei moduli. */
    advance(ms: number) {
      now = new Date(now.getTime() + ms);
      return { now, randomInt: () => 0 };
    },
    at: () => ({ now, randomInt: () => 0 }),
  };
}

const init = (c = clock()) => reflex.init({ ...c.at(), firstSeat: 1, randomInt: () => 0 }) as ReflexState;

/** Porta il tempo oltre il segnale e tocca: il modo normale di prendere il punto. */
const pressAfterSignal = (state: MinigameState, c: ReturnType<typeof clock>, seat: 1 | 2) => {
  const after = Date.parse((state as ReflexState).goAt) + 50 - c.at().now.getTime();
  const result = reflex.applyMove(state, seat, { press: true }, c.advance(after));
  if (!result.ok) throw new Error(result.error);
  return result.state as ReflexState;
};

describe("riflessi", () => {
  it("il segnale arriva dentro la finestra dei RULES", () => {
    const c = clock();
    const state = init(c);
    const delay = Date.parse(state.goAt) - START.getTime();
    expect(delay).toBeGreaterThanOrEqual(RULES.minigames.reflex.minDelayMs);
    expect(delay).toBeLessThan(RULES.minigames.reflex.maxDelayMs);
    expect(state.scores).toEqual({ 1: 0, 2: 0 });
    expect(state.round).toBe(1);
    expect(state.winner).toBeNull();
  });

  it("possono toccare tutti e due: non c'è un turno", () => {
    const state = init();
    expect(reflex.turn(state)).toBe("both");
  });

  it("chi tocca dopo il segnale prende il punto, e si passa al round dopo", () => {
    const c = clock();
    const state = pressAfterSignal(init(c), c, 1);
    expect(state.scores).toEqual({ 1: 1, 2: 0 });
    expect(state.round).toBe(2);
    expect(state.pressed).toEqual([]);
    expect(state.lastRound).toEqual({ winner: 1, falseStart: false });
  });

  it("chi tocca prima del segnale regala il punto all'altro", () => {
    const c = clock();
    const state = init(c);
    const result = reflex.applyMove(state, 2, { press: true }, c.at());
    if (!result.ok) throw new Error(result.error);
    expect((result.state as ReflexState).scores).toEqual({ 1: 1, 2: 0 });
    expect((result.state as ReflexState).lastRound).toEqual({ winner: 1, falseStart: true });
  });

  it("al meglio di cinque: vince chi arriva a tre punti", () => {
    const c = clock();
    let state: MinigameState = init(c);
    for (let round = 0; round < 3; round++) state = pressAfterSignal(state, c, 1);
    expect(reflex.result(state)).toBe(1);
    expect((state as ReflexState).scores).toEqual({ 1: 3, 2: 0 });
    // A partita finita non si tocca più.
    expect(reflex.applyMove(state, 2, { press: true }, c.advance(1000))).toMatchObject({ ok: false });
  });

  it("si alternano i punti: 3 a 2 è ancora una partita", () => {
    const c = clock();
    let state: MinigameState = init(c);
    state = pressAfterSignal(state, c, 1);
    state = pressAfterSignal(state, c, 2);
    state = pressAfterSignal(state, c, 1);
    state = pressAfterSignal(state, c, 2);
    expect(reflex.result(state)).toBeNull();
    expect((state as ReflexState).scores).toEqual({ 1: 2, 2: 2 });
    state = pressAfterSignal(state, c, 1);
    expect(reflex.result(state)).toBe(1);
  });

  it("rifiuta le mosse non valide e la doppia pressione nello stesso round", () => {
    const c = clock();
    const state = init(c);
    expect(reflex.applyMove(state, 1, { tap: true }, c.at())).toMatchObject({ ok: false });
    expect(reflex.applyMove(state, 1, null, c.at())).toMatchObject({ ok: false });

    // Partenza falsa: il round si chiude e ne comincia uno nuovo, senza chi ha già toccato.
    const early = reflex.applyMove(state, 1, { press: true }, c.at());
    if (!early.ok) throw new Error(early.error);
    expect((early.state as ReflexState).lastRound).toEqual({ winner: 2, falseStart: true });
    expect((early.state as ReflexState).pressed).toEqual([]);

    // La guardia copre il round in cui il posto ha già toccato (l'ultimo, quando il gioco è finito).
    const pressed = { ...state, pressed: [1] as (1 | 2)[] };
    expect(reflex.applyMove(pressed, 1, { press: true }, c.at())).toEqual({
      ok: false,
      error: "Hai già toccato in questo round.",
    });
  });
});
