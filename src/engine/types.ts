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

export type EventCardId =
  "tailwind" | "wrong_path" | "gift" | "treasure" | "sudden_snake" | "lucky_ladder" | "snack_break";

export type ChallengeCategory = "builtin" | "videocall" | "external" | "emulator";

/** duel = giocano entrambi; trial = gioca solo il giocatore attivo, l'altro giudica. */
export type ChallengeMode = "duel" | "trial";

/** automatic = minigioco integrato; double_confirm = entrambi dichiarano; judge = l'altro valuta. */
export type ChallengeVerdict = "automatic" | "double_confirm" | "judge";

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
      /** Vero se la casella è anche base di una scala (una domanda vale per entrambe). */
      forLadder: boolean;
      /** Per le risposte brevi: risposta data, in attesa di giudizio. */
      givenAnswer: string | null;
    }
  | {
      type: "challenge";
      challengeId: string;
      /** Sfida lampo del serpente (30 s). */
      snakeFlash: boolean;
      /** ISO timestamp di scadenza, deciso dal server. */
      deadlineAt: string | null;
      /** Dichiarazioni per la doppia conferma (o verdetto del giudice). */
      claims: Partial<Record<Seat, Seat | "draw">>;
      /** Vero se le dichiarazioni della doppia conferma non coincidono. */
      disputed: boolean;
      /** Stato del minigioco integrato (forma definita dal modulo del minigioco). */
      minigame: unknown;
    }
  | { type: "event"; eventId: EventCardId }
  | { type: "star_offer" }
  | { type: "item_overflow"; incoming: ItemId };

export type Phase =
  | "pre_roll" // compra/usa oggetti, poi tira
  | "resolving" // c'è una carta attiva da risolvere
  | "finished";

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
};

// ---------------------------------------------------------------------------
// Azioni
// ---------------------------------------------------------------------------

export type Action =
  | { type: "BUY_ITEM"; seat: Seat; item: ItemId }
  | { type: "USE_ITEM"; seat: Seat; item: ItemId; loadedDieValue?: number }
  | { type: "ROLL"; seat: Seat }
  | { type: "ANSWER_QUESTION"; seat: Seat; answer: string }
  | { type: "JUDGE_ANSWER"; seat: Seat; verdict: "correct" | "almost" | "wrong" }
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

/** Evento registrato in `game_events`, usato per il diario e per le animazioni. */
export type GameEvent = {
  type: string;
  seat: Seat | null;
  payload: Record<string, unknown>;
};

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
  drawQuestion: (req: { category: QuestionCategory; maxLevel: QuestionLevel; knowMeOnly: boolean }) => {
    id: string;
    kind: QuestionKind;
  };
  /** Pesca una sfida compatibile con i filtri della serata. */
  drawChallenge: (req: { snakeFlash: boolean }) => { id: string };
  /** Verdetto automatico per le domande a scelta multipla (legge la scheda lato server). */
  checkMultipleChoice: (req: { questionId: string; aboutSeat: Seat; answer: string }) => boolean;
};

export type ReduceResult = { ok: true; state: GameState; events: GameEvent[] } | { ok: false; error: string };
