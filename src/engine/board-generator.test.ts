import { describe, expect, it } from "vitest";

import { illustrationsByCategory } from "@/art/illustrations";
import { boards } from "@/content/boards";
import { DECORATION_SHAPES } from "@/engine/board-generator";
import {
  QUESTION_CATEGORIES,
  READABILITY_BUDGET,
  RULES,
  cellToCoord,
  crossedCells,
  elementAngle,
  fitsBudget,
  generateBoard,
  isBorderCell,
  measureReadability,
  rowOf,
  validateBoard,
  type BoardLayout,
  type CellKind,
} from "@/engine";

/**
 * Il generatore di disposizioni da seme (F7-02).
 *
 * Il seme è l'unica fonte del caso: le prove qui sotto legano la **determinazione** (stesso seme,
 * stessa disposizione), gli **invarianti** che il proprietario ha chiesto (la distribuzione di
 * tipi della `classic`, scale che salgono, serpenti che scendono, estremi tutti diversi, niente
 * sulla 1 e sulla 100) e la regola delle decorazioni di D-65, che è il difetto corretto a mano
 * sulla 23 e sulla 26: il generatore non deve poterlo rifare.
 */

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const pool = () => illustrationsByCategory();
const generate = (seed: number): BoardLayout => generateBoard({ seed, illustrations: pool() });

const classic = boards.find((board) => board.id === "classic") ?? boards[0];

/** Quante caselle di ogni tipo: le stesse della `classic`, contate da lì. */
const kindsOf = (board: BoardLayout): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const cell of board.cells) counts[cell.kind] = (counts[cell.kind] ?? 0) + 1;
  return counts;
};

const endpointsOf = (board: BoardLayout): { cell: number; what: string }[] => [
  ...board.ladders.flatMap(({ from, to }) => [
    { cell: from, what: `base ${from}→${to}` },
    { cell: to, what: `cima ${from}→${to}` },
  ]),
  ...board.snakes.flatMap(({ from, to }) => [
    { cell: from, what: `testa ${from}→${to}` },
    { cell: to, what: `coda ${from}→${to}` },
  ]),
];

describe("generateBoard: il seme è l'unico caso (F7-02)", () => {
  it("stesso seme, stessa disposizione: due chiamate sono identiche", () => {
    expect(generate(7)).toEqual(generate(7));
  });

  it("semi diversi danno disposizioni diverse", () => {
    expect(generate(1)).not.toEqual(generate(2));
  });

  it("non chiama `Math.random`: il seme 1 dà sempre la stessa disposizione", () => {
    const board = generate(1);
    expect(board.id).toBe("seed-1");
    expect(board.ladders.map(({ from, to }) => `${from}>${to}`)).toEqual(
      generate(1).ladders.map(({ from, to }) => `${from}>${to}`),
    );
  });
});

describe("generateBoard: gli invarianti della classic", () => {
  it("le 100 caselle hanno la stessa distribuzione di tipi della classic", () => {
    const expected = kindsOf(classic);
    for (const seed of SEEDS) {
      expect(kindsOf(generate(seed))).toEqual(expected);
    }
  });

  it("le monete sono metà guadagni e metà perdite, come nella classic", () => {
    const signOf = (board: BoardLayout) => {
      const coins = board.cells.filter((cell) => cell.kind === "coins");
      return {
        gain: coins.filter((cell) => cell.kind === "coins" && cell.sign === "gain").length,
        loss: coins.filter((cell) => cell.kind === "coins" && cell.sign === "loss").length,
      };
    };
    expect(signOf(generate(3))).toEqual(signOf(classic));
  });

  it("le scale salgono e i serpenti scendono, e sono 7 e 6", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      expect(board.ladders).toHaveLength(RULES.board.ladders);
      expect(board.snakes).toHaveLength(RULES.board.snakes);
      for (const { from, to } of board.ladders) expect(to).toBeGreaterThan(from);
      for (const { from, to } of board.snakes) expect(to).toBeLessThan(from);
    }
  });

  it("nessun estremo condiviso fra due scale o serpenti", () => {
    for (const seed of SEEDS) {
      const endpoints = endpointsOf(generate(seed)).map((endpoint) => endpoint.cell);
      expect(new Set(endpoints).size).toBe(endpoints.length);
    }
  });

  it("niente parte o arriva sulla 1 e sulla 100, e nessuna testa fra la 2 e la 12", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      for (const { cell } of endpointsOf(board)) {
        expect(cell).toBeGreaterThan(1);
        expect(cell).toBeLessThan(RULES.board.cells);
      }
      for (const { from } of board.snakes) expect(from).toBeGreaterThan(12);
    }
  });

  it("ogni casella domanda ha categoria e illustrazione della sua categoria", () => {
    const pool = illustrationsByCategory();
    for (const seed of SEEDS) {
      for (const cell of generate(seed).cells) {
        if (cell.kind !== "question") continue;
        expect(cell.illustration).toMatch(new RegExp(`^${cell.category}-`));
        expect(pool[cell.category]).toContain(cell.illustration);
      }
    }
  });

  it("la disposizione passa il validatore di docs/rules.md § Tabellone", () => {
    for (const seed of SEEDS) {
      expect(validateBoard(generate(seed))).toEqual({ ok: true });
    }
  });
});

