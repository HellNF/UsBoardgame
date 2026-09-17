import { describe, expect, it } from "vitest";
import { ticTacToe } from "./tic-tac-toe";
import type { MinigameState, TicTacToeState } from "./types";

/**
 * Tris (docs/rules.md § Sfide, D-26): modulo puro con `init`, `applyMove`, `result`.
 */

const init = () => ticTacToe.init({ randomInt: () => 0, firstSeat: 1 }) as TicTacToeState;

const move = (state: MinigameState, seat: 1 | 2, cell: unknown) => ticTacToe.applyMove(state, seat, { cell });

const play = (state: MinigameState, moves: [1 | 2, number][]) =>
  moves.reduce((current, [seat, cell]) => {
    const result = move(current, seat, cell);
    if (!result.ok) throw new Error(result.error);
    return result.state;
  }, state);

describe("tris", () => {
  it("parte vuoto e muove chi ha pescato la carta", () => {
    const state = init();
    expect(state.board).toEqual(Array(9).fill(null));
    expect(ticTacToe.turn(state)).toBe(1);
    expect(ticTacToe.result(state)).toBeNull();
  });

  it("alterna i turni", () => {
    const state = play(init(), [
      [1, 0],
      [2, 4],
    ]);
    expect(ticTacToe.turn(state)).toBe(1);
  });

  it("rifiuta la mossa dell'altro giocatore", () => {
    const result = move(init(), 2, 0);
    expect(result).toEqual({ ok: false, error: "Non tocca a te nel tris." });
  });

  it("rifiuta una casella già occupata", () => {
    const state = play(init(), [
      [1, 0],
      [2, 1],
    ]);
    expect(move(state, 1, 1)).toEqual({ ok: false, error: "Casella del tris già occupata." });
  });

  it("rifiuta una mossa fuori dal tabellone", () => {
    expect(move(init(), 1, 9)).toMatchObject({ ok: false });
    expect(move(init(), 1, "a")).toMatchObject({ ok: false });
  });

  it("chiude in parità quando il tabellone è pieno senza tris", () => {
    const state = play(init(), [
      [1, 0],
      [2, 1],
      [1, 2],
      [2, 4],
      [1, 3],
      [2, 5],
      [1, 7],
      [2, 6],
      [1, 8],
    ]);
    expect(ticTacToe.result(state)).toBe("draw");
    expect(move(state, 2, 0)).toEqual({ ok: false, error: "Il tris è già finito." });
  });

  it("vince chi fa tre in fila", () => {
    const state = play(init(), [
      [1, 0],
      [2, 3],
      [1, 1],
      [2, 4],
      [1, 2],
    ]);
    expect(ticTacToe.result(state)).toBe(1);
  });

  it("rifiuta gli stati di un altro minigioco", () => {
    const other = { kind: "memory" } as unknown as MinigameState;
    expect(() => ticTacToe.turn(other)).toThrow("Stato di gioco non adatto al tris.");
  });
});
