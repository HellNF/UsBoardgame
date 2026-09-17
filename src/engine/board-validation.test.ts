import { describe, expect, it } from "vitest";
import { validateBoard, assertValidBoard } from "./board-validation";
import { testBoard, TEST_BOARD } from "./testing";
import type { BoardLayout } from "./types";

/**
 * Validatore dei vincoli di una disposizione (docs/rules.md § Tabellone, F1-01):
 * un test per ognuno dei sei vincoli.
 */

const errorsOf = (board: BoardLayout): string[] => {
  const result = validateBoard(board);
  return result.ok ? [] : result.errors;
};

const broken = (change: (board: BoardLayout) => void): string => {
  const board = testBoard();
  change(board);
  return errorsOf(board).join("\n");
};

describe("disposizione valida", () => {
  it("la disposizione di prova rispetta tutti i vincoli", () => {
    expect(errorsOf(TEST_BOARD)).toEqual([]);
  });

  it("assertValidBoard non lancia su una disposizione valida", () => {
    expect(() => assertValidBoard(TEST_BOARD)).not.toThrow();
  });

  it("assertValidBoard elenca gli errori di una disposizione rotta", () => {
    const board = testBoard();
    board.snakes.push({ from: 5, to: 3 });
    expect(() => assertValidBoard(board)).toThrow(/la testa in 5/);
  });
});

describe("vincolo 1: 100 celle, la 1 di partenza e la 100 di arrivo", () => {
  it("serve esattamente 100 celle", () => {
    expect(broken((board) => board.cells.pop())).toContain("Servono 100 celle, trovate 99.");
  });

  it("i numeri devono essere in ordine da 1 a 100", () => {
    expect(broken((board) => (board.cells[4] = { n: 99, kind: "free" }))).toContain(
      "La cella in posizione 5 ha numero 99",
    );
  });

  it("la 1 è `start` e la 100 è `finish`", () => {
    expect(broken((board) => (board.cells[0] = { n: 1, kind: "free" }))).toContain(
      "La casella 1 deve essere di tipo `start`",
    );
    expect(broken((board) => (board.cells[99] = { n: 100, kind: "free" }))).toContain(
      "La casella 100 deve essere di tipo `finish`",
    );
  });
});

describe("vincolo 2: quantità per tipo e coerenza delle caselle domanda", () => {
  it("le quantità devono essere quelle di RULES", () => {
    expect(broken((board) => (board.cells[3] = { n: 4, kind: "challenge" }))).toContain(
      "Caselle di tipo `challenge`: attese 12, trovate 13.",
    );
  });

  it("una casella domanda vuole categoria e illustrazione", () => {
    expect(
      broken((board) => (board.cells[5] = { n: 6, kind: "question", category: "tastes", illustration: "" })),
    ).toContain("La casella 6 è una domanda senza illustrazione.");
  });
});

describe("vincolo 3: né scale né serpenti sulla 1 o sulla 100", () => {
  it("rifiuta una scala che parte dalla 1", () => {
    expect(broken((board) => board.ladders.push({ from: 1, to: 40 }))).toContain(
      "non si può toccare la casella 1",
    );
  });

  it("rifiuta un serpente che arriva alla 100", () => {
    expect(broken((board) => board.snakes.push({ from: 99, to: 100 }))).toContain(
      "non si può toccare la casella 100",
    );
  });
});

describe("vincolo 4: nessuna casella è estremo di due elementi", () => {
  it("rifiuta una scala che finisce sulla base di un'altra scala", () => {
    expect(broken((board) => board.ladders.push({ from: 2, to: 22 }))).toContain(
      "La casella 22 è estremo di due elementi",
    );
  });

  it("rifiuta una scala che finisce sulla testa di un serpente", () => {
    expect(broken((board) => board.ladders.push({ from: 2, to: 15 }))).toContain(
      "La casella 15 è estremo di due elementi",
    );
  });
});

describe("vincolo 5: verso e fila di scale e serpenti", () => {
  it("una scala deve salire", () => {
    expect(broken((board) => board.ladders.push({ from: 30, to: 8 }))).toContain(
      "la cima deve essere più avanti della base",
    );
  });

  it("un serpente deve scendere", () => {
    expect(broken((board) => board.snakes.push({ from: 60, to: 70 }))).toContain(
      "la coda deve essere più indietro della testa",
    );
  });

  it("una scala non può restare nella stessa fila", () => {
    expect(broken((board) => board.ladders.push({ from: 12, to: 18 }))).toContain(
      "resta nella stessa fila (2)",
    );
  });

  it("un serpente non può restare nella stessa fila", () => {
    expect(broken((board) => board.snakes.push({ from: 58, to: 52 }))).toContain(
      "resta nella stessa fila (6)",
    );
  });

  it("le quantità dichiarate di scale e serpenti sono quelle di RULES", () => {
    expect(broken((board) => board.ladders.pop())).toContain("Scale: attese 7, trovate 6.");
    expect(broken((board) => board.snakes.pop())).toContain("Serpenti: attesi 6, trovate 5.");
  });
});

describe("vincolo 6: nessuna testa di serpente fra la 2 e la 12", () => {
  it("rifiuta un serpente appena dopo la partenza", () => {
    expect(broken((board) => board.snakes.push({ from: 5, to: 3 }))).toContain(
      "Serpente con la testa in 5: vietato fra la 2 e la 12.",
    );
  });
});
