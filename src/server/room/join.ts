import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { verifyPassword } from "@/server/auth/password";
import type { Seat } from "@/engine";

/**
 * Accesso a una stanza (F0-04, docs/architecture.md § Accesso).
 *
 * La parte pura sta in alto: lo schema del corpo della richiesta e la scelta della
 * schermata. Sotto, l'adattatore che parla con Supabase (secret key) e con `verifyPassword`.
 */

/** Corpo di `POST /api/rooms/join`. */
export const joinSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => /^[A-Z0-9]{4,12}$/.test(value), "Il codice della stanza non è valido."),
  password: z.string().min(1, "Serve la password."),
  seat: z.union([z.literal(1), z.literal(2)]),
});

export type JoinRequest = z.infer<typeof joinSchema>;

/** Schermata su cui entrare, dalla fase della serata (`games.status`). */
export type Screen = "lobby" | "sheet" | "game" | "diary";

export function screenFor(status: string | null | undefined): Screen {
  switch (status) {
    case "sheets":
      return "sheet";
    case "playing":
      return "game";
    case "finished":
      return "diary";
    default:
      return "lobby";
  }
}

export type JoinResult =
  | {
      ok: true;
      code: string;
      roomId: string;
      seat: Seat;
      displayName: string;
      screen: Screen;
    }
  | { ok: false; status: 401 | 404 | 409 | 500; error: string };

type RoomRow = { id: string; password_hash: string };
type PlayerRow = { id: string; seat: number; display_name: string };
type GameRow = { id: string; status: string };

export type JoinInput = {
  /** `auth.uid()` della sessione anonima del browser. */
  userId: string;
  /**
   * Client con secret key (bypassa RLS): qui si legge `rooms`, che i client non vedono mai.
   * Il tipo è quello di `@supabase/supabase-js` senza schema generato (`pnpm db:types` lo
   * produrrà): le righe si riportano a mano ai tipi che servono.
   */
  admin: SupabaseClient;
  request: JoinRequest;
};

/**
 * Lega la sessione anonima al posto scelto. Non dice mai se il codice esiste: chi sbaglia
 * codice e chi sbaglia password ricevono la stessa risposta.
 */
export async function joinRoom({ userId, admin, request }: JoinInput): Promise<JoinResult> {
  const rooms = admin.from("rooms").select("id, password_hash").eq("code", request.code);
  const roomResult = await rooms.maybeSingle();
  if (roomResult.error) return { ok: false, status: 500, error: "Lettura della stanza fallita." };

  const room = roomResult.data as RoomRow | null;
  const passwordOk = room !== null && (await verifyPassword(request.password, room.password_hash));
  if (!room || !passwordOk) {
    return { ok: false, status: 401, error: "Codice o password non corretti." };
  }

  const playerResult = await admin
    .from("players")
    .select("id, seat, display_name")
    .eq("room_id", room.id)
    .eq("seat", String(request.seat))
    .maybeSingle();
  if (playerResult.error) return { ok: false, status: 500, error: "Lettura del posto fallita." };

  const player = playerResult.data as PlayerRow | null;
  if (!player) return { ok: false, status: 404, error: "Questo posto non esiste nella stanza." };

  // Una sola sessione per browser: l'upsert sposta la riga sulla chiave auth_user_id.
  const session = await admin
    .from("player_sessions")
    .upsert({ auth_user_id: userId, player_id: player.id }, { onConflict: "auth_user_id" });
  if (session.error) return { ok: false, status: 500, error: "Non è stato possibile entrare." };

  await admin.from("players").update({ last_seen_at: new Date().toISOString() }).eq("id", player.id);

  const gameResult = await admin
    .from("games")
    .select("id, status")
    .eq("room_id", room.id)
    .in("status", ["lobby", "sheets", "playing"])
    .maybeSingle();
  const game = gameResult.data as GameRow | null;

  return {
    ok: true,
    code: request.code,
    roomId: room.id,
    seat: player.seat === 2 ? 2 : 1,
    displayName: player.display_name,
    screen: screenFor(game?.status),
  };
}
