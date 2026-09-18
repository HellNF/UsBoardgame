import type { MinigameId, MinigameState, QuizItem } from "./minigames/types";

/**
 * Contratto del motore di gioco.
 *
 * Il motore è puro: nessun import da React, Next.js o Supabase.
 * Regole canoniche: docs/rules.md. Decisioni: docs/decisions.md.
 */

// ---------------------------------------------------------------------------
// Identità
// ---------------------------------------------------------------------------

/** Posto fisso nella stanza (la coppia ha sempre due posti). */
export type Seat = 1 | 2;

export const SEATS: readonly Seat[] = [1, 2];

export const otherSeat = (seat: Seat): Seat => (seat === 1 ? 2 : 1);

/** Numero di casella, da 1 a 100. */
export type CellNumber = number;

// ---------------------------------------------------------------------------
// Tabellone
// ---------------------------------------------------------------------------

export type CellKind =
  | "question" // Domanda: bianca con illustrazione
  | "challenge" // Sfida: nera piena
  | "event" // Imprevisto: metà nera in diagonale
  | "coins" // Monete: cerchio pieno (+3) o vuoto (−2)
  | "star" // Stella: illustrazione di stella
  | "free" // Libera: bianca vuota
  | "start" // Casella 1
  | "finish"; // Casella 100

export type QuestionCategory = "tastes" | "memories" | "future" | "deep" | "funny";

/** Ordine stabile delle categorie: il motore lo usa per le scelte "a caso". */
export const QUESTION_CATEGORIES: readonly QuestionCategory[] = [
  "tastes",
  "memories",
  "future",
  "deep",
  "funny",
];

/** Id di un'illustrazione SVG (vedi src/art/illustrations). */
export type IllustrationId = string;

export type Cell =
  | { n: CellNumber; kind: "question"; category: QuestionCategory; illustration: IllustrationId }
  | { n: CellNumber; kind: "coins"; sign: "gain" | "loss" }
  | { n: CellNumber; kind: "star"; illustration: IllustrationId }
  | { n: CellNumber; kind: "challenge" | "event" | "free" | "start" | "finish" };

/** Scala: da `from` (base) a `to` (cima), `to > from`. */
export type Ladder = { from: CellNumber; to: CellNumber };

/** Serpente: da `from` (testa) a `to` (coda), `to < from`. */
export type Snake = { from: CellNumber; to: CellNumber };

/**
 * Forme geometriche decorative che occupano più celle (cerchi, semicerchi,
 * diagonali). Solo grafica: l'effetto della casella dipende da `Cell.kind`.
 */
export type BoardDecoration = {
  shape: "circle" | "half-circle" | "diagonal" | "filled";
  /** Celle coperte dalla forma. */
  cells: CellNumber[];
  variant?: string;
};

export type BoardLayout = {
  id: string;
  name: string;
  /** Esattamente 100 celle, indice 0 = casella 1. */
  cells: Cell[];
  ladders: Ladder[];
  snakes: Snake[];
  decorations: BoardDecoration[];
};

// ---------------------------------------------------------------------------
// Contenuti (riferimenti per id; il testo sta nel catalogo)
// ---------------------------------------------------------------------------

/** multiple = opzioni fisse nel catalogo; short = risposta breve giudicata; open = conosciamoci. */
export type QuestionKind = "multiple" | "short" | "open";

export type QuestionLevel = 1 | 2 | 3;

export type ItemId =
  "single_die" | "loaded_die" | "skip_question" | "antidote" | "portable_ladder" | "thief" | "swap";

/** Ordine stabile degli oggetti: serve alla pesca "a caso" (Tesoro) e ai test. */
export const ITEM_IDS: readonly ItemId[] = [
  "single_die",
  "loaded_die",
  "skip_question",
  "antidote",
  "portable_ladder",
  "thief",
  "swap",
];

export type EventCardId =
  "tailwind" | "wrong_path" | "gift" | "treasure" | "sudden_snake" | "lucky_ladder" | "snack_break";

export type ChallengeCategory = "builtin" | "videocall" | "external" | "emulator";

/** duel = giocano entrambi; trial = gioca solo il giocatore attivo, l'altro giudica. */
export type ChallengeMode = "duel" | "trial";

/** automatic = minigioco integrato; double_confirm = entrambi dichiarano; judge = l'altro valuta. */
export type ChallengeVerdict = "automatic" | "double_confirm" | "judge";

