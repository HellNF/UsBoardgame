import { classic } from "@/content/boards/classic";
import { challenges } from "@/content/challenges";
import { questions } from "@/content/questions";
import type { ChallengeContent } from "@/content/schema";
import {
  RULES,
  type BoardLayout,
  type ChallengeCard,
  type DrawnQuestion,
  type EngineContext,
  type GameSettings,
  type MinigameId,
  type QuestionCategory,
  type Seat,
} from "@/engine";

/**
 * Contesto **solo per lo sviluppo** (pagine `/dev/*`): fa girare il motore nel browser
 * con contenuti veri (le domande di esempio di `src/content/questions`) e dati finti al
 * posto di Supabase. In produzione queste pagine rispondono 404 (docs/decisions.md D-43).
 *
 * Differenze rispetto a una partita vera, tutte dichiarate:
 * - la scheda di prova risponde con la **prima opzione** di ogni domanda a scelta multipla;
 * - il caso è un generatore deterministico da seme, non il server;
 * - l'orologio è quello del browser.
 */

const ITEM_IDS: readonly MinigameId[] = ["tic-tac-toe", "connect-four", "memory"];

/**
 * Sfide di prova per i minigiochi: nel mazzo di `main` c'è solo il tris, quindi la hot
 * seat se ne porta dietro due in più per poter provare forza 4 e memory. Non entrano in
 * `src/content`: i minigiochi arrivano nel mazzo vero con il pacchetto B.
 */
export const HOTSEAT_CHALLENGE_CONTENT: ChallengeContent[] = [
  {
    id: "dev-forza-4",
    name: "Forza 4 (prova della hot seat)",
    category: "builtin",
    mode: "duel",
    verdict: "automatic",
    durationSeconds: { min: 90, max: 240 },
    instructions: "Quattro pedine in fila. Pareggio: si rigioca.",
    prize: 3,
    snakeFlash: false,
    minigame: "connect-four",
  },
  {
    id: "dev-memory",
    name: "Memory (prova della hot seat)",
    category: "builtin",
    mode: "duel",
    verdict: "automatic",
    durationSeconds: { min: 90, max: 240 },
    instructions: "Dodici carte, sei coppie: chi ne trova di più vince.",
    prize: 3,
    snakeFlash: false,
    minigame: "memory",
  },
];

/** Mazzo di sfide della hot seat: contenuti veri + le due sfide di prova. */
export const HOTSEAT_CHALLENGES: ChallengeCard[] = [
  ...challenges.map((challenge) => ({
    id: challenge.id,
    mode: challenge.mode,
    verdict: challenge.verdict,
    prize: challenge.prize,
    durationSeconds: challenge.durationSeconds,
    snakeFlash: challenge.snakeFlash,
    minigame: (challenge.minigame as MinigameId | undefined) ?? null,
    quiz: challenge.quiz ?? null,
  })),
  ...HOTSEAT_CHALLENGE_CONTENT.map((challenge) => ({
    id: challenge.id,
    mode: challenge.mode,
    verdict: challenge.verdict,
    prize: challenge.prize,
    durationSeconds: challenge.durationSeconds,
    snakeFlash: challenge.snakeFlash,
    minigame: (challenge.minigame as MinigameId | undefined) ?? null,
    quiz: challenge.quiz ?? null,
  })),
];

export const HOTSEAT_SETTINGS: GameSettings = {
  boardId: classic.id,
  challengeCategories: ["builtin", "videocall", "external"],
  maxChallengeSeconds: 300,
  stake: "chi perde prepara la colazione",
  pawns: { 1: "fox", 2: "rabbit" },
  colors: { 1: "red", 2: "blue" },
};

/** Generatore congruenziale: stesso seme, stessa partita (comodo per le prove a occhio). */
function seededRandom(seed: number): () => number {
  let state = (seed * 2654435761) % 2147483648;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state;
  };
}

/**
 * Scheda di prova: la risposta della scheda è la prima opzione di ogni domanda a scelta
 * multipla. Serve solo a far girare la partita in hot seat: le schede vere arrivano da
 * Supabase (task F3-02).
 */
function devSheet(): Map<string, string> {
  const answers = new Map<string, string>();
  for (const question of questions) {
    const first = question.kind === "multiple" ? question.options?.[0] : undefined;
    if (first) answers.set(question.id, first);
  }
  return answers;
}

export type HotseatContextOptions = {
  /** Seme del caso: la stessa partita si ripete. */
  seed?: number;
  board?: BoardLayout;
  settings?: Partial<GameSettings>;
  /** Domande da pescare (default: quelle di esempio del repo). */
  deck?: typeof questions;
};

export function createHotseatContext(options: HotseatContextOptions = {}): EngineContext {
  const board = options.board ?? classic;
  const deck = options.deck ?? questions;
  const settings: GameSettings = { ...HOTSEAT_SETTINGS, ...options.settings, boardId: board.id };
  const next = seededRandom(options.seed ?? 1);
  const sheet = devSheet();
  const usedQuestions = new Set<string>();
  const usedChallenges = new Set<string>();

  const pick = <T>(items: T[], used: Set<string>, key: (item: T) => string): T => {
    if (items.length === 0) throw new Error("Mazzo finito: nessun contenuto disponibile.");
    const fresh = items.filter((item) => !used.has(key(item)));
    const pool = fresh.length > 0 ? fresh : items;
    const chosen = pool[next() % pool.length];
    used.add(key(chosen));
    return chosen;
  };

  return {
    randomInt: (max: number) => next() % max,
    now: () => new Date(),
    board,
    settings,
    drawQuestion: (req: {
      category: QuestionCategory;
      maxLevel: number;
      knowMeOnly: boolean;
    }): DrawnQuestion => {
      const wanted = (question: (typeof questions)[number]) =>
        question.category === req.category &&
        question.level <= req.maxLevel &&
        (req.knowMeOnly ? question.kind !== "open" : question.kind === "open");
      const byCategory = deck.filter(wanted);
      const fallback = deck.filter(
        (question) =>
          question.level <= req.maxLevel &&
          (req.knowMeOnly ? question.kind !== "open" : question.kind === "open"),
      );
      const pool = byCategory.length > 0 ? byCategory : fallback;
      const chosen = pick(pool.length > 0 ? pool : deck, usedQuestions, (question) => question.id);
      return { id: chosen.id, kind: chosen.kind, category: chosen.category };
    },
    drawChallenge: (req: { snakeFlash: boolean }) => {
      const pool = HOTSEAT_CHALLENGES.filter((challenge) => challenge.snakeFlash === req.snakeFlash);
      return pick(pool.length > 0 ? pool : HOTSEAT_CHALLENGES, usedChallenges, (challenge) => challenge.id);
    },
    checkMultipleChoice: (req: { questionId: string; aboutSeat: Seat; answer: string }) =>
      sheet.get(req.questionId) === req.answer,
  };
}

/** Mazzo dei minigiochi disponibili in hot seat (per i controlli dei test e della pagina). */
export const HOTSEAT_MINIGAMES = ITEM_IDS;

/** Riepilogo per la barra di prova della pagina: cosa manca rispetto a una partita vera. */
export const HOTSEAT_NOTES = [
  "Scheda di prova: le risposte giuste sono la prima opzione di ogni domanda.",
  `Round massimi: ${RULES.maxRounds}. Sfide lampo: ${RULES.challenges.snakeFlashSeconds} secondi.`,
  "Nessun salvataggio: ricaricando la pagina la partita riparte.",
];
