import "server-only";

import { randomInt as cryptoRandomInt } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type BoardLayout,
  type ChallengeCard,
  type DrawnQuestion,
  type EngineContext,
  type GameSettings,
  type GameState,
  type MinigameId,
  type PawnId,
  type PlayerColor,
  type QuestionCategory,
  type QuestionLevel,
  type QuizItem,
  type Seat,
} from "@/engine";
import {
  asDrawnQuestion,
  drawAttempts,
  fallbackCategories,
  selectChallenge,
  selectQuestion,
  type QuestionCandidate,
  type UsedQuestionsReset,
} from "./question-draw";

/**
 * `EngineContext` costruito dai dati veri (F2-01, e F3-01 per la pesca).
 *
 * Il reducer è **sincrono**: il contesto non può andare al database mentre gira. Per questo
 * qui si carica tutto prima (catalogo, schede, registro delle domande usate, sfide già
 * uscite) e si costruiscono le funzioni che rispondono da memoria. Quello che va **scritto**
 * dopo il `reduce` (le domande pescate, l'azzeramento del registro) esce da
 * `buildEngineContext` e lo salva `apply-action.ts`, nella stessa transazione dell'azione.
 */

/** Stato della serata (`games.status`). */
export type GameStatus = "lobby" | "sheets" | "playing" | "finished" | "abandoned";

/** Riga di `games` che serve al server. */
export type GameRow = {
  id: string;
  room_id: string;
  status: GameStatus;
  settings: unknown;
  state: unknown;
  version: number;
};

const gameStateSchema = z.object({
  version: z.number().int(),
  round: z.number().int(),
  turn: z.union([z.literal(1), z.literal(2)]),
  firstSeat: z.union([z.literal(1), z.literal(2)]),
  phase: z.enum(["pre_roll", "resolving", "finished"]),
  winner: z.union([z.literal(1), z.literal(2), z.literal("draw")]).nullable(),
});

/**
 * Controlla che lo stato salvato abbia i campi che il server usa per decidere (versione,
 * turno, fase) e restituisce **l'oggetto originale**: la forma completa è del motore, e una
 * copia filtrata da Zod perderebbe i campi che il reducer conosce.
 */
export function parseGameState(value: unknown): GameState {
  const result = gameStateSchema.safeParse(value);
  if (!result.success) {
    throw new Error("Lo stato della partita salvato non ha la forma attesa (versione, turno, fase).");
  }
  return value as GameState;
}

const settingsSchema = z.object({
  boardId: z.string().min(1),
  challengeCategories: z.array(z.enum(["builtin", "videocall", "external", "emulator"])).min(1),
  maxChallengeSeconds: z.number().int().positive(),
  stake: z.string(),
  pawns: z.object({ 1: z.string(), 2: z.string() }),
  colors: z.object({ 1: z.string(), 2: z.string() }),
});

/** Impostazioni della serata, con i valori di partenza se la lobby non li ha ancora scritti. */
export function parseSettings(value: unknown, fallbackBoardId: string): GameSettings {
  const result = settingsSchema.safeParse(value);
  const input = result.success ? result.data : null;
  return {
    boardId: input?.boardId ?? fallbackBoardId,
    challengeCategories: input?.challengeCategories ?? ["builtin", "videocall", "external"],
    maxChallengeSeconds: input?.maxChallengeSeconds ?? 300,
    stake: input?.stake ?? "",
    pawns: (input?.pawns ?? { 1: "fox", 2: "rabbit" }) as Record<Seat, PawnId>,
    colors: (input?.colors ?? { 1: "red", 2: "blue" }) as Record<Seat, PlayerColor>,
  };
}

type QueryResult = { data: unknown; error: { message: string } | null };

