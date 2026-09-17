import { otherSeat, type Seat } from "../types";
import type { MemoryState, MinigameModule, MinigameInitInput, MinigameState } from "./types";

/**
 * Memory: 12 carte (6 coppie) coperte. Si scoprono due carte per volta: se
 * combaciano il giocatore continua, altrimenti tocca all'altro (le due carte
 * restano scoperte finché l'altro non muove, così la UI fa in tempo a mostrarle).
 */

export const CARDS = 12;

const shuffle = (cards: number[], randomInt: (max: number) => number): number[] => {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const ensure = (state: MinigameState): MemoryState => {
  if (state.kind !== "memory") throw new Error("Stato di gioco non adatto al memory.");
  return state;
};

const finishIfDone = (state: MemoryState): MemoryState => {
  if (!state.matched.every(Boolean)) return state;
  const [one, two] = [state.pairs[1], state.pairs[2]];
  const winner: Seat | "draw" = one === two ? "draw" : one > two ? 1 : 2;
  return { ...state, winner };
};

export const memory: MinigameModule = {
  id: "memory",

  init: ({ randomInt, firstSeat }: MinigameInitInput) => {
    const values = Array.from({ length: CARDS / 2 }, (_, index) => index);
    const cards = shuffle([...values, ...values], randomInt);
    return {
      kind: "memory",
      cards,
      revealed: [],
      matched: Array<boolean>(CARDS).fill(false),
      pairs: { 1: 0, 2: 0 },
      turn: firstSeat,
      winner: null,
    };
  },

  applyMove: (rawState, seat, move) => {
    const state = ensure(rawState);
    if (state.winner !== null) return { ok: false, error: "Il memory è già finito." };
    if (state.turn !== seat) return { ok: false, error: "Non tocca a te nel memory." };
    const index =
      typeof move === "object" && move !== null && "index" in move
        ? (move as { index: unknown }).index
        : undefined;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= CARDS) {
      return { ok: false, error: `Mossa del memory non valida: serve \`index\` da 0 a ${CARDS - 1}.` };
    }
    // Le due carte del turno precedente spariscono quando l'altro muove.
    let current: MemoryState = state.revealed.length === 2 ? { ...state, revealed: [] } : state;
    if (current.matched[index]) return { ok: false, error: "Carta del memory già abbinata." };
    if (current.revealed.includes(index)) return { ok: false, error: "Carta del memory già scoperta." };

    const revealed = [...current.revealed, index];
    if (revealed.length < 2) {
      return { ok: true, state: { ...current, revealed } };
    }

    const [first, second] = revealed;
    if (current.cards[first] === current.cards[second]) {
      const matched = [...current.matched];
      matched[first] = true;
      matched[second] = true;
      const pairs = { ...current.pairs, [seat]: current.pairs[seat] + 1 };
      current = finishIfDone({ ...current, revealed: [], matched, pairs });
      return { ok: true, state: current };
    }
    current = { ...current, revealed, turn: otherSeat(seat) };
    return { ok: true, state: current };
  },

  result: (state) => ensure(state).winner,

  turn: (state) => ensure(state).turn,
};
