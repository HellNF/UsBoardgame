import { cellToCoord, coordToCell, rowOf } from "./board";
import { crossedCells, elementAngle, elementFootprints, isBorderCell } from "./board-geometry";
import {
  READABILITY_BUDGET,
  addLine,
  describeBudget,
  readabilityState,
  type ReadabilityBudget,
  type ReadabilityState,
} from "./board-readability";
import { RULES } from "./config";
import {
  QUESTION_CATEGORIES,
  type BoardDecoration,
  type BoardLayout,
  type Cell,
  type CellKind,
  type CellNumber,
  type DecorationShape,
  type Ladder,
  type QuestionCategory,
  type Snake,
} from "./types";

/**
 * Generatore di disposizioni da seme (F7-02).
 *
 * Funzione **pura**: il caso viene solo dal seme, mai da `Math.random` o dall'orologio. Stesso
 * seme, stessa disposizione, sempre — anche fra versioni diverse di Node, perché il generatore
 * congruenziale qui sotto usa solo interi.
 *
 * Cosa rispetta (docs/rules.md § Tabellone, i vincoli che controlla il validatore):
 * le 100 caselle con la stessa distribuzione di tipi della `classic`, 7 scale che salgono e 6
 * serpenti che scendono, nessun estremo condiviso fra due di loro (nemmeno fra una scala e un
 * serpente), niente che parta o arrivi sulla 1 e sulla 100, una scala o un serpente che coprono
 * al massimo `board.maxSpanRows` file, nessuna testa di serpente fra la 2 e la 12.
 *
 * E due vincoli **misurati**, tutti e due applicati durante la pesca dei candidati (non scartando
 * tabelloni finiti):
 *
 * - **l'inclinazione minima** (`board.minAngleDegrees`, docs/design.md § Tabellone): sotto i 18°
 *   sull'orizzontale una linea si legge come una sbarra piatta, non come una salita;
 * - il **budget di leggibilità** (D-72, `src/engine/board-readability.ts`): quante caselle possono
 *   avere più di una linea e quante linee al massimo sulla stessa.
 *
 * E le **decorazioni** (D-65) solo su caselle libere, che nessuna scala e nessun serpente
 * attraversa e che non stanno sulla cornice, misurate con la geometria di `board-geometry` — la
 * stessa che disegna il tabellone, così il generatore non può rifare il difetto che due neri pieni
 * si fondono in una macchia (e che sul bordo si fonde con la cornice).
 *
 * Le illustrazioni arrivano da fuori (`illustrations`): il registro sta in `src/art/illustrations`,
 * che non è del motore. Senza abbastanza id per una categoria il generatore **lancia**: meglio un
 * errore che dice cosa manca di una disposizione con le caselle domanda senza disegno.
 *
 * Non decide nulla sulla partita: la disposizione di una serata resta `classic` finché il
 * proprietario non dice altro (F7-02 è una funzione e un modo per guardare qualche seme).
 */

/** Un id di illustrazione per ogni categoria, più le stelle (che non sono una categoria). */
export type IllustrationPool = Record<QuestionCategory | "stars", string[]>;

/** Le forme decorative di un tabellone generato, nell'ordine in cui si posano. */
export const DECORATION_SHAPES: readonly DecorationShape[] = ["disc", "crescent", "hill", "diamond"];

export type BoardGeneratorOptions = {
  /** Seme del caso: lo stesso seme dà sempre la stessa disposizione. */
  seed: number;
  id?: string;
  name?: string;
  illustrations: IllustrationPool;
  /**
   * Il budget di leggibilità del piazzamento (I2): si rifiuta il candidato che porterebbe il
   * tabellone oltre il tetto e si pesca il successivo. Di partenza `READABILITY_BUDGET`
   * (`RULES.board.maxCrossings`, `RULES.board.maxLinesPerCell`); con `null` il budget non si
   * applica e il piazzamento è quello di prima (serve a misurare quanto vale, e a rigenerare una
   * disposizione di confronto).
   */
  budget?: ReadabilityBudget | null;
};

/**
 * Generatore congruenziale: stesso seme, stessa sequenza. Solo interi (`Math.imul`), perché
 * `Math.random` non entra nel motore (AGENTS.md § Regole non negoziabili) e perché due partite
 * con lo stesso seme devono venire identiche anche su macchine diverse.
 */
function seededRandom(seed: number): () => number {
  let state = Math.imul(seed | 0, 2654435761) >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state;
  };
}

