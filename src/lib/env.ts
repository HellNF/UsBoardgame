import { z } from "zod";

/*
 * Le variabili si leggono solo quando servono (mai all'import), così `pnpm build`
 * e i test funzionano anche senza .env.local. Vedi .env.example.
 */

/** Variabili pubbliche (disponibili anche nel browser). */
export function publicEnv() {
  return z
    .object({
      NEXT_PUBLIC_SUPABASE_URL: z.url(),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    })
    .parse({
      // Riferimenti letterali: Next.js li sostituisce nel bundle del browser.
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
}

/** Variabili solo server. Non importare da componenti client. */
export function serverEnv() {
  return z.object({ SUPABASE_SECRET_KEY: z.string().min(1) }).parse(process.env);
}
