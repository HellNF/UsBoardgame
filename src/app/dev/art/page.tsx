import { notFound } from "next/navigation";

import { ILLUSTRATIONS, Illustration, illustrationGroups } from "@/art/illustrations";
import { CardView, DieView, FinaleView, MascotView, PawnView } from "@/art/rive";
import type { MascotForm } from "@/art/rive";
import type { PawnId } from "@/engine";

/**
 * Illustrazioni (task F6-02, `src/art/illustrations`): tutte insieme, a 48 px e a 200 px.
 *
 * Serve a guardare in un colpo solo i ~38 disegni del tabellone — 35 delle caselle domanda e 3
 * delle caselle stella — senza aspettare che escano giocando, e a controllare che restino
 * leggibili alla misura piccola (docs/design.md § Illustrazioni SVG: a 48 px niente dettagli
 * sotto le 3 unità).
 *
 * In fondo ci sono i **segnaposto dei wrapper Rive** (F6-04, F6-05): i `.riv` non ci sono ancora,
 * quindi si vedono i segnaposto — quelli che compaiono finché i file mancano.
 *
 * Pagina **di sviluppo**: in produzione risponde 404 come `/dev/hotseat` e `/dev/scenari` (D-43).
 */
const FORMS: MascotForm[] = ["fox", "rabbit", "cat", "bear", "frog", "owl"];
const ANIMALS: PawnId[] = ["fox", "rabbit", "cat", "bear", "frog", "owl"];

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

      <section id="rive" className="flex flex-col gap-4 border-t-4 border-ink pt-4">
        <h2 className="font-display text-2xl italic">Segnaposto Rive</h2>
        <p className="text-sm text-ink/70">
          I wrapper di <code>src/art/rive</code> mostrano il segnaposto finché il file non c&apos;è in{" "}
          <code>public/rive/</code>. I `.riv` li disegna il proprietario nell&apos;editor: quando arriveranno,
          il wrapper prenderà quello e il segnaposto sparirà da solo.
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-sm">
              Pedine <span className="text-ink/60">(pawns.riv · 6 artboard)</span>
            </h3>
            <div className="flex flex-wrap items-end gap-4">
              {ANIMALS.map((animal) => (
                <span key={animal} className="flex flex-col items-center gap-1 text-ink">
                  <PawnView
                    animal={animal}
                    color={animal === "fox" ? "red" : "blue"}
                    number={animal === "fox" ? 1 : 2}
                    className="size-16"
                  />
                  <code className="text-xs text-ink/60">{animal}</code>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-sm">
              Dado e carta <span className="text-ink/60">(dice.riv · card.riv)</span>
            </h3>
            <div className="flex flex-wrap items-end gap-6">
              {[1, 3, 6].map((value) => (
                <span key={value} className="flex flex-col items-center gap-1 text-ink">
                  <DieView value={value} className="size-16 text-3xl" />
                  <code className="text-xs text-ink/60">dado {value}</code>
                </span>
              ))}
              <CardView faceUp className="w-24 border-2 border-ink p-2">
                <span className="block text-center font-serif text-2xl text-ink">Carta</span>
              </CardView>
              <CardView faceUp={false} className="w-24 border-2 border-ink p-2">
                <span className="block text-center font-serif text-2xl text-ink">Carta</span>
              </CardView>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-sm">
              Mascotte <span className="text-ink/60">(mascots.riv · 6 artboard · Mood)</span>
            </h3>
            <div className="flex flex-wrap items-end gap-4">
              {FORMS.map((form) => (
                <span key={form} className="flex flex-col items-center gap-1 text-ink">
                  <MascotView form={form} mood={1} className="size-16" />
                  <code className="text-xs text-ink/60">{form}</code>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-sm">
              Finale <span className="text-ink/60">(finale.riv · Reveal)</span>
            </h3>
            <div className="flex flex-wrap items-end gap-6">
              <FinaleView
                winner={1}
                revealedStars={1}
                names={{ 1: "Leo", 2: "Marta" }}
                className="text-ink"
              />
              <FinaleView
                winner={2}
                revealedStars={3}
                names={{ 1: "Leo", 2: "Marta" }}
                className="text-ink"
              />
              <FinaleView
                winner="draw"
                revealedStars={3}
                names={{ 1: "Leo", 2: "Marta" }}
                className="text-ink"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
