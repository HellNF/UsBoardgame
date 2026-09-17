import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { failedJoins, wait } from "@/server/auth/attempts";
import { joinRoom, joinSchema } from "@/server/room/join";

/**
 * POST /api/rooms/join — lega la sessione anonima corrente al posto scelto (F0-04).
 *
 * Corpo: `{ code, password, seat }`. Risposte:
 *  - 200 `{ code, roomId, seat, displayName, screen }` → la schermata da aprire;
 *  - 400 corpo non valido, 401 codice/password sbagliati (dopo il ritardo), 404 posto inesistente,
 *    500 errore del database.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Richiesta non valida." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return Response.json({ error: "Sessione anonima mancante: ricarica la pagina." }, { status: 401 });
  }

  const result = await joinRoom({
    userId: data.user.id,
    admin: createSupabaseAdminClient(),
    request: parsed.data,
  });

  if (!result.ok) {
    // Il ritardo crescente vale per codice sbagliato e per password sbagliata, allo stesso modo.
    if (result.status === 401) await wait(failedJoins.register(parsed.data.code));
    return Response.json({ error: result.error }, { status: result.status });
  }

  failedJoins.clear(parsed.data.code);
  return Response.json(result);
}
