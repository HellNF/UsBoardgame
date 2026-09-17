import { describe, expect, it } from "vitest";
import { validateBoard } from "./board-validation";
import { createTestContext, testBoard, TEST_BOARD } from "./testing";

describe("strumenti di test (F1-04)", () => {
  it("la disposizione di prova rispetta i vincoli del tabellone", () => {
    const result = validateBoard(TEST_BOARD);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it("la disposizione di prova ha le caselle notevoli dei test", () => {
    const board = testBoard();
    expect(board.cells[5]?.kind).toBe("question"); // casella 6
    expect(board.cells[9]).toEqual({ n: 10, kind: "coins", sign: "gain" });
    expect(board.cells[10]).toEqual({ n: 11, kind: "coins", sign: "loss" });
    expect(board.cells[11]?.kind).toBe("star");
    expect(board.cells[12]?.kind).toBe("event");
    expect(board.cells[13]?.kind).toBe("challenge");
    // 48 è base di scala e casella domanda: serve per la regola D-07.
    expect(board.cells[47]?.kind).toBe("question");
    expect(board.ladders).toContainEqual({ from: 48, to: 70 });
  });

  it("testBoard restituisce una copia indipendente", () => {
    const first = testBoard();
    first.cells[0] = { n: 1, kind: "free" };
    expect(testBoard().cells[0]).toEqual({ n: 1, kind: "start" });
  });

  it("il RNG finto segue la sequenza data, ciclando", () => {
    const { ctx } = createTestContext({ random: [2, 5] });
    expect([ctx.randomInt(6), ctx.randomInt(6), ctx.randomInt(6), ctx.randomInt(6)]).toEqual([2, 5, 2, 5]);
  });

  it("l'orologio finto avanza su richiesta", () => {
    const test = createTestContext({ now: "2026-09-17T20:00:00.000Z" });
    test.advanceSeconds(30);
    expect(test.now().toISOString()).toBe("2026-09-17T20:00:30.000Z");
  });

  it("la sfida pescata rispetta la richiesta di sfida lampo", () => {
    const test = createTestContext();
    expect(test.ctx.drawChallenge({ snakeFlash: true }).snakeFlash).toBe(true);
    expect(test.ctx.drawChallenge({ snakeFlash: false }).snakeFlash).toBe(false);
    expect(test.drawChallengeCalls).toEqual([{ snakeFlash: true }, { snakeFlash: false }]);
  });
});
