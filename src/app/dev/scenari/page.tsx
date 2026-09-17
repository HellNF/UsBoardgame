import { notFound } from "next/navigation";

import { SCENARIOS } from "@/features/game/dev-scenarios";
import { ScenarioCard } from "@/features/game/scenario-card";

/**
 * Scenari delle carte (solo sviluppo): tutti gli stati di carta e di schermata che in
 * partita capitano di rado, ognuno costruito da uno stato fissato a mano
 * (`src/features/game/dev-scenarios.ts`) e giocabile lì per lì.
 *
 * Serve a guardare in un colpo solo le carte che giocando non escono: domanda breve nei
 * tre verdetti, i sette imprevisti, l'offerta della stella con e senza monete, lo zaino
 * pieno, la doppia conferma in disaccordo, la sfida lampo del serpente, la schermata
 * finale in tutte le sue forme.
 *
 * Pagina **di sviluppo**: in produzione risponde 404 (docs/decisions.md D-43).
 */
export default function ScenariPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-6 p-6 font-sans text-ink">
      <header className="flex flex-col gap-2 border-b-4 border-ink pb-3">
        <h1 className="font-display text-3xl italic">Scenari delle carte</h1>
        <p className="text-sm text-ink/70">
          {SCENARIOS.length} stati fissati a mano, uno per carta: la carta è viva e cliccabile, e ogni
          riquadro ha un pulsante per rimetterla com&apos;era. Pagina di sviluppo: senza Supabase, in
          produzione risponde 404.
        </p>
      </header>

      <nav aria-label="Indice degli scenari" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {SCENARIOS.map((scenario) => (
          <a key={scenario.id} href={`#${scenario.id}`} className="underline decoration-2 underline-offset-2">
            {scenario.title}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        {SCENARIOS.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>
    </main>
  );
}
