import { describe, expect, it } from "vitest";
import { CARDS, memory } from "./memory";
import type { MemoryState, MinigameState } from "./types";

/**
 * Memory (docs/rules.md § Sfide, D-26): 12 carte, 6 coppie, chi sbaglia passa la mano.
 */

const init = (randomInt: (max: number) => number = () => 0) =>
  memory.init({ randomInt, firstSeat: 1 }) as MemoryState;

const move = (state: MinigameState, seat: 1 | 2, index: unknown) => memory.applyMove(state, seat, { index });

const apply = (state: MinigameState, seat: 1 | 2, index: number) => {
  const result = move(state, seat, index);
  if (!result.ok) throw new Error(result.error);
  return result.state as MemoryState;
};

/** Indici delle due carte che formano una coppia. */
const pairOf = (state: MemoryState, value: number) =>
  state.cards.flatMap((card, index) => (card === value ? [index] : []));

describe("memory", () => {
  it("parte con 12 carte coperte, sei coppie e nessun abbinamento", () => {
    const state = init();
    expect(state.cards).toHaveLength(CARDS);
    expect(state.matched.every((flag) => flag === false)).toBe(true);
    expect(state.revealed).toEqual([]);
    expect(state.pairs).toEqual({ 1: 0, 2: 0 });
    const values = [...new Set(state.cards)];
    expect(values).toHaveLength(CARDS / 2);
    for (const value of values) expect(pairOf(state, value)).toHaveLength(2);
  });

  it("con un RNG a zero le carte si mescolano in modo deterministico", () => {
    const one = init();
    const two = init();
    expect(one.cards).toEqual(two.cards);
  });

  it("scopre una carta per volta", () => {
    const state = apply(init(), 1, 0);
    expect(state.revealed).toEqual([0]);
    expect(memory.turn(state)).toBe(1);
  });

  it("due carte diverse: tocca all'altro", () => {
    const state = init();
    const entries = state.cards.map((card, index) => ({ card, index }));
    const different = entries.find((entry) => entry.card !== entries[0].card)!.index;
    const after = apply(apply(state, 1, entries[0].index), 1, different);
    expect(after.turn).toBe(2);
    expect(memory.result(after)).toBeNull();
  });

  it("due carte uguali: abbinamento e si continua", () => {
    const state = init();
    const [a, b] = pairOf(state, state.cards[0]);
    const after = apply(apply(state, 1, a), 1, b);
    expect(after.matched[a]).toBe(true);
    expect(after.matched[b]).toBe(true);
    expect(after.pairs[1]).toBe(1);
    expect(after.revealed).toEqual([]);
    expect(memory.turn(after)).toBe(1);
  });

  it("le carte del turno precedente spariscono quando muove l'altro", () => {
    const state = init();
    const different = state.cards.findIndex((card) => card !== state.cards[0]);
    const after = apply(apply(state, 1, 0), 1, different);
    expect(after.revealed).toHaveLength(2);
    const next = apply(after, 2, 5);
    expect(next.revealed).toEqual([5]);
  });

  it("rifiuta la mossa dell'altro giocatore e le carte già usate", () => {
    const state = init();
    expect(move(state, 2, 0)).toEqual({ ok: false, error: "Non tocca a te nel memory." });
    const [a, b] = pairOf(state, state.cards[0]);
    const after = apply(apply(state, 1, a), 1, b);
    expect(move(after, 1, a)).toEqual({ ok: false, error: "Carta del memory già abbinata." });
    const revealed = apply(init(), 1, 0);
    expect(move(revealed, 1, 0)).toEqual({ ok: false, error: "Carta del memory già scoperta." });
  });

  it("rifiuta indici fuori dal mazzo", () => {
    expect(move(init(), 1, CARDS)).toEqual({
      ok: false,
      error: `Mossa del memory non valida: serve \`index\` da 0 a ${CARDS - 1}.`,
    });
  });

  it("finisce quando tutte le carte sono abbinate e vince chi ha più coppie", () => {
    // Stato quasi finito: manca una coppia, che prende il posto 1 (4 coppie contro 2).
    const start = init();
    const last = [...new Set(start.cards)].length - 1;
    const [a, b] = pairOf(start, last);
    let state: MemoryState = {
      ...start,
      matched: start.matched.map((_, index) => index !== a && index !== b),
      pairs: { 1: 3, 2: 2 },
    };
    state = apply(state, 1, a);
    expect(memory.result(state)).toBeNull();
    state = apply(state, 1, b);
    expect(state.matched.every(Boolean)).toBe(true);
    expect(state.pairs).toEqual({ 1: 4, 2: 2 });
    expect(memory.result(state)).toBe(1);
    expect(move(state, 1, 0)).toEqual({ ok: false, error: "Il memory è già finito." });
  });
});
