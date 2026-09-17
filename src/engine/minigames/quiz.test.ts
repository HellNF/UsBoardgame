import { describe, expect, it } from "vitest";

import { RULES } from "../config";
import { quiz } from "./quiz";
import type { MinigameState, QuizItem, QuizState } from "./types";

/**
 * Quiz-lampo (F4-04, D-55): domande a turno, un punto per risposta giusta, chi ne ha di più vince.
 * Il contenuto è pubblico (non è la scheda): le risposte giuste vivono nello stato senza svelare nulla.
 */

const ITEMS: QuizItem[] = [
  { question: "Quante corde ha una chitarra classica?", options: ["Quattro", "Sei"], correct: 1 },
  { question: "In quale città si trova la Torre Eiffel?", options: ["Parigi", "Lione"], correct: 0 },
  { question: "Qual è il pianeta più vicino al Sole?", options: ["Venere", "Mercurio"], correct: 1 },
];

const CLOCK = { now: new Date("2026-09-17T21:00:00.000Z"), randomInt: () => 0 };

const init = (items: QuizItem[] = ITEMS) =>
  quiz.init({ ...CLOCK, firstSeat: 1, content: items }) as QuizState;

const answer = (state: MinigameState, seat: 1 | 2, option: number) => quiz.applyMove(state, seat, { option }, CLOCK);

/** Gioca una sequenza di risposte, una per posto. */
const play = (state: MinigameState, answers: [1 | 2, number][]): QuizState =>
  answers.reduce<QuizState>((current, [seat, option]) => {
    const result = answer(current, seat, option);
    if (!result.ok) throw new Error(result.error);
    return result.state as QuizState;
  }, state as QuizState);

describe("quiz-lampo", () => {
  it("parte dalle domande della carta, tocca al primo posto e i punti partono da zero", () => {
    const state = init();
    expect(state.items).toHaveLength(3);
    expect(state.turn).toBe(1);
    expect(state.scores).toEqual({ 1: 0, 2: 0 });
    expect(state.winner).toBeNull();
  });

  it("senza domande non parte: la carta deve portarle", () => {
    expect(() => quiz.init({ ...CLOCK, firstSeat: 1, content: [] })).toThrow(/quiz/);
    expect(() => quiz.init({ ...CLOCK, firstSeat: 1 })).toThrow(/quiz/);
  });

  it("usa al massimo le domande dei RULES", () => {
    const many = Array.from({ length: RULES.minigames.quiz.items + 3 }, (_, index) => ({
      question: `Domanda numero ${index}`,
      options: ["Sì", "No"],
      correct: 0,
    }));
    expect(init(many).items).toHaveLength(RULES.minigames.quiz.items);
  });

  it("risposta giusta = un punto, e il turno passa all'altro", () => {
    const first = play(init(), [[1, 1]]);
    expect(first.scores).toEqual({ 1: 1, 2: 0 });
    expect(first.turn).toBe(2);
    expect(first.index).toBe(1);

    const second = play(first, [[2, 1]]);
    expect(second.scores).toEqual({ 1: 1, 2: 0 });
    expect(second.turn).toBe(1);
  });

  it("risposta sbagliata: nessun punto, il turno passa lo stesso", () => {
    const state = play(init(), [[1, 0]]);
    expect(state.scores).toEqual({ 1: 0, 2: 0 });
    expect(state.turn).toBe(2);
  });

  it("vince chi ha più punti alla fine delle domande", () => {
    // Le domande si alternano 1, 2, 1: il posto 1 azzecca le sue due, il posto 2 sbaglia.
    const state = play(init(), [
      [1, 1],
      [2, 1],
      [1, 1],
    ]);
    expect(state.scores).toEqual({ 1: 2, 2: 0 });
    expect(quiz.result(state)).toBe(1);
  });

  it("con gli stessi punti è pareggio: si rigioca", () => {
    const state = play(init(), [
      [1, 1],
      [2, 0],
      [1, 0],
    ]);
    expect(state.scores).toEqual({ 1: 1, 2: 1 });
    expect(quiz.result(state)).toBe("draw");
  });

  it("rifiuta la mossa dell'altro posto, l'opzione fuori posto e la partita già finita", () => {
    const first = init();
    expect(answer(first, 2, 0)).toEqual({ ok: false, error: "Non tocca a te nel quiz." });
    expect(answer(first, 1, 9)).toMatchObject({ ok: false });
    expect(answer(first, 1, -1)).toMatchObject({ ok: false });
    expect(answer(first, 1, 1.5)).toMatchObject({ ok: false });

    const finished = play(init(), [
      [1, 1],
      [2, 0],
      [1, 0],
    ]);
    expect(answer(finished, 2, 1)).toEqual({ ok: false, error: "Il quiz è già finito." });
  });
});