/** Dati della domanda pescata: il testo resta nel catalogo, qui serve solo l'identità. */
export type DrawnQuestion = {
  id: string;
  kind: QuestionKind;
  category: QuestionCategory;
};

/**
 * Dati della carta sfida pescata. Li fornisce `EngineContext.drawChallenge`
 * leggendo `src/content/challenges.ts`: il motore non importa i contenuti.
 */
export type ChallengeCard = {
  id: string;
  mode: ChallengeMode;
  verdict: ChallengeVerdict;
  /** Premio in monete per chi vince. */
  prize: number;
  durationSeconds: { min: number; max: number };
  snakeFlash: boolean;
  /** Minigioco integrato, obbligatorio quando il verdetto è `automatic`. */
  minigame: MinigameId | null;
  /** Domande del quiz-lampo (solo per il minigioco `quiz`), contenuto pubblico della carta. */
  quiz?: QuizItem[] | null;
};

// ---------------------------------------------------------------------------
// Impostazioni della serata (scelte in lobby)
// ---------------------------------------------------------------------------

export type PawnId = "fox" | "rabbit" | "cat" | "bear" | "frog" | "owl";

export type PlayerColor = "red" | "blue" | "green" | "ochre";

export type GameSettings = {
  boardId: string;
  /** Categorie di sfida attive. */
  challengeCategories: ChallengeCategory[];
  /** Durata massima di una sfida, in secondi. */
  maxChallengeSeconds: number;
  /** Posta in palio, testo libero. */
  stake: string;
  pawns: Record<Seat, PawnId>;
  colors: Record<Seat, PlayerColor>;
};

// ---------------------------------------------------------------------------
// Stato della partita
// ---------------------------------------------------------------------------

export type PlayerState = {
  seat: Seat;
  position: CellNumber;
  coins: number;
  stars: number;
  /** Massimo RULES.items.max. Antidoto e Salta domanda sono reattivi: agiscono da soli / durante la carta. */
  items: ItemId[];
  /** Turno in cui ha raggiunto la 100, se l'ha raggiunta. */
  finishedAtRound: number | null;
  stats: {
    correctAnswers: number;
    challengesWon: number;
  };
};

export type DiceRoll = {
  dice: number[];
  /** +2 se in rimonta. */
  comebackBonus: number;
  total: number;
};

/**
 * Carta attiva. Non contiene MAI la risposta corretta della scheda:
 * il verdetto automatico lo calcola il server tramite `EngineContext`.
 */
export type ActiveCard =
  | {
      type: "question";
      questionId: string;
      kind: QuestionKind;
      category: QuestionCategory;
      /** Vero se la casella è anche base di una scala (una domanda vale per entrambe). */
      forLadder: boolean;
      /** Per le risposte brevi: risposta data, in attesa di giudizio. */
      givenAnswer: string | null;
    }
  | {
      type: "challenge";
      challengeId: string;
      mode: ChallengeMode;
      verdict: ChallengeVerdict;
      /** Premio in monete per chi vince. */
      prize: number;
      /** Sfida lampo del serpente (30 s). */
      snakeFlash: boolean;
      /** ISO timestamp di scadenza, deciso dal server. */
      deadlineAt: string | null;
      /** Dichiarazioni per la doppia conferma (o verdetto del giudice). */
      claims: Partial<Record<Seat, Seat | "draw">>;
      /** Scelte di rivincita o moneta dopo un disaccordo (D-27). */
      disputeChoices: Partial<Record<Seat, "rematch" | "coin_flip">>;
      /** Vero se le dichiarazioni della doppia conferma non coincidono. */
      disputed: boolean;
      /** Id del minigioco integrato della carta, quando il verdetto è automatico. */
      minigameId: MinigameId | null;
      /** Stato del minigioco integrato (`MinigameState`), quando il verdetto è automatico. */
      minigame: MinigameState | null;
      /** Domande del quiz-lampo, quando il minigioco è il quiz (contenuto pubblico della carta). */
      quiz: QuizItem[] | null;
    }
  | { type: "event"; eventId: EventCardId }
  | { type: "star_offer" }
  | { type: "item_overflow"; incoming: ItemId };

export type Phase =
  | "pre_roll" // compra/usa oggetti, poi tira
  | "resolving" // c'è una carta attiva da risolvere
  | "finished";

/** Verdetto di una risposta: giusta, quasi (solo `short`), sbagliata. */
export type AnswerVerdict = "correct" | "almost" | "wrong";

