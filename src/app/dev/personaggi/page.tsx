import { notFound } from "next/navigation";

import { CHARACTERS, characterIds, MOODS_BY_NUMBER } from "@/art/characters";

/**
 * Personaggi (`src/art/characters`): i sei animali, alle due misure che contano.
 *
 * **34 px** è quanto misura una pedina in una casella del tabellone (una casella è 48 px, la
 * pedina ne occupa il 70%): è lì che si decide se un animale si riconosce, e per questo la
 * prima colonna è quella. Sotto, ogni animale a 110 px con i cinque umori, che è la misura
 * della mascotte nel pannello di destra.
 *
 * La riga nera non è un vezzo: sul tabellone le caselle sfida sono nere e la pedina ci finisce
 * sopra, quindi ogni personaggio deve reggere anche lo sfondo d'inchiostro.
 *
 * Pagina **di sviluppo**: in produzione risponde 404 come `/dev/art` (D-43).
 */
export default function PersonaggiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-8 p-6 font-sans text-ink">
      <header className="flex flex-col gap-2 border-b-4 border-ink pb-3">
        <h1 className="font-display text-3xl italic">Personaggi</h1>
        <p className="max-w-3xl text-sm text-ink/70">
          Sei animali, un file per animale in <code>src/art/characters</code>. Lo stesso disegno fa la pedina
          sul tabellone e la mascotte del pannello: a 34 px con la pedana del colore e il numero del posto, a
          110 px con l&apos;espressione. Il colore del giocatore sta fuori dal disegno, nella pedana.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl italic">
          Pedine <span className="font-sans text-sm not-italic">(34 px, la misura in una casella)</span>
        </h2>
        <div className="flex flex-col divide-y-2 divide-ink/20 border-y-2 border-ink/20">
          {characterIds.map((id) => {
            const { name, Draw } = CHARACTERS[id];
            return (
              <div key={id} className="flex flex-wrap items-center gap-6 py-3">
                <code className="w-28 text-xs">{id}</code>
                <span className="w-20 text-sm">{name}</span>
                <span title="34 px, posto 1">
                  <Draw size={34} base="red" seat={1} />
                </span>
                <span title="34 px, posto 2">
                  <Draw size={34} base="blue" seat={2} />
                </span>
                {/* Sopra una casella sfida, che è nera. */}
                <span className="bg-ink p-[7px]" title="34 px su casella nera">
                  <Draw size={34} base="blue" seat={2} />
                </span>
                <span title="senza pedana, 34 px">
                  <Draw size={34} />
                </span>
                <span title="senza pedana, 64 px">
                  <Draw size={64} />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl italic">
          Umori <span className="font-sans text-sm not-italic">(110 px, la misura della mascotte)</span>
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-6 pl-28 text-xs text-ink/60">
            {MOODS_BY_NUMBER.map((mood, index) => (
              <span key={mood} className="w-[110px] text-center">
                {index} · {mood}
              </span>
            ))}
          </div>
          <div className="flex flex-col divide-y-2 divide-ink/20 border-y-2 border-ink/20">
            {characterIds.map((id) => {
              const { name, Draw } = CHARACTERS[id];
              return (
                <div key={id} className="flex flex-wrap items-center gap-6 py-3">
                  <span className="w-28 text-sm">{name}</span>
                  {MOODS_BY_NUMBER.map((mood) => (
                    <span key={mood} title={mood}>
                      <Draw size={110} mood={mood} />
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
