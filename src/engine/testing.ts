import { RULES } from "./config";
import { createInitialState, reduce } from "./reducer";
import type {
  Action,
  BoardLayout,
  Cell,
  CellKind,
  CellNumber,
  ChallengeCard,
  DrawnQuestion,
  EngineContext,
  GameEvent,
  GameSettings,
  GameState,
  QuestionCategory,
  Seat,
} from "./types";

/**
 * Strumenti per i test del motore (task F1-04): una disposizione di prova e un
 * `EngineContext` finto con RNG deterministico, orologio controllabile e contenuti finti.
 *
 * Non è codice di produzione: sta in `src/engine` perché non ha dipendenze esterne.
 */

// ---------------------------------------------------------------------------
// Disposizione di prova
// ---------------------------------------------------------------------------

/** Caselle fissate a mano per i test (il resto è riempito in modo deterministico). */
const FIXED: Record<number, Cell> = {
  5: { n: 5, kind: "free" },
  6: { n: 6, kind: "question", category: "tastes", illustration: "test-tastes" },
  7: { n: 7, kind: "free" },
  10: { n: 10, kind: "coins", sign: "gain" },
  11: { n: 11, kind: "coins", sign: "loss" },
  12: { n: 12, kind: "star", illustration: "test-star" },
  13: { n: 13, kind: "event" },
  14: { n: 14, kind: "challenge" },
  // Base di una scala che è anche casella domanda: serve per la regola D-07.
  48: { n: 48, kind: "question", category: "memories", illustration: "test-memories" },
};

/**
 * Scale e serpenti della disposizione di prova: basi e teste scelte per essere
 * raggiungibili con i tiri dei test (dadi finti) e per non toccare la 1 e la 100.
 */
const LADDERS: BoardLayout["ladders"] = [
  { from: 8, to: 30 },
  { from: 22, to: 44 },
  { from: 35, to: 60 },
  { from: 48, to: 70 },
  { from: 63, to: 85 },
  { from: 77, to: 96 },
  { from: 88, to: 99 },
];

const SNAKES: BoardLayout["snakes"] = [
  { from: 15, to: 4 },
  { from: 27, to: 9 },
  { from: 41, to: 20 },
  { from: 55, to: 33 },
  { from: 69, to: 50 },
  { from: 92, to: 72 },
];

/** Basse e teste: nel test diventano caselle libere (nessun effetto prima di scala/serpente). */
const SNAKE_AND_LADDER_CELLS = new Set([
  ...LADDERS.map((ladder) => ladder.from).filter((n) => n !== 48),
  ...SNAKES.map((snake) => snake.from),
]);

