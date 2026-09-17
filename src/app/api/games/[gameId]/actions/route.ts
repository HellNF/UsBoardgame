import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { asEngineAction, actionRequestSchema } from "@/server/game/action-schema";
import { applyAction } from "@/server/game/apply-action";

/**
 * POST /api/games/[gameId]/actions — l'unico modo di muovere la partita (F2-01).
 *
 * Corpo: `{ action, expectedVersion }`. Risposte:
 *  - 200 `{ state, events, version }` → il client che ha agito anima subito i suoi eventi;
 *  - 400 corpo non valido, 401 sessione assente, 403 azione di un altro posto o di un'altra stanza,
 *    404 partita inesistente, 409 versione superata (con `state` e `version` freschi), 422 azione
 *    rifiutata dal motore, 500 errore del database.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[gameId]/actions">) {
  const { gameId } = await ctx.params;

  const body: unknown = await request.json().catch(() => null);
  const parsed = actionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Azione non valida." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return Response.json({ error: "Sessione anonima mancante: ricarica la pagina." }, { status: 401 });
  }

  const result = await applyAction({
    admin: createSupabaseAdminClient(),
    userId: data.user.id,
    gameId,
    action: asEngineAction(parsed.data.action),
    expectedVersion: parsed.data.expectedVersion,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, state: result.state, version: result.version },
      { status: result.status },
    );
  }

  return Response.json({ state: result.state, events: result.events, version: result.version });
}
