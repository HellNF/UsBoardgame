import { describe, expect, it } from "vitest";

import type { BoardLayout } from "@/engine";
import {
  boardChangeWarning,
  canonicalJson,
  compareBoards,
  isForceFlag,
  type PublishedBoard,
} from "./board-publish";

/**
 * Il confronto fra tabelloni locali e pubblicati (J2).
 *
 * La prova che conta è che il confronto **non si spaventi per l'ordine delle chiavi** (una riga
 * letta da `jsonb` torna con le chiavi in un altro ordine) e che invece si accorga di un layout
 * diverso, anche di una sola decorazione.
 */

const board = (patch: Partial<BoardLayout> = {}): BoardLayout => ({
  id: "classic",
  name: "Classico",
  cells: [
    { n: 1, kind: "start" },
    { n: 2, kind: "free" },
    { n: 3, kind: "coins", sign: "gain" },
    { n: 100, kind: "finish" },
  ],
  ladders: [{ from: 2, to: 22 }],
  snakes: [{ from: 87, to: 37 }],
  decorations: [{ shape: "disc", cells: [46] }],
  ...patch,
});

/** La stessa riga come torna da `jsonb`: chiavi in un altro ordine. */
const publishedRow = (local: BoardLayout, patch: Partial<PublishedBoard> = {}): PublishedBoard => ({
  id: local.id,
  name: local.name,
  layout: JSON.parse(JSON.stringify(local)) as unknown,
  ...patch,
});

describe("canonicalJson", () => {
  it("mette le chiavi in ordine, anche annidate", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } })).toBe(
      '{"a":{"c":[3,{"e":5,"f":4}],"d":2},"b":1}',
    );
  });

  it("non dipende dall'ordine dei campi", () => {
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });

  it("tiene i valori come sono: numeri, stringhe, null", () => {
    expect(canonicalJson({ n: 8, s: "x", z: null })).toBe('{"n":8,"s":"x","z":null}');
  });
});

describe("compareBoards", () => {
  it("un tabellone pubblicato identico è «uguale» anche se le chiavi tornano in altro ordine", () => {
    const local = board();
    const row = publishedRow(local);
    // La riga che torna dal database ha le chiavi in ordine diverso: il confronto non deve spaventarsi.
    const shuffled = {
      id: row.id,
      name: row.name,
      layout: JSON.parse(
        '{"snakes":[{"to":37,"from":87}],"cells":[{"kind":"start","n":1},{"kind":"free","n":2},{"sign":"gain","kind":"coins","n":3},{"kind":"finish","n":100}],"ladders":[{"to":22,"from":2}],"decorations":[{"cells":[46],"shape":"disc"}],"name":"Classico","id":"classic"}',
      ),
    } as PublishedBoard;

    expect(compareBoards([local], [shuffled])).toEqual({
      added: [],
      unchanged: ["classic"],
      changed: [],
      onlyPublished: [],
    });
  });

  it("un tabellone mai pubblicato è «nuovo»", () => {
    const result = compareBoards([board()], []);
    expect(result.added).toEqual(["classic"]);
    expect(result.changed).toEqual([]);
  });

  it("una decorazione spostata basta a dire che il tabellone è cambiato", () => {
    const local = board({ decorations: [{ shape: "disc", cells: [64] }] });
    const row = publishedRow(board());
    expect(compareBoards([local], [row]).changed).toEqual([{ id: "classic", name: "Classico" }]);
  });

  it("anche una scala diversa, o solo il nome, conta come cambiamento", () => {
    expect(
      compareBoards([board({ ladders: [{ from: 3, to: 22 }] })], [publishedRow(board())]).changed,
    ).toHaveLength(1);
    expect(compareBoards([board({ name: "Classico 2" })], [publishedRow(board())]).changed).toEqual([
      { id: "classic", name: "Classico 2" },
    ]);
  });

  it("un id pubblicato che non è più fra i contenuti locali non si tocca, ma si fa notare", () => {
    const local = board();
    const old = publishedRow(board({ id: "classic-0", name: "Classico vecchio" }));
    const result = compareBoards([local], [old, publishedRow(local)]);
    expect(result.onlyPublished).toEqual(["classic-0"]);
    expect(result.unchanged).toEqual(["classic"]);
    expect(result.changed).toEqual([]);
  });

  it("più tabelloni: ognuno sta nella sua casella", () => {
    const classic = board();
    const secondo = board({ id: "serata-d-estate", name: "Serata d'estate" });
    const terzo = board({ id: "tavolo", name: "Tavolo" });
    const result = compareBoards(
      [classic, secondo, terzo],
      [publishedRow(classic), publishedRow(secondo, { name: "Serata d'estate (vecchia)" })],
    );
    expect(result.unchanged).toEqual(["classic"]);
    expect(result.changed).toEqual([{ id: "serata-d-estate", name: "Serata d'estate" }]);
    expect(result.added).toEqual(["tavolo"]);
  });
});

describe("isForceFlag", () => {
  it("vede `--force` anche quando arriva dopo il separatore di pnpm", () => {
    expect(isForceFlag(["--", "--force"])).toBe(true);
    expect(isForceFlag(["--force"])).toBe(true);
  });

  it("senza la scappatoia è falso: il separatore da solo non vale", () => {
    expect(isForceFlag([])).toBe(false);
    expect(isForceFlag(["--"])).toBe(false);
    expect(isForceFlag(["--forza"])).toBe(false);
  });
});

describe("boardChangeWarning", () => {
  it("dice quale id è cambiato e le due strade", () => {
    const message = boardChangeWarning([{ id: "classic", name: "Classico" }]);
    expect(message).toContain("classic (Classico)");
    expect(message).toContain("id nuovo");
    expect(message).toContain("pnpm content:push -- --force");
    expect(message).toContain("Domande e sfide no");
  });
});
