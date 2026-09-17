import type { Seat } from "@/engine";

export type DiaryEntry = {
  id: string;
  round: number;
  seat: Seat;
  kind: "question" | "challenge" | "event" | "coins" | "star";
  title: string;
  detail: string;
};

export type DiaryViewProps = {
  names: Record<Seat, string>;
  /** Momenti della serata, in ordine. */
  entries: DiaryEntry[];
  /** Partite passate, dalla più recente. */
  archive: {
    id: string;
    date: string;
    winner: Seat | "draw";
    stars: Record<Seat, number>;
    coins: Record<Seat, number>;
  }[];
};

const SEATS: Seat[] = [1, 2];

const LABEL_CLASS = "text-xs tracking-[0.15em] uppercase";

/** Diario — momenti della serata a sinistra, archivio delle partite a destra. */
export function DiaryView({ names, entries, archive }: DiaryViewProps) {
  return (
    <div className="w-full px-4 py-10 font-sans text-ink lg:px-10 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-4xl italic lg:text-5xl">Momenti della serata</h2>

          {entries.length === 0 ? (
            <p className="mt-6 border border-ink bg-paper px-4 py-3 text-sm">
              Nessun momento registrato: la serata non è ancora iniziata.
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  /* Le sfide hanno il bordo più spesso: si vedono a colpo d'occhio. */
                  className={`border-ink bg-paper p-4 ${entry.kind === "challenge" ? "border-2" : "border"}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`border border-ink px-2 py-1 ${LABEL_CLASS}`}>Round {entry.round}</span>
                    <span className={LABEL_CLASS}>{names[entry.seat]}</span>
                  </div>
                  <p className="mt-3 text-lg">{entry.title}</p>
                  <p className="mt-1 text-sm">{entry.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-4xl italic lg:text-5xl">Partite passate</h2>

          {archive.length === 0 ? (
            <p className="mt-6 border border-ink bg-paper px-4 py-3 text-sm">Nessuna partita in archivio.</p>
          ) : (
            archive.map((game) => (
              <article key={game.id} className="mt-6 border border-ink bg-paper p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className={LABEL_CLASS}>{game.date}</p>
                  <p className="text-sm">
                    {game.winner === "draw" ? "Pareggio" : `Vince ${names[game.winner]}`}
                  </p>
                </div>

                <dl className="mt-5 flex flex-col gap-2 text-sm">
                  {SEATS.map((seat) => (
                    <div key={seat} className="flex justify-between gap-4 border-t border-ink pt-2">
                      <dt>{names[seat]}</dt>
                      <dd>
                        {game.stars[seat]} stelle · {game.coins[seat]} monete
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