/** Rimescolamento deterministico (LCG): niente `Math.random` nel motore. */
function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let state = seed;
  const next = (max: number) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state % max;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = next(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildCells(): Cell[] {
  const fill: CellKind[] = [
    ...Array<CellKind>(RULES.board.cellCounts.question - 2).fill("question"),
    ...Array<CellKind>(RULES.board.cellCounts.challenge - 1).fill("challenge"),
    ...Array<CellKind>(RULES.board.cellCounts.event - 1).fill("event"),
    ...Array<CellKind>(RULES.board.cellCounts.coins - 2).fill("coins"),
    ...Array<CellKind>(RULES.board.cellCounts.star - 1).fill("star"),
    ...Array<CellKind>(RULES.board.cellCounts.free - 14).fill("free"),
  ];
  const order = shuffle(fill, 20260917);

  let questionIndex = 0;
  let coinIndex = 0;
  let starIndex = 0;
  const cells: Cell[] = [];
  for (let n = 1; n <= RULES.board.cells; n++) {
    if (n === 1) {
      cells.push({ n, kind: "start" });
      continue;
    }
    if (n === RULES.board.cells) {
      cells.push({ n, kind: "finish" });
      continue;
    }
    const fixed = FIXED[n];
    if (fixed) {
      if (fixed.kind === "question") questionIndex += 1;
      if (fixed.kind === "coins") coinIndex += 1;
      if (fixed.kind === "star") starIndex += 1;
      cells.push(fixed);
      continue;
    }
    if (SNAKE_AND_LADDER_CELLS.has(n)) {
      cells.push({ n, kind: "free" });
      continue;
    }
    const kind = order.pop();
    if (!kind) throw new Error("Riempimento della disposizione di prova esaurito.");
    switch (kind) {
      case "question": {
        const categories: QuestionCategory[] = ["tastes", "memories", "future", "deep", "funny"];
        const category = categories[questionIndex % categories.length];
        questionIndex += 1;
        cells.push({ n, kind, category, illustration: `test-${category}` });
        break;
      }
      case "coins": {
        cells.push({ n, kind, sign: coinIndex % 2 === 0 ? "gain" : "loss" });
        coinIndex += 1;
        break;
      }
      case "star": {
        starIndex += 1;
        cells.push({ n, kind, illustration: `test-star-${starIndex}` });
        break;
      }
      default:
        cells.push({ n, kind });
    }
  }
  return cells;
}

/** Disposizione di prova: 100 caselle, 7 scale, 6 serpenti, nessuna decorazione. */
export const TEST_BOARD: BoardLayout = {
  id: "test",
  name: "Disposizione di prova",
  cells: buildCells(),
  ladders: LADDERS,
  snakes: SNAKES,
  decorations: [],
};

/** Copia della disposizione di prova, così un test non può sporcare gli altri. */
export const testBoard = (): BoardLayout => structuredClone(TEST_BOARD);

// ---------------------------------------------------------------------------
// Contenuti finti
// ---------------------------------------------------------------------------

/** Domande finte: una per tipo, più una per categoria. */
export const DEFAULT_QUESTIONS: DrawnQuestion[] = [
  { id: "tastes-001", kind: "short", category: "tastes" },
  { id: "tastes-002", kind: "multiple", category: "tastes" },
  { id: "tastes-003", kind: "open", category: "tastes" },
  { id: "memories-001", kind: "short", category: "memories" },
  { id: "memories-002", kind: "multiple", category: "memories" },
  { id: "memories-003", kind: "open", category: "memories" },
  { id: "future-001", kind: "multiple", category: "future" },
  { id: "future-002", kind: "open", category: "future" },
  { id: "deep-001", kind: "short", category: "deep" },
  { id: "deep-002", kind: "multiple", category: "deep" },
  { id: "deep-003", kind: "open", category: "deep" },
  { id: "funny-001", kind: "multiple", category: "funny" },
  { id: "funny-002", kind: "open", category: "funny" },
];

/** Sfide finte: un minigioco automatico, due prove e un duello a doppia conferma. */
export const DEFAULT_CHALLENGES: ChallengeCard[] = [
  {
    id: "tic-tac-toe",
    mode: "duel",
    verdict: "automatic",
    prize: 3,
    durationSeconds: { min: 60, max: 180 },
    snakeFlash: false,
    minigame: "tic-tac-toe",
  },
  {
    id: "memory",
    mode: "duel",
    verdict: "automatic",
    prize: 3,
    durationSeconds: { min: 60, max: 180 },
    snakeFlash: false,
    minigame: "memory",
  },
  {
    id: "connect-four",
    mode: "duel",
    verdict: "automatic",
    prize: 3,
    durationSeconds: { min: 60, max: 180 },
    snakeFlash: false,
    minigame: "connect-four",
  },
  {
    id: "funny-face",
    mode: "trial",
    verdict: "judge",
    prize: 2,
    durationSeconds: { min: 20, max: 30 },
    snakeFlash: true,
    minigame: null,
  },
  {
    id: "mime",
    mode: "trial",
    verdict: "judge",
    prize: 2,
    durationSeconds: { min: 30, max: 30 },
    snakeFlash: true,
    minigame: null,
  },
  {
    id: "lichess-blitz",
    mode: "duel",
    verdict: "double_confirm",
    prize: 5,
    durationSeconds: { min: 300, max: 480 },
    snakeFlash: false,
    minigame: null,
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  boardId: TEST_BOARD.id,
  challengeCategories: ["builtin", "videocall", "external"],
  maxChallengeSeconds: 300,
  stake: "chi vince sceglie il film della prossima serata",
  pawns: { 1: "fox", 2: "rabbit" },
  colors: { 1: "red", 2: "blue" },
};

// ---------------------------------------------------------------------------
// Contesto finto
// ---------------------------------------------------------------------------

export type DrawQuestionRequest = {
  category: QuestionCategory;
  maxLevel: number;
  knowMeOnly: boolean;
};

export type DrawChallengeRequest = { snakeFlash: boolean };

export type MultipleChoiceRequest = { questionId: string; aboutSeat: Seat; answer: string };

export type TestContextOptions = {
  board?: BoardLayout;
  settings?: Partial<GameSettings>;
  /** Valori di `randomInt`, in ordine; esauriti, la sequenza riparte da capo. */
  random?: number[];
  /** Istante di partenza dell'orologio finto (ISO). */
  now?: string;
  questions?: DrawnQuestion[];
  challenges?: ChallengeCard[];
  /** Id delle domande a cui la scheda dell'interrogato risponde giusto. */
  sheetCorrect?: string[];
};

export type TestContext = {
  ctx: EngineContext;
  /** Valori richiesti a `randomInt`, in ordine. */
  randomCalls: number[];
  drawQuestionCalls: DrawQuestionRequest[];
  drawChallengeCalls: DrawChallengeRequest[];
  multipleChoiceCalls: MultipleChoiceRequest[];
  /** Sostituisce gli id delle domande a cui la scheda risponde giusto. */
  setSheetCorrect: (ids: string[]) => void;
  /** Sostituisce la sequenza di valori di `randomInt`. */
  setRandom: (values: number[]) => void;
  /** Sposta avanti l'orologio finto. */
  advanceSeconds: (seconds: number) => void;
  /** Data corrente del contesto finto. */
  now: () => Date;
};

export function createTestContext(options: TestContextOptions = {}): TestContext {
  const questions = options.questions ?? DEFAULT_QUESTIONS;
  const challenges = options.challenges ?? DEFAULT_CHALLENGES;
  let sequence = options.random && options.random.length > 0 ? options.random : [0];
  let randomIndex = 0;
  const randomCalls: number[] = [];
  let current = new Date(options.now ?? "2026-09-17T20:00:00.000Z");
  let sheetCorrect = [...(options.sheetCorrect ?? [])];

  const drawQuestionCalls: DrawQuestionRequest[] = [];
  const drawChallengeCalls: DrawChallengeRequest[] = [];
  const multipleChoiceCalls: MultipleChoiceRequest[] = [];

  const ctx: EngineContext = {
    randomInt: (max: number) => {
      randomCalls.push(max);
      const value = sequence[randomIndex % sequence.length];
      randomIndex += 1;
      return value % max;
    },
    now: () => new Date(current),
    board: options.board ?? testBoard(),
    settings: { ...DEFAULT_SETTINGS, ...options.settings },
    drawQuestion: (req) => {
      drawQuestionCalls.push({ ...req });
      // "Quanto mi conosci" = scelta multipla o risposta breve; l'altra metà sono le aperte.
      const wanted = (q: DrawnQuestion) => (req.knowMeOnly ? q.kind !== "open" : q.kind === "open");
      const found =
        questions.find((q) => q.category === req.category && wanted(q)) ??
        questions.find(wanted) ??
        questions.find((q) => q.category === req.category) ??
        questions[0];
      if (!found) throw new Error("Contesto di prova senza domande.");
      return found;
    },
    drawChallenge: (req) => {
      drawChallengeCalls.push({ ...req });
      const found = challenges.find((c) => c.snakeFlash === req.snakeFlash);
      if (!found) {
        throw new Error(`Contesto di prova senza sfide con snakeFlash=${req.snakeFlash}.`);
      }
      return found;
    },
    checkMultipleChoice: (req) => {
      multipleChoiceCalls.push({ ...req });
      return sheetCorrect.includes(req.questionId);
    },
  };

  return {
    ctx,
    randomCalls,
    drawQuestionCalls,
    drawChallengeCalls,
    multipleChoiceCalls,
    setSheetCorrect: (ids) => {
      sheetCorrect = [...ids];
    },
    setRandom: (values) => {
      sequence = values.length > 0 ? values : [0];
      randomIndex = 0;
    },
    advanceSeconds: (seconds) => {
      current = new Date(current.getTime() + seconds * 1000);
    },
    now: () => new Date(current),
  };
}

// ---------------------------------------------------------------------------
// Partita di prova
// ---------------------------------------------------------------------------

export type TestGame = {
  /** Contesto finto dato al reducer. */
  ctx: EngineContext;
  /** Strumenti del contesto (chiamate registrate, orologio, RNG). */
  test: TestContext;
  /** Stato corrente: si aggiorna a ogni azione accettata. */
  state: GameState;
  /** Tutti gli eventi restituiti finora. */
  events: GameEvent[];
  /** Esegue l'azione; lancia se il motore la rifiuta. */
  do: (action: Action) => GameEvent[];
  /** Esegue l'azione aspettandosi un rifiuto; ritorna il messaggio d'errore. */
  reject: (action: Action) => string;
  /** Azione accettata? (senza lanciare) */
  accepts: (action: Action) => boolean;
  /** Sposta un giocatore senza passare dalle regole (scorciatoia dei test). */
  place: (seat: Seat, cell: CellNumber, coins?: number) => void;
  /** Modifica diretta dello stato (scorciatoia dei test). */
  edit: (change: (state: GameState) => void) => void;
  /** Eventi dell'ultima azione. */
  last: () => GameEvent[];
};

export function createTestGame(options: TestContextOptions & { firstSeat?: Seat } = {}): TestGame {
  const test = createTestContext(options);
  const game: TestGame = {
    ctx: test.ctx,
    test,
    state: createInitialState({ ...DEFAULT_SETTINGS, ...options.settings }, options.firstSeat ?? 1),
    events: [],
    do: (action) => {
      const result = reduce(game.state, action, test.ctx);
      if (!result.ok) throw new Error(`Azione ${action.type} rifiutata: ${result.error}`);
      game.state = result.state;
      game.events.push(...result.events);
      return result.events;
    },
    reject: (action) => {
      const result = reduce(game.state, action, test.ctx);
      if (result.ok) throw new Error(`Azione ${action.type} accettata ma doveva essere rifiutata.`);
      return result.error;
    },
    accepts: (action) => reduce(game.state, action, test.ctx).ok,
    place: (seat, cell, coins) => {
      game.state.players[seat].position = cell;
      if (coins !== undefined) game.state.players[seat].coins = coins;
    },
    edit: (change) => {
      change(game.state);
    },
    last: () => game.events.slice(-1),
  };
  return game;
}
