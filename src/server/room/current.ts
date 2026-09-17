import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BoardLayout, GameSettings, GameState, PawnId, PlayerColor, Seat } from "@/engine";
import { loadBoard, parseGameState, parseSettings } from "@/server/game/context";
import {
  DEFAULT_SETTINGS,
  createLobbyGame,
  findFinishedGames,
  findOpenGame,
  type GameRow,
} from "@/server/room/lobby";

/**
 * Chi sta guardando la pagina e in che serata (F0-05, F2-03: riconnessione).
 *
 * Ogni pagina della stanza chiama `currentRoom(code)`: se questo browser non ha un posto lo
 * rimanda all'accesso con il codice già scritto; altrimenti sa chi è, com'è la serata e in
 * quale schermata deve stare. Le letture di stanza e posti passano dal client con RLS (le
 * policy lasciano vedere solo la propria stanza); disposizione e stato della partita li legge
 * il client con la secret key, perché al browser servono per disegnare il tabellone.
 *
 * Se non c'è nessuna serata aperta la crea qui: la stanza ha sempre una lobby pronta.
 */

export type RoomContext = {
  code: string;
  roomId: string;
  seat: Seat;
  names: Record<Seat, string>;
  colors: Record<Seat, PlayerColor>;
  pawns: Record<Seat, PawnId>;
  playerIds: Record<Seat, string>;
  /** Partita aperta (lobby, sheets o playing): c'è sempre. */
  game: GameRow;
  settings: GameSettings;
  state: GameState | null;
  board: BoardLayout | null;
  /** Partite concluse, dalla più recente: l'archivio del diario. */
  finished: GameRow[];
};

export async function currentRoom(code: string): Promise<RoomContext> {
  const wanted = code.toUpperCase();
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/?code=${wanted}`);

  const session = await supabase
    .from("player_sessions")
    .select("player_id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  const playerId = (session.data as { player_id: string } | null)?.player_id;
  if (!playerId) redirect(`/?code=${wanted}`);

  // Da qui in poi RLS mostra solo la propria stanza: queste due letture sono del client.
  const [me, players] = await Promise.all([
    supabase
      .from("players")
      .select("id, room_id, seat, display_name, pawn, color")
      .eq("id", playerId)
      .maybeSingle(),
    supabase.from("players").select("id, seat, display_name, pawn, color"),
  ]);
  const meRow = me.data as { room_id: string; seat: number } | null;
  if (!meRow) redirect(`/?code=${wanted}`);

  const people = (players.data ?? []) as {
    id: string;
    seat: number;
    display_name: string;
    pawn: string;
    color: string;
  }[];
  const bySeat = new Map(people.map((person) => [person.seat, person]));
  const first = bySeat.get(1);
  const second = bySeat.get(2);
  if (!first || !second) redirect(`/?code=${wanted}`);

  const admin = createSupabaseAdminClient();

  // `last_seen_at` si aggiorna a ogni caricamento di pagina: è la parte "lenta" della presenza,
  // la parte viva la fa il canale Realtime (F2-04).
  await admin.from("players").update({ last_seen_at: new Date().toISOString() }).eq("id", playerId);

  let game = await findOpenGame(admin, meRow.room_id);
  if (!game) {
    // Nessuna serata aperta: la lobby si crea da sé. Se l'altro browser l'ha creata nello
    // stesso istante, l'indice univoco della stanza rifiuta la seconda e si rilegge quella.
    game =
      (await createLobbyGame(admin, meRow.room_id, DEFAULT_SETTINGS).catch(() => null)) ??
      (await findOpenGame(admin, meRow.room_id));
    if (!game) throw new Error("Non è stato possibile aprire la serata: ricarica la pagina.");
  }

  const settings = parseSettings(game.settings, DEFAULT_SETTINGS.boardId);
  const board = await loadBoard(admin, settings.boardId).catch(() => null);
  const state = game.state ? parseGameState(game.state) : null;
  const finished = await findFinishedGames(admin, meRow.room_id).catch(() => []);

  return {
    code: wanted,
    roomId: meRow.room_id,
    seat: (meRow.seat === 2 ? 2 : 1) as Seat,
    names: { 1: first.display_name, 2: second.display_name },
    colors: settings.colors,
    pawns: settings.pawns,
    playerIds: { 1: first.id, 2: second.id },
    game,
    settings,
    state,
    board,
    finished,
  };
}
