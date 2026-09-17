import "server-only";

import { randomInt as cryptoRandomInt } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { defaultBoardId } from "@/content/boards";
import { createInitialState, RULES, type GameSettings, type GameState } from "@/engine";

/**
 * Lobby della serata (F2-02): impostazioni, pronto dei due posti, avvio della partita e
 * stato `sheets`.
 *
 * Le decisioni pure stanno in cima (`toggleReady`, `nextStatus`, `needsSheets`): l'adattatore
 * sotto scrive su `games` con la secret key.
 */

export const lobbySettingsSchema = z.strictObject({
  boardId: z.string().min(1),
  challengeCategories: z.array(z.enum(["builtin", "videocall", "external", "emulator"])).min(1),
  maxChallengeSeconds: z.number().int().positive().max(3600),
  stake: z.string().max(200),
  pawns: z.object({ 1: z.string(), 2: z.string() }),
  colors: z.object({ 1: z.string(), 2: z.string() }),
});

export const lobbyActionSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("settings"), settings: lobbySettingsSchema }),
  z.strictObject({ action: z.literal("ready"), ready: z.boolean() }),
  z.strictObject({ action: z.literal("start") }),
  // Una nuova serata: la partita precedente resta nell'archivio.
  z.strictObject({ action: z.literal("new") }),
]);

export type LobbyAction = z.infer<typeof lobbyActionSchema>;

/** Impostazioni di partenza di una serata nuova. */
export const DEFAULT_SETTINGS: GameSettings = {
  boardId: defaultBoardId,
  challengeCategories: ["builtin", "videocall", "external"],
  maxChallengeSeconds: 300,
  stake: "",
  pawns: { 1: "fox", 2: "rabbit" },
  colors: { 1: "red", 2: "blue" },
};

/** Stati della serata in cui la lobby ha senso. */
const OPEN_STATUSES = ["lobby", "sheets", "playing"];

/** Il pronto di un posto, senza toccare quello dell'altro. */
export function toggleReady(
  ready: Record<string, boolean>,
  seat: 1 | 2,
  value: boolean,
): Record<string, boolean> {
  return { ...ready, [seat]: value };
}

/** Entrambi pronti? */
export const bothReady = (ready: Record<string, boolean>): boolean =>
  ready["1"] === true && ready["2"] === true;

/** Vero se una delle due schede non è completa (D-28: si può giocare lo stesso). */
export const needsSheets = (answers: { answered: number; required: number }[]): boolean =>
  answers.some((sheet) => sheet.required > 0 && sheet.answered < sheet.required);

/** Stato della serata dopo il "pronto": `sheets` se manca una scheda, altrimenti si gioca. */
export function nextStatus(
  ready: Record<string, boolean>,
  sheetsIncomplete: boolean,
): "lobby" | "sheets" | "playing" {
  if (!bothReady(ready)) return "lobby";
  return sheetsIncomplete ? "sheets" : "playing";
}

/** Esito del pronto di un posto: la riga aggiornata e se con questo pronto si parte. */
export type ReadyOutcome = {
  ready: Record<string, boolean>;
  /** Vero se è questo pronto a far partire la serata (lo decide solo l'ultimo dei due). */
  starts: boolean;
  status: "lobby" | "sheets" | "playing";
};

/**
 * Il pronto di un posto applicato alla riga letta adesso (F2-02, D-53).
 *
 * È la regola che `set_lobby_ready` esegue in una sola istruzione SQL: il posto scrive il
 * proprio pronto sulla riga fresca, quindi il pronto dei due posti non si perde per una
 * corsa, e parte solo il pronto che rende pronti entrambi. Due clic quasi simultanei: il
 * primo lascia la serata in lobby, il secondo la fa partire.
 */
export function readyOutcome(
  currentReady: Record<string, boolean>,
  seat: 1 | 2,
  value: boolean,
  sheetsIncomplete: boolean,
): ReadyOutcome {
  const ready = toggleReady(currentReady, seat, value);
  const status = nextStatus(ready, sheetsIncomplete);
  return { ready, starts: status !== "lobby", status };
}

export type GameRow = {
  id: string;
  room_id: string;
  status: string;
  settings: unknown;
  state: unknown;
  version: number;
  ready: unknown;
};

/** La partita aperta della stanza, se c'è. */
export async function findOpenGame(admin: SupabaseClient, roomId: string): Promise<GameRow | null> {
  const result = await admin
    .from("games")
    .select("id, room_id, status, settings, state, version, ready")
    .eq("room_id", roomId)
    .in("status", OPEN_STATUSES)
    .maybeSingle();
  if (result.error) throw new Error(`Lettura della partita: ${result.error.message}`);
  return result.data as GameRow | null;
}

