import { AccessContainer } from "@/features/access/access-container";

/**
 * Accesso (F0-05, collegato a Supabase dal pacchetto D): codice stanza, password, scelta
 * del posto. Il modulo `src/proxy.ts` rimanda qui con `?code=…` chi prova ad aprire una
 * stanza senza sessione.
 */
export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code.toUpperCase() : undefined;

  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <AccessContainer roomCode={code} />
    </main>
  );
}
