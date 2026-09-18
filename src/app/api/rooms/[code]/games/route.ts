import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameSettings } from "@/engine";
import {
  DEFAULT_SETTINGS,
  applyReady,
  createLobbyGame,
  findOpenGame,
  initialStateFor,
  lobbyActionSchema,
  needsSheets,
  saveSettings,
  sheetsProgress,
  startLobbyGame,
} from "@/server/room/lobby";
import { screenFor } from "@/server/room/join";

/**
 * POST /api/rooms/[code]/games — la lobby della serata (F2-02).
 *
 * Corpo: `{ action: "settings" | "ready" | "start" | "new", … }`.
 * Risposta: `{ game, screen }` con la partita aperta aggiornata e la schermata da mostrare.
 * Il "pronto" dei due posti fa partire la serata: `sheets` se una scheda è incompleta (D-28),
 * altrimenti `playing`.
 */

export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/games">) {
  const { code } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = lobbyActionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Richiesta non valida." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return Response.json({ error: "Sessione anonima mancante: ricarica la pagina." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const session = await admin
    .from("player_sessions")
    .select("player_id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  const playerId = (session.data as { player_id: string } | null)?.player_id;
  if (!playerId) {
    return Response.json(
      { error: "Rientra nella stanza: il tuo posto non è più legato a questo browser." },
      {
        status: 401,
      },
    );
  }

  const player = await admin.from("players").select("id, room_id, seat").eq("id", playerId).maybeSingle();
  const playerRow = player.data as { room_id: string; seat: number } | null;
  if (!playerRow) {
    return Response.json({ error: "Posto inesistente." }, { status: 401 });
  }

  const room = await admin.from("rooms").select("id, code").eq("id", playerRow.room_id).maybeSingle();
  const roomRow = room.data as { id: string; code: string } | null;
  if (!roomRow || roomRow.code !== code.toUpperCase()) {
    return Response.json({ error: "Questa stanza non è la tua." }, { status: 403 });
  }

  const seat = playerRow.seat === 2 ? 2 : 1;

  try {
    let game = await findOpenGame(admin, roomRow.id);
    const action = parsed.data;

    if (action.action === "new") {
      // La serata precedente resta in archivio: non si cancella nulla.
      if (game) await admin.from("games").update({ status: "abandoned" }).eq("id", game.id);
      game = await createLobbyGame(admin, roomRow.id, DEFAULT_SETTINGS);
    } else {
      if (!game) {
        return Response.json({ error: "Non c'è nessuna serata aperta: creane una." }, { status: 404 });
      }
      const settings = (game.settings ?? DEFAULT_SETTINGS) as GameSettings;

      if (action.action === "settings") {
        if (game.status !== "lobby") {
          return Response.json(
            { error: "La serata è già cominciata: le impostazioni non si cambiano più." },
            {
              status: 409,
            },
          );
        }
        await saveSettings(admin, game.id, action.settings as GameSettings);
      }

      if (action.action === "ready" && game.status === "lobby") {
        // Il pronto e l'eventuale avvio stanno in una sola transazione (D-53): due clic
        // quasi simultanei non si perdono e il secondo arrivato riceve la fase giusta.
        const progress = await sheetsProgress(admin, roomRow.id);
        await applyReady(
          admin,
          game.id,
          seat,
          action.ready,
          needsSheets(progress),
          initialStateFor(settings),
        );
      }
      // Se la serata è già partita il pronto non è un errore (D-53): la finestra che arriva
      // seconda, o che ripreme il pulsante prima di accorgersi della fase nuova, riceve lo
      // stato fresco e la schermata giusta invece di un 409 rosso.

      if (action.action === "start") {
        // "Gioca lo stesso": si parte anche con una scheda incompleta (D-28). Idempotente:
        // se è già partita non è un errore.
        if (game.status === "lobby" || game.status === "sheets") {
          await startLobbyGame(admin, game.id, initialStateFor(settings));
        }
      }
    }

    const fresh = await findOpenGame(admin, roomRow.id);
    return Response.json({
      game: fresh,
      screen: screenFor(fresh?.status),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Errore del database." },
      { status: 500 },
    );
  }
}
