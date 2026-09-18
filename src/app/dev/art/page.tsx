import { notFound } from "next/navigation";

import { ILLUSTRATIONS, Illustration, illustrationGroups } from "@/art/illustrations";

/**
 * Illustrazioni (task F6-02, `src/art/illustrations`): tutte insieme, a 48 px e a 200 px.
 *
 * Serve a guardare in un colpo solo i ~38 disegni del tabellone — 35 delle caselle domanda e 3
 * delle caselle stella — senza aspettare che escano giocando, e a controllare che restino
 * leggibili alla misura piccola (docs/design.md § Illustrazioni SVG: a 48 px niente dettagli
 * sotto le 3 unità).
 *
 * Pagina **di sviluppo**: in produzione risponde 404 come `/dev/hotseat` e `/dev/scenari` (D-43).
 */
export default function ArtPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const groups = illustrationGroups();
  const total = Object.keys(ILLUSTRATIONS).length;

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-8 p-6 font-sans text-ink">
      <header className="flex flex-col gap-2 border-b-4 border-ink pb-3">
        <h1 className="font-display text-3xl italic">Illustrazioni</h1>
        <p className="text-sm text-ink/70">
          {total} disegni in bianco e nero, uno per file in <code>src/art/illustrations</code>, raccolti dal
          registro. Ogni riga mostra la stessa illustrazione a 48 px (la misura minima leggibile in una
          casella) e a 200 px. Pagina di sviluppo: in produzione risponde 404.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.prefix} id={group.prefix} className="flex flex-col gap-4">
          <h2 className="font-display text-2xl italic">
            {group.prefix} <span className="font-sans text-sm not-italic">({group.ids.length})</span>
          </h2>

          <div className="flex flex-col divide-y-2 divide-ink/20 border-y-2 border-ink/20">
            {group.ids.map((id) => (
              <div key={id} id={id} className="flex scroll-mt-4 flex-wrap items-center gap-6 py-3">
                <code className="w-52 text-xs">{id}</code>
                {/* 48 px: la misura che l'illustrazione deve reggere in una casella. */}
                <span className="text-ink" title="48 px">
                  <Illustration id={id} size={48} />
                </span>
                <span className="text-ink" title="200 px">
                  <Illustration id={id} size={200} />
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
