import { describe, expect, it } from "vitest";
import { validateBoard } from "@/engine/board-validation";
import { RULES } from "@/engine/config";
import type { BoardLayout } from "@/engine/types";
import { boards, defaultBoardId, frozenBoards } from "./index";

const expectValid = (board: BoardLayout) => {
  const result = validateBoard(board);
  expect(result.ok ? [] : result.errors).toEqual([]);
};

describe("disposizioni del tabellone", () => {
  it("ne esiste almeno una e l'id predefinito è fra queste", () => {
    expect(boards.length).toBeGreaterThan(0);
    expect(boards.map((b) => b.id)).toContain(defaultBoardId);
  });

  it("ogni id è unico, contando anche le disposizioni congelate", () => {
    const ids = [...boards, ...frozenBoards].map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const board of [...boards, ...frozenBoards]) {
    describe(`disposizione \`${board.id}\``, () => {
      it("rispetta tutti i vincoli di docs/rules.md § Tabellone", () => {
        expectValid(board);
      });

      it("ha 100 caselle, 7 scale e 6 serpenti", () => {
        expect(board.cells).toHaveLength(RULES.board.cells);
        expect(board.ladders).toHaveLength(RULES.board.ladders);
        expect(board.snakes).toHaveLength(RULES.board.snakes);
      });
    });
  }
});
