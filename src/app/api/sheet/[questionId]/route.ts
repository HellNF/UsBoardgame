import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveSheetAnswer, sheetAnswerSchema } from "@/server/sheet/save-answer";

/**
 * PUT /api/sheet/[questionId] — salva una risposta della scheda (F3-02).
 * Corpo: `{ answer }`. Risposte: 200 `{ ok: true }`, 400 risposta non valida, 401 sessione
 * assente, 404 domanda inesistente, 500 errore del database.
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/sheet/[questionId]">) {
  const { questionId } = await ctx.params;

  const body: unknown = await request.json().catch(() => null);
  const parsed = sheetAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Risposta non valida." },
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

  const result = await saveSheetAnswer({
    admin,
    playerId,
    questionId,
    answer: parsed.data.answer,
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

  return Response.json({ ok: true });
}
