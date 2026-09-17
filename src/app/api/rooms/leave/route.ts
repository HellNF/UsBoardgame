import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/rooms/leave — esce dal posto (F0-04).
 * Toglie la riga di `player_sessions` (da quel momento RLS non mostra più la stanza a questo
 * browser); il client chiama anche `supabase.auth.signOut()` per chiudere la sessione anonima.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return Response.json({ error: "Nessuna sessione da chiudere." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const removed = await admin.from("player_sessions").delete().eq("auth_user_id", data.user.id);
  if (removed.error) {
    return Response.json({ error: "Uscita non riuscita: riprova." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
