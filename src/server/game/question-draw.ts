import type { ChallengeCard, DrawnQuestion, QuestionCategory, QuestionKind, QuestionLevel } from "@/engine";

/**
 * Pesca delle domande e delle sfide (F3-01, parte pura).
 *
 * Il motore non conosce i contenuti: chiede a `EngineContext` un id e riceve
 * `{ id, kind, category }`. Qui c'è la **scelta**, senza database e senza I/O: gli
 * adattatori in `src/server/game/context.ts` caricano i candidati e chiamano queste funzioni.
 *
 * Regole che vengono da qui (docs/rules.md § Domande, D-09, D-28, D-29):
 *  - si pesca nella categoria richiesta e sotto il livello massimo della casella;
 *  - le "quanto mi conosci" richiedono una risposta nella scheda dell'interrogato;
 *  - una domanda già uscita non riesce finché il sottoinsieme non è esaurito, e allora il
 *    registro si azzera (`exhausted: true`: l'adattatore cancella le righe e ripesca).
 */

export type QuestionCandidate = {
  id: string;
  category: QuestionCategory;
  level: QuestionLevel;
  kind: QuestionKind;
};

export type SelectQuestionInput = {
  /** Tutte le domande attive del catalogo (l'adattatore le ha già lette). */
  candidates: readonly QuestionCandidate[];
  /** Categoria della casella. */
  category: QuestionCategory;
  /** Livello massimo ammesso per la categoria "profonde" (D-09). */
  maxLevel: QuestionLevel;
  /** Vero per una "quanto mi conosci", falso per una domanda aperta. */
  knowMeOnly: boolean;
  /** Id già usciti per questo sottoinsieme (registro di stanza + posto). */
  used: readonly string[];
  /** Id per cui l'interrogato ha una risposta in scheda. */
  answerable: readonly string[];
  /** Intero in [0, max): lo fornisce il server. */
  randomInt: (max: number) => number;
};

export type SelectQuestionResult =
  { ok: true; question: QuestionCandidate; exhausted: boolean } | { ok: false; error: string };

/** Vero se la domanda è del tipo giusto per la richiesta. */
export function matchesKind(question: QuestionCandidate, knowMeOnly: boolean): boolean {
  return knowMeOnly ? question.kind !== "open" : question.kind === "open";
}

/**
 * Sceglie una domanda fra i candidati.
 * `exhausted: true` significa che il sottoinsieme era finito e il registro va azzerato
 * (l'adattatore lo fa, poi la domanda pescata è comunque valida).
 */
export function selectQuestion(input: SelectQuestionInput): SelectQuestionResult {
  const inCategory = input.candidates.filter(
    (question) => question.category === input.category && question.level <= input.maxLevel,
  );
  // Le profonde sono l'unica categoria filtrata per livello (D-09): se il livello chiesto non
  // ha domande, si pesca da quelli sotto — è ciò che fa il filtro `level <= maxLevel`.
  const pool = inCategory.filter((question) => matchesKind(question, input.knowMeOnly));

  if (pool.length === 0) return { ok: false, error: `Nessuna domanda in categoria ${input.category}.` };

  const sheetRequired = input.knowMeOnly;
  const withAnswer = pool.filter((question) => !sheetRequired || input.answerable.includes(question.id));
  if (withAnswer.length === 0)
    return { ok: false, error: `Nessuna domanda con risposta in scheda per ${input.category}.` };

  const used = new Set(input.used);
  const fresh = withAnswer.filter((question) => !used.has(question.id));
  const exhausted = fresh.length === 0;
  const from = exhausted ? withAnswer : fresh;

  const index = Math.abs(input.randomInt(from.length)) % from.length;
  return { ok: true, question: from[index], exhausted };
}

/** Categoria di ripiego quando quella della casella non ha domande pescabili (D-30). */
export function fallbackCategories(preferred: QuestionCategory): QuestionCategory[] {
  const all: QuestionCategory[] = ["tastes", "memories", "future", "deep", "funny"];
  return all.filter((category) => category !== preferred);
}

/** Righe che il registro di `used_questions` deve cancellare per azzerare un sottoinsieme. */
export type UsedQuestionsReset = { roomId: string; seat: number | null };

export type SelectChallengeInput = {
  /** Sfide attive, già filtrate per le categorie della serata. */
  candidates: readonly ChallengeCard[];
  /** Vero per la sfida lampo del serpente. */
  snakeFlash: boolean;
  used: readonly string[];
  randomInt: (max: number) => number;
};

export type SelectChallengeResult =
  { ok: true; challenge: ChallengeCard; exhausted: boolean } | { ok: false; error: string };

/** Sceglie una sfida: solo quelle del tipo richiesto (lampo o normale). */
export function selectChallenge(input: SelectChallengeInput): SelectChallengeResult {
  const pool = input.candidates.filter((challenge) => challenge.snakeFlash === input.snakeFlash);
  if (pool.length === 0) return { ok: false, error: "Nessuna sfida disponibile con questi filtri." };

  const used = new Set(input.used);
  const fresh = pool.filter((challenge) => !used.has(challenge.id));
  const exhausted = fresh.length === 0;
  const from = exhausted ? pool : fresh;

  const index = Math.abs(input.randomInt(from.length)) % from.length;
  return { ok: true, challenge: from[index], exhausted };
}

/** Domanda pescata, nella forma che il motore si aspetta. */
export const asDrawnQuestion = (question: QuestionCandidate): DrawnQuestion => ({
  id: question.id,
  kind: question.kind,
  category: question.category,
});
