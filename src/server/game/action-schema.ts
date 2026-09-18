import { z } from "zod";

import type { Action } from "@/engine";

/**
 * Validazione delle azioni che arrivano dal client (F2-01).
 * Il motore sa già rifiutare un'azione fuori fase; qui si controlla **la forma** della
 * richiesta, così al reducer arriva solo roba tipata e nessun campo di troppo.
 */

const seat = z.union([z.literal(1), z.literal(2)]);

const winner = z.union([z.literal(1), z.literal(2), z.literal("draw")]);

export const itemIdSchema = z.enum([
  "single_die",
  "loaded_die",
  "skip_question",
  "antidote",
  "portable_ladder",
  "thief",
  "swap",
]);

export const actionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("BUY_ITEM"), seat, item: itemIdSchema }),
  z.strictObject({
    type: z.literal("USE_ITEM"),
    seat,
    item: itemIdSchema,
    loadedDieValue: z.number().int().min(1).max(6).optional(),
  }),
  z.strictObject({ type: z.literal("ROLL"), seat }),
  z.strictObject({ type: z.literal("ANSWER_QUESTION"), seat, answer: z.string().min(1).max(500) }),
  z.strictObject({ type: z.literal("JUDGE_ANSWER"), seat, verdict: z.enum(["correct", "almost", "wrong"]) }),
  z.strictObject({ type: z.literal("SKIP_QUESTION"), seat }),
  z.strictObject({ type: z.literal("ACK_OPEN_QUESTION"), seat }),
  z.strictObject({ type: z.literal("CLAIM_CHALLENGE_RESULT"), seat, winner }),
  z.strictObject({ type: z.literal("RESOLVE_DISPUTE"), seat, method: z.enum(["rematch", "coin_flip"]) }),
  // La mossa del minigioco la valida il modulo del minigioco: qui è solo "qualcosa".
  z.strictObject({ type: z.literal("MINIGAME_MOVE"), seat, move: z.unknown() }),
  z.strictObject({ type: z.literal("DECLARE_TIME_UP"), seat }),
  z.strictObject({ type: z.literal("BUY_STAR"), seat }),
  z.strictObject({ type: z.literal("DECLINE_STAR"), seat }),
  z.strictObject({ type: z.literal("ACK_EVENT"), seat }),
  z.strictObject({
    type: z.literal("DISCARD_ITEM"),
    seat,
    item: z.union([itemIdSchema, z.literal("incoming")]),
  }),
]);

/** Corpo di `POST /api/games/[gameId]/actions`. */
export const actionRequestSchema = z.strictObject({
  action: actionSchema,
  expectedVersion: z.number().int().nonnegative(),
});

export type ActionRequest = z.infer<typeof actionRequestSchema>;

/** Un'azione validata dal client è un'azione del motore: lo dice il tipo, non un cast. */
export const asEngineAction = (action: ActionRequest["action"]): Action => action;
