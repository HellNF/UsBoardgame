import { describe, expect, it } from "vitest";
import { COLUMNS, connectFour } from "./connect-four";
import type { ConnectFourState, MinigameState } from "./types";

/**
 * Forza 4 (docs/rules.md § Sfide, D-26): la pedina cade sul fondo della colonna.
 */

/** Orologio finto: i moduli non leggono mai il tempo da soli. */
const CLOCK = { now: new Date("2026-09-17T21:00:00.000Z"), randomInt: () => 0 };

const init = () => connectFour.init({ ...CLOCK, firstSeat: 1 }) as ConnectFourState;

const move = (state: MinigameState, seat: 1 | 2, column: unknown) =>
  connectFour.applyMove(state, seat, { column }, CLOCK);

const play = (state: ConnectFourState, moves: [1 | 2, number][]): ConnectFourState =>
  moves.reduce((current, [seat, column]) => {
    const result = move(current, seat, column);
    if (!result.ok) throw new Error(result.error);
    return result.state as ConnectFourState;
  }, state);

describe("forza 4", () => {
  it("parte vuoto con 7 colonne e 6 righe", () => {
    const state = init();
    expect(state.board).toHaveLength(6);
    expect(state.board[0]).toHaveLength(COLUMNS);
    expect(state.board.flat().every((cell) => cell === null)).toBe(true);
    expect(connectFour.turn(state)).toBe(1);
  });

  it("la pedina cade sul fondo della colonna", () => {
    const state = play(init(), [
      [1, 3],
      [2, 3],
    ]);
    expect(state.board[0][3]).toBe(1);
    expect(state.board[1][3]).toBe(2);
    expect(state.board[2][3]).toBeNull();
  });

  it("rifiuta colonne fuori dal tabellone", () => {
    expect(move(init(), 1, 7)).toEqual({
      ok: false,
      error: "Mossa di forza 4 non valida: serve `column` da 0 a 6.",
    });
    expect(move(init(), 1, -1)).toMatchObject({ ok: false });
  });

  it("rifiuta la mossa dell'altro giocatore", () => {
    expect(move(init(), 2, 0)).toEqual({ ok: false, error: "Non tocca a te in forza 4." });
  });

  it("rifiuta una colonna piena", () => {
    const state = play(init(), [
      [1, 0],
      [2, 0],
      [1, 0],
      [2, 0],
      [1, 0],
      [2, 0],
    ]);
    expect(connectFour.result(state)).toBeNull();
    expect(move(state, 1, 0)).toEqual({ ok: false, error: "Colonna di forza 4 piena." });
  });

  it("vince chi allinea quattro pedine in verticale", () => {
    const state = play(init(), [
      [1, 0],
      [2, 1],
      [1, 0],
      [2, 1],
      [1, 0],
      [2, 1],
      [1, 0],
    ]);
    expect(connectFour.result(state)).toBe(1);
    expect(move(state, 2, 2)).toEqual({ ok: false, error: "La partita di forza 4 è già finita." });
  });

  it("vince chi allinea quattro pedine in diagonale", () => {
    const state = play(init(), [
      [1, 0],
      [2, 1],
      [1, 1],
      [2, 2],
      [1, 3],
      [2, 2],
      [1, 2],
      [2, 3],
      [1, 4],
      [2, 3],
      [1, 3],
    ]);
    expect(connectFour.result(state)).toBe(1);
  });
});