/** Errore esplicito: una query rotta non deve diventare uno stato di gioco sbagliato. */
function assertOk(result: QueryResult, what: string): unknown {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

/** La partita aperta della stanza (una sola per volta: indice univoco parziale). */
export async function loadOpenGame(admin: SupabaseClient, roomId: string): Promise<GameRow | null> {
  const result = await admin
    .from("games")
    .select("id, room_id, status, settings, state, version")
    .eq("room_id", roomId)
    .in("status", ["lobby", "sheets", "playing"])
    .maybeSingle();
  const row = assertOk(result, "Lettura della partita") as GameRow | null;
  return row;
}

/** Qualsiasi partita, anche conclusa (diario e archivio). */
export async function loadGameById(admin: SupabaseClient, gameId: string): Promise<GameRow | null> {
  const result = await admin
    .from("games")
    .select("id, room_id, status, settings, state, version")
    .eq("id", gameId)
    .maybeSingle();
  return assertOk(result, "Lettura della partita") as GameRow | null;
}

/** Stanze e posti, per il diario e per l'archivio. */
export async function loadPlayers(
  admin: SupabaseClient,
  roomId: string,
): Promise<{ id: string; seat: Seat; display_name: string; pawn: string; color: string }[]> {
  const result = await admin
    .from("players")
    .select("id, seat, display_name, pawn, color")
    .eq("room_id", roomId)
    .order("seat");
  return assertOk(result, "Lettura dei posti") as {
    id: string;
    seat: Seat;
    display_name: string;
    pawn: string;
    color: string;
  }[];
}

/** Catalogo delle domande attive. */
async function loadQuestions(admin: SupabaseClient): Promise<QuestionCandidate[]> {
  const result = await admin.from("questions").select("id, category, level, kind").eq("active", true);
  return assertOk(result, "Lettura delle domande") as QuestionCandidate[];
}

/** Sfide attive delle categorie della serata, riportate alla forma che il motore conosce. */
export async function loadChallenges(admin: SupabaseClient, categories: string[]): Promise<ChallengeCard[]> {
  const result = await admin
    .from("challenges")
    .select("id, data")
    .eq("active", true)
    .in("data->>category", categories.length > 0 ? categories : ["builtin", "videocall", "external"]);
  const rows = assertOk(result, "Lettura delle sfide") as { id: string; data: Record<string, unknown> }[];
  return rows.map((row) => ({
    id: row.id,
    mode: row.data.mode as ChallengeCard["mode"],
    verdict: row.data.verdict as ChallengeCard["verdict"],
    prize: Number(row.data.prize ?? 0),
    durationSeconds: (row.data.durationSeconds as { min: number; max: number } | undefined) ?? {
      min: 60,
      max: 300,
    },
    snakeFlash: row.data.snakeFlash === true,
    minigame: (row.data.minigame as MinigameId | undefined) ?? null,
    // Le domande del quiz-lampo vivono nel `data` della carta (contenuto pubblico, non la scheda).
    quiz: Array.isArray(row.data.quiz) ? (row.data.quiz as QuizItem[]) : null,
  }));
}

/** Disposizione scelta in lobby. */
export async function loadBoard(admin: SupabaseClient, boardId: string): Promise<BoardLayout> {
  const result = await admin.from("boards").select("layout").eq("id", boardId).maybeSingle();
  const row = assertOk(result, "Lettura del tabellone") as { layout: BoardLayout } | null;
  if (!row) throw new Error(`Il tabellone \`${boardId}\` non è nel database: manca il seed dei contenuti.`);
  return row.layout;
}

/** Sfide già pescate in questa partita, lette dal registro degli eventi. */
export async function loadUsedChallenges(admin: SupabaseClient, gameId: string): Promise<string[]> {
  const result = await admin
    .from("game_events")
    .select("payload")
    .eq("game_id", gameId)
    .eq("type", "CHALLENGE_DRAWN");
  const rows = assertOk(result, "Lettura degli eventi") as { payload: { challengeId?: string } }[];
  return rows.map((row) => row.payload.challengeId).filter((id): id is string => typeof id === "string");
}

export type BuildContextInput = {
  admin: SupabaseClient;
  game: GameRow;
  /** Giocatore di turno: è lui che pesca e risponde. */
  seat: Seat;
};

export type BuiltContext = {
  ctx: EngineContext;
  /** Domande uscite in questa richiesta: da registrare dopo il `reduce`. */
  drawn: { questionId: string; seat: Seat | null }[];
  /** Sottoinsiemi a mazzo esaurito: le loro righe di `used_questions` vanno cancellate. */
  resets: UsedQuestionsReset[];
};

type AnswerRow = { player_id: string; question_id: string; answer: string };

/** Costruisce il contesto con cui far girare il reducer. */
export async function buildEngineContext({ admin, game, seat }: BuildContextInput): Promise<BuiltContext> {
  const otherSeat: Seat = seat === 1 ? 2 : 1;
  const settings = parseSettings(game.settings, "classic");
  const [board, questions, challenges, usedQuestions, players] = await Promise.all([
    loadBoard(admin, settings.boardId),
    loadQuestions(admin),
    loadChallenges(admin, settings.challengeCategories),
    admin
      .from("used_questions")
      .select("question_id, seat")
      .eq("room_id", game.room_id)
      .then(
        (result) =>
          assertOk(result, "Lettura delle domande usate") as { question_id: string; seat: number | null }[],
      ),
    loadPlayers(admin, game.room_id),
  ]);

  const playerBySeat = new Map(players.map((player) => [player.seat, player]));
  const usedChallenges = new Set(await loadUsedChallenges(admin, game.id));
  const drawn: BuiltContext["drawn"] = [];
  const resets: UsedQuestionsReset[] = [];

  // Registro delle domande: per posto per le "quanto mi conosci", righe con `seat` nullo per le aperte.
  const usedBySeat = new Set(usedQuestions.filter((row) => row.seat === seat).map((row) => row.question_id));
  const usedOpen = new Set(usedQuestions.filter((row) => row.seat === null).map((row) => row.question_id));

  // Schede dei due posti: servono al verdetto automatico e a sapere quali domande sono pescabili.
  const sheetAnswers = new Map<Seat, Map<string, string>>([
    [1, new Map()],
    [2, new Map()],
  ]);
  const playerIdToSeat = new Map(players.map((player) => [player.id, player.seat]));
  const answersResult = await admin
    .from("sheet_answers")
    .select("player_id, question_id, answer")
    .in(
      "player_id",
      players.map((player) => player.id),
    );
  for (const row of assertOk(answersResult, "Lettura delle schede") as AnswerRow[]) {
    const answerSeat = playerIdToSeat.get(row.player_id);
    if (answerSeat) sheetAnswers.get(answerSeat)?.set(row.question_id, row.answer);
  }
  // Le "quanto mi conosci" sono pescabili solo se l'interrogato ha risposto nella sua scheda (D-28).
  const answerable = [...(sheetAnswers.get(otherSeat)?.keys() ?? [])];

  if (!playerBySeat.get(seat) || !playerBySeat.get(otherSeat)) {
    throw new Error("La stanza non ha i due posti: rifai `pnpm room:create`.");
  }

  const randomInt = (max: number): number => cryptoRandomInt(max);

  /** Le `short` di una categoria si possono giudicare senza scheda: le giudica l'interrogato. */
  const shortIds = questions.filter((question) => question.kind === "short").map((question) => question.id);

  const drawQuestion = (req: {
    category: QuestionCategory;
    maxLevel: QuestionLevel;
    knowMeOnly: boolean;
  }): DrawnQuestion => {
    /**
     * Un tentativo su tutte le categorie: quella della casella e poi le altre, perché la
     * categoria della casella può essere esaurita (D-30). Il registro delle domande già
     * uscite è quello del sottoinsieme provato: per posto le "quanto mi conosci", per coppia
     * le aperte.
     */
    const tryAll = (knowMeOnly: boolean, answerableIds: readonly string[]): DrawnQuestion | null => {
      const register = knowMeOnly ? usedBySeat : usedOpen;
      for (const category of [req.category, ...fallbackCategories(req.category)]) {
        const result = selectQuestion({
          candidates: questions,
          category,
          maxLevel: req.maxLevel,
          knowMeOnly,
          used: [...register],
          answerable: answerableIds,
          randomInt,
        });
        if (!result.ok) continue;

        if (result.exhausted) {
          resets.push({ roomId: game.room_id, seat: knowMeOnly ? seat : null });
          register.clear();
        }
        register.add(result.question.id);
        drawn.push({ questionId: result.question.id, seat: knowMeOnly ? seat : null });
        return asDrawnQuestion(result.question);
      }
      return null;
    };

    // L'ordine dei tentativi è una regola pura (D-58): la richiesta del motore e, se non c'è
    // niente di pescabile, i due ripieghi. Serve davvero con «Gioca lo stesso» e le schede
    // vuote (D-28), dove prima una casella "quanto mi conosci" fermava il turno con un errore.
    for (const attempt of drawAttempts({ knowMeOnly: req.knowMeOnly, answerable, shortIds })) {
      const question = tryAll(attempt.knowMeOnly, attempt.answerable);
      if (question) return question;
    }

    throw new Error(
      "Nessuna domanda pescabile: controlla che i contenuti siano nel database (`pnpm db:reset`).",
    );
  };

  const drawChallenge = (req: { snakeFlash: boolean }): ChallengeCard => {
    // Le categorie della serata le ha già applicate `loadChallenges`; qui resta il tipo di sfida.
    const result = selectChallenge({
      candidates: challenges,
      snakeFlash: req.snakeFlash,
      used: [...usedChallenges],
      randomInt,
    });
    if (!result.ok) throw new Error(result.error);
    usedChallenges.add(result.challenge.id);
    return result.challenge;
  };

  const ctx: EngineContext = {
    randomInt,
    now: () => new Date(),
    board,
    settings,
    drawQuestion,
    drawChallenge,
    checkMultipleChoice: ({ questionId, aboutSeat, answer }) =>
      sheetAnswers.get(aboutSeat)?.get(questionId) === answer,
  };

  return { ctx, drawn, resets };
}
