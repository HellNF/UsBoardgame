import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/** Client per i componenti client: sessione anonima, letture via RLS, Realtime. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