/** Copia mescolata (Fisher-Yates) con il generatore dato. */
function shuffled<T>(items: readonly T[], next: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = next() % (index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/** I tipi delle caselle 2-99, nell'ordine di `RULES.board.cellCounts` (partenza e arrivo a parte). */
function interiorKinds(): CellKind[] {
  const kinds: CellKind[] = [];
  for (const [kind, count] of Object.entries(RULES.board.cellCounts) as [CellKind, number][]) {
    if (kind === "start" || kind === "finish") continue;
    for (let index = 0; index < count; index++) kinds.push(kind);
  }
  return kinds;
}

/** Quanti elementi toccano a ogni gruppo, dal più grande al più piccolo se non si divide esatto. */
function spread(total: number, groups: number): number[] {
  const base = Math.floor(total / groups);
  const rest = total % groups;
  return Array.from({ length: groups }, (_, index) => base + (index < rest ? 1 : 0));
}

/** Le 100 caselle: la forma della `classic`, mescolata dal seme. */
function buildCells(next: () => number, pool: IllustrationPool): Cell[] {
  const kinds = shuffled(interiorKinds(), next);
  const positions = Array.from({ length: kinds.length }, (_, index) => index + 2);

  const stars = shuffled(pool.stars, next);
  const starCells = kinds.filter((kind) => kind === "star").length;
  if (stars.length < starCells) {
    throw new Error(`Servono ${starCells} illustrazioni di stella, ne arrivano ${stars.length}.`);
  }

  // Monete: metà guadagni e metà perdite, come nella `classic` (5 e 5). Signori pari e dispari
  // mescolati fra loro, così non è «le prime cinque guadagnano».
  const coinCells = kinds.filter((kind) => kind === "coins").length;
  const signs: ("gain" | "loss")[] = [
    ...Array.from({ length: Math.ceil(coinCells / 2) }, () => "gain" as const),
    ...Array.from({ length: Math.floor(coinCells / 2) }, () => "loss" as const),
  ];
  const mixedSigns = shuffled(signs, next);

  let starIndex = 0;
  let coinIndex = 0;
  const cells: Cell[] = [{ n: 1, kind: "start" }];
  for (let index = 0; index < kinds.length; index++) {
    const n = positions[index];
    const kind = kinds[index];
    switch (kind) {
      case "coins":
        cells.push({ n, kind: "coins", sign: mixedSigns[coinIndex++] });
        break;
      case "star":
        cells.push({ n, kind: "star", illustration: stars[starIndex++] });
        break;
      case "question":
        // Categoria e illustrazione si decidono dopo, quando si sa quali caselle sono domanda.
        cells.push({ n, kind: "question", category: QUESTION_CATEGORIES[0], illustration: "" });
        break;
      default:
        cells.push({ n, kind });
    }
  }
  cells.push({ n: RULES.board.cells, kind: "finish" });
  cells.sort((a, b) => a.n - b.n);

  // Le caselle domanda, categoria per categoria, ognuna con un disegno diverso.
  const questions = cells.filter((cell) => cell.kind === "question");
  const perCategory = spread(questions.length, QUESTION_CATEGORIES.length);
  let cursor = 0;
  for (const [index, category] of QUESTION_CATEGORIES.entries()) {
    const ids = shuffled(pool[category], next);
    const wanted = perCategory[index];
    if (ids.length < wanted) {
      throw new Error(`Servono ${wanted} illustrazioni «${category}», ne arrivano ${ids.length}.`);
    }
    for (let step = 0; step < wanted; step++) {
      const cell = questions[cursor++];
      if (cell.kind !== "question") continue;
      cell.category = category;
      cell.illustration = ids[step];
    }
  }

  return cells;
}

/** Tutte le scale possibili: salgono, non toccano la 1 né la 100, non coprono più di 5 file, sopra la soglia. */
function ladderCandidates(): Ladder[] {
  const out: Ladder[] = [];
  for (let from = 2; from < RULES.board.cells; from++) {
    for (let to = from + 1; to < RULES.board.cells; to++) {
      const span = rowOf(to) - rowOf(from);
      if (span >= 1 && span <= RULES.board.maxSpanRows && steepEnough(from, to)) out.push({ from, to });
    }
  }
  return out;
}

/** Tutti i serpenti possibili: scendono, la testa non sta fra la 2 e la 12, al massimo 5 file, sopra la soglia. */
function snakeCandidates(): Snake[] {
  const out: Snake[] = [];
  for (let from = 13; from < RULES.board.cells; from++) {
    for (let to = 2; to < from; to++) {
      const span = rowOf(from) - rowOf(to);
      if (span >= 1 && span <= RULES.board.maxSpanRows && steepEnough(from, to)) out.push({ from, to });
    }
  }
  return out;
}

/**
 * Vero se la linea fra le due caselle è abbastanza **inclinata** (docs/design.md § Tabellone):
 * una scala che sale di una fila e si sposta di cinque colonne è una sbarra piatta, non una salita.
 *
 * Il vincolo si applica qui, come gli altri della pesca (1 e 100, file massime, testa del serpente):
 * il candidato sotto soglia non entra nemmeno nell'elenco, quindi non si scarta mai un tabellone
 * finito — la stessa scelta fatta per il budget di leggibilità.
 */
function steepEnough(from: CellNumber, to: CellNumber): boolean {
  return elementAngle(from, to) >= RULES.board.minAngleDegrees;
}

/** Sceglie gli elementi a estremi tutti diversi, mescolando i candidati con il seme. */
function pickWithinBudget<T extends { from: CellNumber; to: CellNumber }>(
  kind: "ladder" | "snake",
  candidates: T[],
  wanted: number,
  used: Set<CellNumber>,
  readability: ReadabilityState,
  budget: ReadabilityBudget | null,
  next: () => number,
): T[] {
  const chosen: T[] = [];
  for (const candidate of shuffled(candidates, next)) {
    if (chosen.length === wanted) break;
    if (used.has(candidate.from) || used.has(candidate.to)) continue;
    // Il budget si applica **qui**: un candidato che porterebbe il tabellone oltre il tetto si
    // rifiuta e si pesca il successivo. Scartare il tabellone finito non funzionerebbe: quasi
    // nessun seme starebbe dentro il tetto e gli otto tentativi si consumerebbero tutti.
    if (budget && !addLine(readability, footprintOf(kind, candidate), budget)) continue;
    chosen.push(candidate);
    used.add(candidate.from);
    used.add(candidate.to);
  }
  return chosen;
}

/** Cosa ha piazzato un tentativo: scale, serpenti e il conto della leggibilità che ne risulta. */
type Placement = { ladders: Ladder[]; snakes: Snake[]; readability: ReadabilityState };

/** Scale e serpenti di un tentativo, estremi tutti diversi e dentro il budget di leggibilità. */
function placeElements(
  next: () => number,
  budget: ReadabilityBudget | null,
  used: Set<CellNumber>,
): Placement {
  const readability = readabilityState();
  const ladders = pickWithinBudget(
    "ladder",
    ladderCandidates(),
    RULES.board.ladders,
    used,
    readability,
    budget,
    next,
  );
  const snakes = pickWithinBudget(
    "snake",
    snakeCandidates(),
    RULES.board.snakes,
    used,
    readability,
    budget,
    next,
  );
  return { ladders, snakes, readability };
}

/**
 * L'ingombro di un solo elemento, con la misura del budget (inchiostro intero).
 *
 * La misura dipende solo dagli estremi, quindi si calcola **una volta sola** per candidato: senza
 * questa memoria il piazzamento rifà la misura di centinaia di candidati a ogni tabellone, che è il
 * costo che faceva scadere i test (la scala del tabellone è fissa, i candidati sono circa 5.000).
 */
const footprintCache = new Map<string, Set<CellNumber>>();

function footprintOf(kind: "ladder" | "snake", element: Ladder | Snake): Set<CellNumber> {
  const key = `${kind}:${element.from}:${element.to}`;
  const cached = footprintCache.get(key);
  if (cached) return cached;

  const board =
    kind === "ladder"
      ? { ladders: [element as Ladder], snakes: [] as Snake[] }
      : { ladders: [] as Ladder[], snakes: [element as Snake] };
  const cells = elementFootprints(board)[0].cells;
  footprintCache.set(key, cells);
  return cells;
}

/**
 * Il messaggio quando il budget non lascia arrivare a 7 e 6: dice **a quanto si è fermato** e **con
 * che tetto**, che è quello che serve per decidere se allargarlo o accontentarsi di un tabellone
 * con meno scale. Un tabellone con meno elementi non passa il validatore di
 * `docs/rules.md` § Tabellone (7 scale e 6 serpenti sono un vincolo), quindi il generatore lancia
 * invece di restituire una disposizione che il resto del gioco rifiuterebbe.
 */
function shortfallMessage(seed: number, budget: ReadabilityBudget, best: Placement | null): string {
  const reached = best ? `${best.ladders.length} scale e ${best.snakes.length}` : "nessuna scala";
  return `Il budget di leggibilità (${describeBudget(budget)}) non lascia arrivare a ${RULES.board.ladders} scale e ${RULES.board.snakes} serpenti sul seme ${seed}: il tentativo migliore si ferma a ${reached}.`;
}

/**
 * Le decorazioni su caselle che nulla attraversa e che stanno dentro il tabellone (D-65).
 *
 * Le misure sono quelle vere — l'ingombro dei montanti di una scala, metà del corpo di un
 * serpente, con la decorazione dentro il suo margine di 12 unità — perché con un inchiostro
 * pieno sotto un altro inchiostro pieno la forma si fonde in una macchia, ed è il difetto che il
 * proprietario ha corretto a mano sulla 23 e sulla 26.
 *
 * I vincoli sono tre e vengono dal guardare il tabellone vero: casella **libera**, **non
 * attraversata** da una scala o da un serpente, **non di bordo** (la cornice è spessa 16 unità e
 * si disegna dopo le decorazioni: sul bordo si mangia il margine di 12 e i due neri diventano uno,
 * era il disco sulle caselle 4-5 della `classic`).
 *
 * Le forme previste sono quattro, ma la regola viene prima del numero: se le caselle libere che
 * nulla attraversa sono meno di quattro, si mette quello che ci sta. Il disco preferisce due
 * caselle attaccate nella stessa fila (come nella `classic`); se non ce ne sono resta su una
 * casella sola, che è la stessa forma più stretta.
 */
function chooseDecorations(
  board: BoardLayout,
  crossed: Set<CellNumber>,
  next: () => number,
): BoardDecoration[] {
  const order = shuffled(
    board.cells
      .filter((cell) => cell.kind === "free" && !crossed.has(cell.n) && !isBorderCell(cell.n))
      .map((cell) => cell.n),
    next,
  );

  const decorations: BoardDecoration[] = [];
  const taken = new Set<CellNumber>();
  for (const [index, shape] of DECORATION_SHAPES.entries()) {
    if (index === 0) {
      const start = order.find((cell) => {
        const { row, col } = cellToCoord(cell);
        return !taken.has(cell) && col + 1 < RULES.board.size && order.includes(coordToCell(row, col + 1));
      });
      if (start === undefined) {
        const single = order.find((cell) => !taken.has(cell));
        if (single === undefined) break;
        taken.add(single);
        decorations.push({ shape, cells: [single] });
        continue;
      }
      const { row, col } = cellToCoord(start);
      const pair = [start, coordToCell(row, col + 1)];
      for (const cell of pair) taken.add(cell);
      decorations.push({ shape, cells: pair });
      continue;
    }
    const cell = order.find((candidate) => !taken.has(candidate));
    if (cell === undefined) break;
    taken.add(cell);
    decorations.push({ shape, cells: [cell] });
  }

  return decorations;
}

/**
 * Una disposizione completa: 100 caselle, 7 scale, 6 serpenti e le decorazioni che ci stanno.
 *
 * Scale e serpenti si ripescano due volte: se il candidato successivo porterebbe il tabellone oltre
 * il **budget di leggibilità** (I2) si rifiuta e si prova il prossimo, e se le decorazioni non
 * trovano quattro caselle libere il tentativo intero si rifà. Ogni ripescaggio consuma il
 * generatore, quindi la disposizione resta deterministica. Si accetta anche l'ultimo tentativo —
 * un tabellone con tre decorazioni è meglio di nessun tabellone — ma con otto tentativi un tabellone
 * povero di caselle libere è raro.
 *
 * Se in tutti gli otto tentativi il budget taglia le scale o i serpenti, il generatore **lancia**
 * dicendo a quanto si è fermato e con che tetto: un tabellone con meno di 7 scale o 6 serpenti non
 * passa il validatore (docs/rules.md § Tabellone), quindi non si restituisce una disposizione che il
 * resto del gioco rifiuterebbe. Con `budget: null` quel caso non esiste.
 */
export function generateBoard(options: BoardGeneratorOptions): BoardLayout {
  const next = seededRandom(options.seed);
  const cells = buildCells(next, options.illustrations);
  const budget = options.budget === undefined ? READABILITY_BUDGET : options.budget;

  const attempts = 8;
  let board: BoardLayout | null = null;
  let best: Placement | null = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const used = new Set<CellNumber>();
    const placement = placeElements(next, budget, used);

    // Il budget ha tagliato questo tentativo: si tiene il migliore e si prova un altro giro di
    // mescolata (il generatore avanza, quindi la disposizione resta la stessa a parità di seme).
    if (placement.ladders.length < RULES.board.ladders || placement.snakes.length < RULES.board.snakes) {
      const placed = placement.ladders.length + placement.snakes.length;
      if (!best || placed > best.ladders.length + best.snakes.length) best = placement;
      continue;
    }

    const candidate: BoardLayout = {
      id: options.id ?? `seed-${options.seed}`,
      name: options.name ?? `Generata dal seme ${options.seed}`,
      cells,
      ladders: placement.ladders,
      snakes: placement.snakes,
      decorations: [],
    };
    const decorations = chooseDecorations(candidate, crossedCells(candidate), next);
    if (decorations.length === DECORATION_SHAPES.length || attempt === attempts) {
      candidate.decorations = decorations;
      board = candidate;
    }
  }

  if (!board) {
    if (!budget) throw new Error(`Nessuna disposizione generata per il seme ${options.seed}.`);
    throw new Error(shortfallMessage(options.seed, budget, best));
  }
  return board;
}
