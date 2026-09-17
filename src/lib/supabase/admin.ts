import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Client con secret key: bypassa RLS. Usarlo SOLO in src/server/** dopo aver
 * verificato chi sta agendo. È l'unico modo in cui si scrive nel database.
 */
export function createSupabaseAdminClient() {
  return createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