/** Vero se nella stanza c'è una partita conclusa (per l'archivio e il diario). */
export async function findFinishedGames(admin: SupabaseClient, roomId: string): Promise<GameRow[]> {
  const result = await admin
    .from("games")
    .select("id, room_id, status, settings, state, version, ready, finished_at")
    .eq("room_id", roomId)
    .eq("status", "finished")
    .order("created_at", { ascending: false });
  if (result.error) throw new Error(`Lettura dell'archivio: ${result.error.message}`);
  return (result.data ?? []) as GameRow[];
}

/**
 * Quante domande della scheda ha risposto ogni posto, sul totale richiesto.
 * Le domande aperte non stanno in scheda: il totale è quello delle domande non aperte attive.
 */
export async function sheetsProgress(
  admin: SupabaseClient,
  roomId: string,
): Promise<{ playerId: string; seat: number; answered: number; required: number }[]> {
  const [questions, players, answers] = await Promise.all([
    admin
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .neq("kind", "open"),
    admin.from("players").select("id, seat").eq("room_id", roomId).order("seat"),
    admin.from("sheet_answers").select("player_id"),
  ]);
  if (questions.error || players.error || answers.error) {
    throw new Error("Lettura dell'avanzamento delle schede fallita.");
  }
  const required = questions.count ?? 0;
  const counted = new Map<string, number>();
  for (const row of (answers.data ?? []) as { player_id: string }[]) {
    counted.set(row.player_id, (counted.get(row.player_id) ?? 0) + 1);
  }
  return ((players.data ?? []) as { id: string; seat: number }[]).map((player) => ({
    playerId: player.id,
    seat: player.seat,
    answered: counted.get(player.id) ?? 0,
    required,
  }));
}

/** Crea la partita della serata in stato `lobby`. Una sola per stanza (indice univoco parziale). */
export async function createLobbyGame(
  admin: SupabaseClient,
  roomId: string,
  settings: GameSettings,
): Promise<GameRow> {
  const result = await admin
    .from("games")
    .insert({ room_id: roomId, status: "lobby", settings, ready: {}, version: 0 })
    .select("id, room_id, status, settings, state, version, ready")
    .single();
  if (result.error) throw new Error(`Creazione della serata fallita: ${result.error.message}`);
  return result.data as GameRow;
}

/** Scrive le impostazioni della serata (solo finché la partita non è iniziata). */
export async function saveSettings(
  admin: SupabaseClient,
  gameId: string,
  settings: GameSettings,
): Promise<void> {
  const result = await admin.from("games").update({ settings }).eq("id", gameId).eq("status", "lobby");
  if (result.error) throw new Error(`Salvataggio delle impostazioni fallito: ${result.error.message}`);
}

/** Segna un posto come pronto (o non pronto) e, se è il caso, fa partire la serata: una transazione. */
export async function applyReady(
  admin: SupabaseClient,
  gameId: string,
  seat: 1 | 2,
  ready: boolean,
  sheetsIncomplete: boolean,
  newState: GameState,
): Promise<void> {
  const result = await admin.rpc("set_lobby_ready", {
    p_game_id: gameId,
    p_seat: seat,
    p_ready: ready,
    p_sheets_incomplete: sheetsIncomplete,
    p_new_state: newState,
  });
  if (result.error) throw new Error(`Salvataggio del pronto fallito: ${result.error.message}`);
}

/**
 * Fa partire la serata (F2-02, D-53): stato iniziale e `playing` in una sola transazione.
 * Idempotente: se la serata è già partita non è un errore — la seconda chiamata ("Gioca lo
 * stesso", o la corsa fra due posti) ritrova la riga com'è.
 */
export async function startLobbyGame(
  admin: SupabaseClient,
  gameId: string,
  newState: GameState,
): Promise<void> {
  const result = await admin.rpc("start_lobby_game", {
    p_game_id: gameId,
    p_new_state: newState,
  });
  if (result.error) throw new Error(`Avvio della partita fallito: ${result.error.message}`);
}

/** Chi comincia la serata: sorteggiato dal server, il seme non entra mai nello stato (D-05, D-24). */
export const pickFirstSeat = (): 1 | 2 => (cryptoRandomInt(2) === 0 ? 1 : 2);

/** Stato iniziale di una serata che parte adesso. */
export const initialStateFor = (settings: GameSettings): GameState =>
  createInitialState(settings, pickFirstSeat());

/** Round massimi della serata: la pagina li mostra prima di iniziare. */
export const maxRounds = RULES.maxRounds;
