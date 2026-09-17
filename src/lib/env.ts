import { z } from "zod";

/** Variabili pubbliche (disponibili anche nel browser). Vedi .env.example. */
export const publicEnv = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

/** Variabili solo server. Non importare da componenti client. */
export function serverEnv() {
  return z.object({ SUPABASE_SECRET_KEY: z.string().min(1) }).parse(process.env);
}
