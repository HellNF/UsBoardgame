import { otherSeat, type Seat } from "../types";
import { RULES } from "../config";
import type { MinigameClock, MinigameModule, MinigameState, ReflexState } from "./types";

/**
 * Riflessi (F4-04, D-55): un segnale parte a sorpresa e il primo che lo tocca prende il punto;
 * si gioca al meglio di `RULES.minigames.reflex.bestOf`. Chi tocca **prima** del segnale
 * regala il punto all'altro (partenza falsa).
 *
 * Il momento del segnale lo decide il modulo con l'orologio del server e vive nello stato
 * (`goAt`), quindi è lo stesso per tutti e due gli schermi: le due schermate lo mostrano
 * quando arriva il momento, e la mossa la giudica il server.
 */

const rules = () => RULES.minigames.reflex;

/** Punti che servono per vincere: al meglio di cinque servono tre punti. */
const roundsToWin = (): number => Math.floor(rules().bestOf / 2) + 1;

const ensure = (state: MinigameState): ReflexState => {
  if (state.kind !== "reflex") throw new Error("Stato di gioco non adatto ai riflessi.");
  return state;
};

/** Ritardo del segnale del prossimo round: mai due volte lo stesso, dentro la finestra dei RULES. */
const nextGoAt = (clock: MinigameClock): string => {
  const { minDelayMs, maxDelayMs } = rules();
  const span = Math.max(1, maxDelayMs - minDelayMs);
  return new Date(clock.now.getTime() + minDelayMs + clock.randomInt(span)).toISOString();
};

const isPress = (move: unknown): boolean =>
  typeof move === "object" && move !== null && (move as { press?: unknown }).press === true;

export const reflex: MinigameModule = {
  id: "reflex",

  init: (clock) => ({
    kind: "reflex",
    round: 1,
    goAt: nextGoAt(clock),
    pressed: [],
    scores: { 1: 0, 2: 0 },
    lastRound: null,
    winner: null,
  }),

  applyMove: (rawState, seat, move, clock) => {
    const state = ensure(rawState);
    if (state.winner !== null) return { ok: false, error: "Il duello di riflessi è già finito." };
    if (!isPress(move)) return { ok: false, error: "Mossa dei riflessi non valida: serve `press`." };
    if (state.pressed.includes(seat)) return { ok: false, error: "Hai già toccato in questo round." };

    const falseStart = clock.now.getTime() < new Date(state.goAt).getTime();
    const roundWinner: Seat = falseStart ? otherSeat(seat) : seat;
    const scores: Record<Seat, number> = { ...state.scores, [roundWinner]: state.scores[roundWinner] + 1 };
    const winner: Seat | "draw" | null = scores[roundWinner] >= roundsToWin() ? roundWinner : null;

    return {
      ok: true,
      state: {
        ...state,
        round: winner === null ? state.round + 1 : state.round,
        goAt: nextGoAt(clock),
        pressed: winner === null ? [] : [...state.pressed, seat],
        scores,
        lastRound: { winner: roundWinner, falseStart },
        winner,
      },
    };
  },

  result: (state) => ensure(state).winner,

  // Entrambi possono toccare: non c'è un turno.
  turn: () => "both",
};
