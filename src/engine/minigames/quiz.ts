import { otherSeat, type Seat } from "../types";
import { RULES } from "../config";
import type { MinigameModule, MinigameState, QuizItem, QuizState } from "./types";

/**
 * Quiz-lampo (F4-04, D-55): le domande della carta, a turno, una risposta ciascuno per domanda.
 * Risposta giusta = un punto; chi ne ha di più alla fine vince. Pareggio = rivincita (il
 * resolver delle sfide rimette in campo lo stesso minigioco).
 *
 * Il **contenuto** della carta è pubblico (non è la scheda: non c'è niente da nascondere),
 * quindi la risposta giusta può vivere nello stato senza svelare nulla.
 * Il tempo è quello della carta (timer deciso dal server, D-25): il modulo non decide scadenze.
 */

const maxItems = (): number => RULES.minigames.quiz.items;

const ensure = (state: MinigameState): QuizState => {
  if (state.kind !== "quiz") throw new Error("Stato di gioco non adatto al quiz.");
  return state;
};

/** Le opzioni scelte da una mossa: `{ option: 2 }` = la terza opzione. */
const optionOf = (move: unknown): number | null => {
  if (typeof move !== "object" || move === null || !("option" in move)) return null;
  const value = (move as { option: unknown }).option;
  return typeof value === "number" && Number.isInteger(value) ? value : null;
};

export const quiz: MinigameModule = {
  id: "quiz",

  init: ({ firstSeat, content }) => {
    const items = (content ?? [])
      .filter((item): item is QuizItem => Boolean(item && item.options.length > 0))
      .slice(0, maxItems());
    if (items.length === 0) {
      // La carta del quiz porta le sue domande (src/content/challenges.ts, schema Zod): senza,
      // meglio fermarsi qui che far girare un minigioco vuoto.
      throw new Error("Il quiz-lampo non ha domande: la carta non porta il campo `quiz`.");
    }
    return {
      kind: "quiz",
      items,
      index: 0,
      turn: firstSeat,
      scores: { 1: 0, 2: 0 },
      winner: null,
    };
  },

  applyMove: (rawState, seat, move) => {
    const state = ensure(rawState);
    if (state.winner !== null) return { ok: false, error: "Il quiz è già finito." };
    if (state.turn !== seat) return { ok: false, error: "Non tocca a te nel quiz." };

    const item = state.items[state.index];
    const option = optionOf(move);
    if (option === null || option < 0 || option >= item.options.length) {
      return { ok: false, error: "Risposta del quiz non valida: serve `option` fra le opzioni." };
    }

    const scores: Record<Seat, number> = { ...state.scores };
    if (option === item.correct) scores[seat] += 1;

    const index = state.index + 1;
    const finished = index >= state.items.length;
    const winner: Seat | "draw" | null = !finished
      ? null
      : scores[1] === scores[2]
        ? "draw"
        : scores[1] > scores[2]
          ? 1
          : 2;

    return {
      ok: true,
      state: {
        ...state,
        index: finished ? state.index : index,
        scores,
        turn: otherSeat(seat),
        winner,
      },
    };
  },

  result: (state) => ensure(state).winner,

  turn: (state) => ensure(state).turn,
};
