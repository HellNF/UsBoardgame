import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { reduce, type Action, type GameEvent, type GameState, type Seat } from "@/engine";
import { buildEngineContext, loadGameById, parseGameState, type GameRow } from "./context";

/**
 * Pipeline di un'azione (F2-01, docs/architecture.md § Flusso di un'azione):
 *
 *  1. identifica il giocatore dalla sessione e verifica che `action.seat` sia il suo;
 *  2. carica `games.state` e `games.version` e confronta la versione attesa;
 *  3. costruisce l'`EngineContext` (RNG del server, domande, schede, sfide);
 *  4. `reduce(state, action, ctx)`: un rifiuto del motore diventa `422`;
 *  5. `apply_game_action`: stato, eventi e domande usate in **una sola transazione**;
 *  6. se qualcuno è arrivato prima, `409` con lo stato fresco: il client si riallinea (D-23).
 */

export type ApplyActionResult =
  | { ok: true; state: GameState; events: GameEvent[]; version: number }
  | {
      ok: false;
      status: 401 | 403 | 404 | 409 | 422 | 500;
      error: string;
      /** Stato attuale: lo manda il `409` perché il client possa riallinearsi. */
      state?: GameState;
      version?: number;
    };

export type ApplyActionInput = {
  admin: SupabaseClient;
  /** `auth.uid()` del browser che manda l'azione. */
  userId: string;
  gameId: string;
  action: Action;
  /** Versione su cui il client crede di stare (`games.version`). */
  expectedVersion: number;
};

const fail = (status: 401 | 403 | 404 | 409 | 422 | 500, error: string): ApplyActionResult => ({
  ok: false,
  status,
  error,
});

/** Posto e stanza di chi sta agendo: la sessione dice chi è, non il corpo della richiesta. */
async function findSeat(
  admin: SupabaseClient,
  userId: string,
): Promise<{ seat: Seat; roomId: string } | null> {
  const session = await admin
    .from("player_sessions")
    .select("player_id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  const playerId = (session.data as { player_id: string } | null)?.player_id;
  if (!playerId) return null;

  const player = await admin.from("players").select("id, room_id, seat").eq("id", playerId).maybeSingle();
  const row = player.data as { room_id: string; seat: number } | null;
  if (!row) return null;
  return { seat: row.seat === 2 ? 2 : 1, roomId: row.room_id };
}

/**
 * Riga della partita aggiornata dalla funzione SQL.
 *
 * In caso di conflitto `apply_game_action` ritorna NULL, ma PostgREST non lo consegna come
 * `null`: manda la riga composita **con tutti i campi a `null`**. Il conflitto si riconosce
 * quindi da `version`, non dall'assenza dell'oggetto.
 */
type UpdatedGame = { id: string | null; state: unknown; version: number | null };

export async function applyAction(input: ApplyActionInput): Promise<ApplyActionResult> {
  const { admin } = input;

  const identity = await findSeat(admin, input.userId);
  if (!identity) return fail(401, "Nessuna sessione per questo browser: rientra nella stanza.");
  if (input.action.seat !== identity.seat) return fail(403, "L'azione non è del tuo posto.");

  let game: GameRow | null;
  try {
    game = await loadGameById(admin, input.gameId);
  } catch (error) {
    return fail(500, error instanceof Error ? error.message : "Lettura della partita fallita.");
  }
  if (!game) return fail(404, "Partita inesistente.");
  if (game.room_id !== identity.roomId) return fail(403, "Questa partita non è della tua stanza.");
  if (game.status !== "playing" || game.state === null) {
    return fail(409, "La partita non è ancora iniziata.");
  }

  let state: GameState;
  try {
    state = parseGameState(game.state);
  } catch (error) {
    return fail(500, error instanceof Error ? error.message : "Stato della partita illeggibile.");
  }

  if (game.version !== input.expectedVersion) {
    return {
      ...fail(409, "Qualcuno ha giocato prima di te: ricarica lo stato."),
      state,
      version: game.version,
    };
  }

  let built;
  try {
    built = await buildEngineContext({ admin, game, seat: identity.seat });
  } catch (error) {
    return fail(500, error instanceof Error ? error.message : "Contesto di gioco non disponibile.");
  }

  const result = reduce(state, input.action, built.ctx);
  if (!result.ok) {
    return { ...fail(422, result.error), state, version: game.version };
  }

  const updated = await admin.rpc("apply_game_action", {
    p_game_id: game.id,
    p_expected_version: game.version,
    p_new_state: result.state,
    p_events: result.events,
    p_used: built.drawn,
    p_reset_seats: built.resets.map((reset) => reset.seat ?? 0),
  });
  if (updated.error) {
    return fail(500, `Salvataggio dell'azione fallito: ${updated.error.message}`);
  }

  // Versione non più valida: è il conflitto del passo 6 (riga composita con i campi a `null`).
  const row = updated.data as UpdatedGame | null;
  if (!row || row.version === null) {
    const fresh = await loadGameById(admin, game.id);
    return {
      ...fail(409, "Qualcuno ha giocato prima di te: ricarica lo stato."),
      state: fresh?.state ? parseGameState(fresh.state) : state,
      version: fresh?.version ?? game.version,
    };
  }

  return {
    ok: true,
    state: parseGameState(row.state),
    events: result.events,
    version: row.version,
  };
}
