import type { ItemId, QuestionLevel } from "./types";

/**
 * Parametri di bilanciamento. Ogni numero delle regole vive qui e non nel
 * codice. Modificarli non richiede di toccare il reducer.
 * Riferimento: docs/rules.md.
 */
export const RULES = {
  board: {
    size: 10,
    cells: 100,
    ladders: 7,
    snakes: 6,
    /**
     * File (righe) massime coperte da una scala o da un serpente: |row(to) − row(from)| ≤ questo valore
     * (docs/rules.md § Tabellone). Tiene le geometrie leggibili e le scale "credibili" sul tabellone.
     */
    maxSpanRows: 5,
    /** Quantità di caselle per tipo di una disposizione valida (docs/rules.md § Tabellone). */
    cellCounts: {
      question: 35,
      challenge: 12,
      event: 10,
      coins: 10,
      star: 3,
      free: 28,
      start: 1,
      finish: 1,
    },
  },

  dice: { count: 2, faces: 6 },
  maxRounds: 25,

  comeback: { minGap: 20, bonus: 2 },
  /** Guadagni di monete raddoppiati mentre si è in queste caselle. */
  doubleCoinsFrom: 71,

  coins: {
    cellGain: 3,
    cellLoss: 2,
    multipleCorrect: 3,
    shortCorrect: 3,
    shortAlmost: 1,
    openQuestion: 1,
  },

  stars: { price: 10, finishBonus: 3, knowItAllBonus: 1, championBonus: 1 },

  questions: {
    /** Probabilità che una casella domanda peschi una "quanto mi conosci" invece di una aperta. */
    knowMeRatio: 0.6,
    /** Livello massimo delle profonde in base alla casella (vale solo per la categoria "deep"). */
    deepLevelByCell: (cell: number): QuestionLevel => (cell <= 30 ? 1 : cell <= 70 ? 2 : 3),
  },

  challenges: { snakeFlashSeconds: 30 },

  /** Minigiochi a tempo (F4-04): quiz-lampo e riflessi. */
  minigames: {
    quiz: {
      /** Domande usate in una partita di quiz-lampo (la carta ne porta cinque). */
      items: 5,
    },
    reflex: {
      /** Si gioca al meglio di: chi arriva a tre punti vince. */
      bestOf: 5,
      /** Finestra in cui può arrivare il segnale, in millisecondi. */
      minDelayMs: 1200,
      maxDelayMs: 5000,
    },
  },

  items: {
    max: 3,
    prices: {
      single_die: 3,
      loaded_die: 8,
      skip_question: 4,
      antidote: 7,
      portable_ladder: 12,
      thief: 6,
      swap: 10,
    } satisfies Record<ItemId, number>,
    thiefAmount: 5,
  },

  events: { tailwindSteps: 5, wrongPathSteps: 5, giftCoins: 3, snackBreakSeconds: 120 },
} as const;
