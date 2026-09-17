import { notFound } from "next/navigation";
import { GameTable } from "@/features/game/game-table";

/**
 * Partita in hot seat (task F1-05): una partita intera per due giocatori sullo stesso
 * schermo, sul tabellone `classic`, con carte, dadi, oggetti e minigiochi.
 *
 * Pagina **di sviluppo**: in produzione risponde 404 (docs/decisions.md D-43). Qui il
 * reducer gira nel browser con un `EngineContext` finto (`src/features/game/dev-context.ts`),
 * unica eccezione alla regola 1 di AGENTS.md.
 */
export default function HotseatPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-6 p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b-4 border-ink pb-3">
        <h1 className="font-display text-3xl italic">Scale e serpenti di coppia</h1>
        <p className="font-sans text-sm text-ink/70">Hot seat: due giocatori, uno schermo · senza Supabase</p>
      </header>

      <GameTable />
    </main>
  );
}