describe("generateBoard: le decorazioni e D-65", () => {
  it("si decora solo una casella libera che nulla attraversa", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      const crossed = crossedCells(board);
      for (const decoration of board.decorations) {
        for (const cell of decoration.cells) {
          const kind = board.cells.find((candidate) => candidate.n === cell)?.kind;
          expect(kind).toBe("free");
          expect(crossed.has(cell)).toBe(false);
        }
      }
    }
  });

  it("non si decora mai una casella di bordo: la cornice si mangia il margine", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      for (const decoration of board.decorations) {
        for (const cell of decoration.cells) expect(isBorderCell(cell)).toBe(false);
      }
    }
  });

  it("le decorazioni sono al massimo quattro, una per forma", () => {
    for (const seed of SEEDS) {
      const decorations = generate(seed).decorations;
      expect(decorations.length).toBeLessThanOrEqual(DECORATION_SHAPES.length);
      for (const decoration of decorations) expect(decoration.cells.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("si decora ogni volta che una casella decorabile c'è, e mai più di quelle (la regola prima del numero)", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      const crossed = crossedCells(board);
      const dec = board.cells.filter(
        (cell) => cell.kind === "free" && !crossed.has(cell.n) && !isBorderCell(cell.n),
      );
      const decorated = board.decorations.flatMap((decoration) => decoration.cells);
      // Le caselle legali sono poche — il bordo ne toglie 36 e le linee ne coprono altre — e questa
      // è la ragione per cui un tabellone generato può portare due o tre forme invece di quattro, o
      // nessuna (il seme 1, dopo la soglia di inclinazione: le linee ripide coprono più caselle).
      expect(decorated.length).toBeLessThanOrEqual(dec.length);
      if (dec.length > 0) expect(decorated.length).toBeGreaterThan(0);
      for (const decoration of board.decorations) {
        expect(decoration.cells.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("il disco, che è l'unica forma su due caselle, sta su due caselle attaccate", () => {
    for (const seed of SEEDS) {
      const disc = generate(seed).decorations.find((decoration) => decoration.shape === "disc");
      if (!disc || disc.cells.length < 2) continue;
      const [first, second] = disc.cells.map((cell) => cellToCoord(cell));
      expect(first.row).toBe(second.row);
      expect(Math.abs(first.col - second.col)).toBe(1);
    }
  });

  it("niente decorazioni su caselle che non sono libere", () => {
    const decorated = SEEDS.flatMap((seed) =>
      generate(seed).decorations.flatMap((decoration) => decoration.cells),
    );
    expect(decorated.length).toBeGreaterThan(0);
    for (const cell of decorated) expect(cell).toBeGreaterThan(1);
  });
});

describe("generateBoard: quando i disegni non bastano", () => {
  it("lancia dicendo quanti ne mancano invece di lasciare caselle senza disegno", () => {
    expect(() =>
      generateBoard({
        seed: 1,
        illustrations: { tastes: [], memories: [], future: [], deep: [], funny: [], stars: [] },
      }),
    ).toThrow(/illustrazioni/);
  });

  it("le stesse quantità vanno bene: sette disegni per categoria e tre stelle", () => {
    const pool = illustrationsByCategory();
    for (const category of QUESTION_CATEGORIES) {
      expect(pool[category].length).toBeGreaterThanOrEqual(7);
    }
    expect(pool.stars.length).toBeGreaterThanOrEqual(3);
  });
});

describe("generateBoard: l'inclinazione minima delle linee (J1)", () => {
  it("nessuna scala o serpente generato sta sotto la soglia", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      for (const { from, to } of [...board.ladders, ...board.snakes]) {
        expect(elementAngle(from, to)).toBeGreaterThanOrEqual(RULES.board.minAngleDegrees);
      }
    }
  });

  it("la soglia viene dalla classic: la sua linea più piatta è la scala 51→67, 18,4°", () => {
    const angles = [...classic.ladders, ...classic.snakes].map(({ from, to }) => elementAngle(from, to));
    expect(Math.min(...angles)).toBeCloseTo(18.43, 1);
    expect(Math.min(...angles)).toBeGreaterThanOrEqual(RULES.board.minAngleDegrees);
  });

  it("le scale continuano a salire e i serpenti a scendere di almeno una fila", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      for (const { from, to } of board.ladders) expect(rowOf(to)).toBeGreaterThan(rowOf(from));
      for (const { from, to } of board.snakes) expect(rowOf(to)).toBeLessThan(rowOf(from));
    }
  });
});

describe("generateBoard: il budget di leggibilità (I2)", () => {
  it("il conto della classic segue la larghezza delle linee: 14 incroci e 2 linee per casella", () => {
    // Il numero dipende dall'inchiostro, non solo dalle posizioni: era 17 quando una scala era
    // larga 62 unità e un serpente 26. Assottigliate a 40 e 16 (docs/design.md § Tabellone), le
    // stesse scale e gli stessi serpenti sfiorano meno caselle. Se cambiano le larghezze, questo
    // numero cambia con loro: è la misura dell'ingombro, non un vincolo della disposizione.
    const measure = measureReadability(classic);
    expect(measure.crossings).toBe(14);
    expect(measure.linesPerCell).toBe(2);
  });

  it("nessuna disposizione generata supera il tetto di incroci e di linee per casella", () => {
    for (const seed of SEEDS) {
      const measure = measureReadability(generate(seed));
      expect(measure.crossings).toBeLessThanOrEqual(READABILITY_BUDGET.crossings);
      expect(measure.linesPerCell).toBeLessThanOrEqual(READABILITY_BUDGET.linesPerCell);
      expect(fitsBudget(measure, READABILITY_BUDGET)).toBe(true);
    }
  });

  it("il budget è la sola differenza: senza, gli stessi semi tornano sopra il tetto", () => {
    for (const seed of [1, 12, 17]) {
      const withoutBudget = generateBoard({ seed, illustrations: pool(), budget: null });
      const measure = measureReadability(withoutBudget);
      expect(measure.linesPerCell).toBeGreaterThan(READABILITY_BUDGET.linesPerCell);
      expect(measure.crossings).toBeGreaterThan(READABILITY_BUDGET.crossings);
      // Stesso seme e stessi vincoli di prima: la disposizione senza budget è ancora valida.
      expect(validateBoard(withoutBudget)).toEqual({ ok: true });
    }
  });

  it("con un tetto impossibile (nessuna linea ammessa) si ferma dicendo a quanto e con che tetto", () => {
    expect(() =>
      generateBoard({ seed: 1, illustrations: pool(), budget: { crossings: 0, linesPerCell: 0 } }),
    ).toThrow(/budget di leggibilità \(0 incroci, 0 linee per casella\)[\s\S]*si ferma a \d+ scale e \d+/);
  });

  it("il budget non cambia nient'altro: le scale restano 7, i serpenti 6", () => {
    for (const seed of SEEDS) {
      const board = generate(seed);
      expect(board.ladders).toHaveLength(RULES.board.ladders);
      expect(board.snakes).toHaveLength(RULES.board.snakes);
    }
  });
});

describe("generateBoard: che i tipi restino quelli dichiarati", () => {
  it("la `classic` e una generata hanno le stesse chiavi di tipo", () => {
    const kinds = (board: BoardLayout) => [...new Set(board.cells.map((cell) => cell.kind))].sort();
    expect(kinds(generate(5))).toEqual(kinds(classic));
    const declared: CellKind[] = [
      "challenge",
      "coins",
      "event",
      "finish",
      "free",
      "question",
      "star",
      "start",
    ];
    expect(kinds(classic)).toEqual([...declared].sort());
  });
});