export type GameState = {
  /** Incrementato a ogni azione accettata (concorrenza ottimistica). */
  version: number;
  round: number;
  turn: Seat;
  firstSeat: Seat;
  phase: Phase;
  players: Record<Seat, PlayerState>;
  lastRoll: DiceRoll | null;
  card: ActiveCard | null;
  /** Oggetto attivo usato in questo turno (uno solo, prima del tiro). */
  itemUsedThisTurn: ItemId | null;
  /** Dado truccato: valore scelto per un dado. */
  forcedDie: number | null;
  singleDie: boolean;
  winner: Seat | "draw" | null;
  /**
   * Casella d'arrivo del tiro in corso (null quando non c'è un movimento da
   * completare). Scala e serpente si applicano solo se il giocatore è ancora qui.
   */
  arrivalCell: CellNumber | null;
  /** Effetti di scala/serpente già applicati per l'arrivo in corso. */
  handled: { ladder: boolean; snake: boolean };
};

// ---------------------------------------------------------------------------
// Azioni
// ---------------------------------------------------------------------------

export type Action =
  | { type: "BUY_ITEM"; seat: Seat; item: ItemId }
  | { type: "USE_ITEM"; seat: Seat; item: ItemId; loadedDieValue?: number }
  | { type: "ROLL"; seat: Seat }
  | { type: "ANSWER_QUESTION"; seat: Seat; answer: string }
  | { type: "JUDGE_ANSWER"; seat: Seat; verdict: AnswerVerdict }
  | { type: "SKIP_QUESTION"; seat: Seat }
  | { type: "ACK_OPEN_QUESTION"; seat: Seat }
  | { type: "CLAIM_CHALLENGE_RESULT"; seat: Seat; winner: Seat | "draw" }
  | { type: "RESOLVE_DISPUTE"; seat: Seat; method: "rematch" | "coin_flip" }
  | { type: "MINIGAME_MOVE"; seat: Seat; move: unknown }
  | { type: "TIMER_EXPIRED"; seat: Seat }
  | { type: "BUY_STAR"; seat: Seat }
  | { type: "DECLINE_STAR"; seat: Seat }
  | { type: "ACK_EVENT"; seat: Seat }
  | { type: "DISCARD_ITEM"; seat: Seat; item: ItemId | "incoming" };

// ---------------------------------------------------------------------------
// Eventi (registro in `game_events`: diario + animazioni)
// ---------------------------------------------------------------------------

/** Motivo di uno spostamento, per il diario e per le animazioni. */
export type MoveReason =
  | "roll"
  | "ladder"
  | "snake"
  | "portable_ladder"
  | "lucky_ladder"
  | "sudden_snake"
  | "tailwind"
  | "wrong_path"
  | "swap";

/** Da dove arrivano le monete (o dove vanno, per le perdite). */
export type CoinSource =
  "cell" | "question" | "challenge" | "gift" | "thief" | "star_purchase" | "item_purchase";

export type ChallengeResultMethod = "automatic" | "double_confirm" | "judge" | "coin_flip";

/** Cosa è successo a una sfida scaduta: prova fallita o duello alla doppia conferma. */
export type TimeoutOutcome = "failed" | "double_confirm";

/**
 * Evento restituito dal reducer. Unione discriminata su `type`: descrive tutto ciò
 * che la UI deve animare o il diario deve raccontare. `seat` è il posto a cui
 * l'evento si riferisce (`null` per gli eventi della partita).
 */
export type GameEvent =
  | { type: "GAME_STARTED"; seat: null; round: number; firstSeat: Seat }
  | { type: "TURN_ENDED"; seat: Seat; round: number }
  | { type: "TURN_SKIPPED"; seat: Seat; round: number }
  | { type: "ROUND_STARTED"; seat: Seat; round: number }
  | {
      type: "ROLLED";
      seat: Seat;
      dice: number[];
      comebackBonus: number;
      total: number;
      from: CellNumber;
      to: CellNumber;
    }
  | { type: "MOVED"; seat: Seat; from: CellNumber; to: CellNumber; reason: MoveReason }
  | { type: "COINS_GAINED"; seat: Seat; amount: number; source: CoinSource; doubled: boolean }
  | { type: "COINS_LOST"; seat: Seat; amount: number; source: CoinSource }
  | { type: "ITEM_BOUGHT"; seat: Seat; item: ItemId; price: number }
  | { type: "ITEM_USED"; seat: Seat; item: ItemId; detail?: string }
  | { type: "ITEM_RECEIVED"; seat: Seat; item: ItemId }
  | { type: "ITEM_DISCARDED"; seat: Seat; item: ItemId }
  | { type: "ITEM_OVERFLOW"; seat: Seat; incoming: ItemId }
  | {
      type: "QUESTION_DRAWN";
      seat: Seat;
      questionId: string;
      kind: QuestionKind;
      category: QuestionCategory;
      forLadder: boolean;
    }
  | { type: "QUESTION_ANSWERED"; seat: Seat; questionId: string; answer: string }
  | { type: "QUESTION_JUDGED"; seat: Seat; questionId: string; verdict: AnswerVerdict }
  | { type: "QUESTION_SKIPPED"; seat: Seat; questionId: string }
  | {
      type: "CHALLENGE_DRAWN";
      seat: Seat;
      challengeId: string;
      mode: ChallengeMode;
      verdict: ChallengeVerdict;
      snakeFlash: boolean;
      deadlineAt: string | null;
    }
  | { type: "CHALLENGE_CLAIMED"; seat: Seat; challengeId: string; winner: Seat | "draw" }
  | { type: "CHALLENGE_DISPUTED"; seat: null; challengeId: string }
  | {
      type: "CHALLENGE_RESOLVED";
      /** Chi è dichiarato vincitore (in una prova: il posto a favore del quale si è deciso). */
      seat: Seat | "draw";
      challengeId: string;
      prize: number;
      method: ChallengeResultMethod;
      /**
       * Vero se la sfida è stata **vinta** da `seat`. In una prova giudicata "non riuscita" il
       * verdetto va all'altro posto ma nessuno ha vinto: senza questo campo il diario
       * raccontava una vittoria che non c'è stata (D-59).
       */
      won: boolean;
    }
  | { type: "CHALLENGE_REMATCH"; seat: null; challengeId: string; deadlineAt: string | null }
  | { type: "TIMER_EXPIRED"; seat: null; challengeId: string; outcome: TimeoutOutcome }
  | { type: "MINIGAME_STARTED"; seat: null; minigame: MinigameId }
  | { type: "MINIGAME_MOVED"; seat: Seat; minigame: MinigameId; move: unknown }
  | { type: "MINIGAME_FINISHED"; seat: null; minigame: MinigameId; winner: Seat | "draw" }
  | { type: "EVENT_DRAWN"; seat: Seat; eventId: EventCardId }
  | { type: "EVENT_RESOLVED"; seat: Seat; eventId: EventCardId; detail?: string }
  | { type: "CLIMBED_LADDER"; seat: Seat; from: CellNumber; to: CellNumber }
  | { type: "SLID_DOWN_SNAKE"; seat: Seat; from: CellNumber; to: CellNumber }
  | { type: "SNAKE_BLOCKED"; seat: Seat; cell: CellNumber; item: ItemId }
  | { type: "STAR_OFFERED"; seat: Seat; cell: CellNumber; price: number }
  | { type: "STAR_BOUGHT"; seat: Seat; price: number }
  | { type: "STAR_DECLINED"; seat: Seat }
  | { type: "FINISH_REACHED"; seat: Seat; round: number }
  | { type: "BONUS_STARS"; seat: null; knowItAll: Seat | null; champion: Seat | null }
  | { type: "GAME_FINISHED"; seat: null; winner: Seat | "draw"; reason: "finish" | "maxRounds" };

/**
 * Tutto ciò che il reducer non può calcolare da solo. Lo fornisce il server
 * (API route), così il reducer resta puro e testabile.
 */
export type EngineContext = {
  /** Ritorna un intero in [0, max). Deterministico nei test. */
  randomInt: (max: number) => number;
  now: () => Date;
  board: BoardLayout;
  settings: GameSettings;
  /** Pesca una domanda non ancora usata (gestisce livelli e mazzo esaurito). */
  drawQuestion: (req: {
    category: QuestionCategory;
    maxLevel: QuestionLevel;
    knowMeOnly: boolean;
  }) => DrawnQuestion;
  /** Pesca una sfida compatibile con i filtri della serata. */
  drawChallenge: (req: { snakeFlash: boolean }) => ChallengeCard;
  /** Verdetto automatico per le domande a scelta multipla (legge la scheda lato server). */
  checkMultipleChoice: (req: { questionId: string; aboutSeat: Seat; answer: string }) => boolean;
};

export type ReduceResult = { ok: true; state: GameState; events: GameEvent[] } | { ok: false; error: string };
