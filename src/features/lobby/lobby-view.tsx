"use client";

import type { Seat } from "@/engine";

export type LobbyViewProps = {
  boardNames: { id: string; name: string }[];
  boardId: string;
  onBoardChange: (id: string) => void;
  categoryOptions: { id: string; label: string }[];
  activeCategories: string[];
  onToggleCategory: (id: string) => void;
  maxChallengeSeconds: number;
  onMaxChallengeSecondsChange: (seconds: number) => void;
  stake: string;
  onStakeChange: (stake: string) => void;
  pawns: Record<Seat, string>;
  colors: Record<Seat, string>;
  ready: Record<Seat, boolean>;
  onToggleReady: (seat: Seat) => void;
  names: Record<Seat, string>;
};

/** Durate massime proposte in lobby (docs/specs.md § Sfide). */
const DURATIONS: { seconds: number; label: string }[] = [
  { seconds: 30, label: "30 secondi" },
  { seconds: 60, label: "1 minuto" },
  { seconds: 300, label: "5 minuti" },
];

/** Nomi italiani di pedine e colori: i valori grezzi arrivano dal server. */
const PAWN_LABELS: Record<string, string> = {
  fox: "Volpe",
  rabbit: "Coniglio",
  cat: "Gatto",
  bear: "Orso",
  frog: "Rana",
  owl: "Gufo",
};

const COLOR_LABELS: Record<string, string> = {
  red: "Rosso",
  blue: "Blu",
  green: "Verde",
  ochre: "Ocra",
};

/** Il colore del posto tocca solo il gettone e il bordo del riquadro. */
const SEAT_BORDER: Record<string, string> = {
  red: "border-player-red",
  blue: "border-player-blue",
  green: "border-player-green",
  ochre: "border-player-ochre",
};

const SEAT_TOKEN: Record<string, string> = {
  red: "bg-player-red",
  blue: "bg-player-blue",
  green: "bg-player-green",
  ochre: "bg-player-ochre",
};

const FOCUS_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const LABEL_CLASS = "text-xs tracking-[0.15em] uppercase";

/** Pulsante di scelta: attivo = nero pieno, spento = solo bordo. */
const optionClass = (active: boolean) =>
  `border border-ink px-4 py-2 text-xs tracking-[0.15em] uppercase ${FOCUS_CLASS} ${
    active ? "bg-ink text-paper" : "bg-paper text-ink"
  }`;

const SEATS: Seat[] = [1, 2];

/** Lobby — impostazioni della serata a sinistra, i due posti a destra. */
export function LobbyView({
  boardNames,
  boardId,
  onBoardChange,
  categoryOptions,
  activeCategories,
  onToggleCategory,
  maxChallengeSeconds,
  onMaxChallengeSecondsChange,
  stake,
  onStakeChange,
  pawns,
  colors,
  ready,
  onToggleReady,
  names,
}: LobbyViewProps) {
  return (
    <div className="w-full px-4 py-10 font-sans text-ink lg:px-10 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-8">
          <h2 className="font-display text-4xl italic lg:text-5xl">Impostazioni della serata</h2>

          <fieldset className="border border-ink bg-paper p-5">
            <legend className={`px-2 ${LABEL_CLASS}`}>Disposizione</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {boardNames.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  aria-pressed={board.id === boardId}
                  onClick={() => onBoardChange(board.id)}
                  className={optionClass(board.id === boardId)}
                >
                  {board.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="border border-ink bg-paper p-5">
            <legend className={`px-2 ${LABEL_CLASS}`}>Categorie di sfida</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryOptions.map((option) => {
                const active = activeCategories.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onToggleCategory(option.id)}
                    className={optionClass(active)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border border-ink bg-paper p-5">
            <legend className={`px-2 ${LABEL_CLASS}`}>Durata massima di una sfida</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATIONS.map((duration) => (
                <button
                  key={duration.seconds}
                  type="button"
                  aria-pressed={duration.seconds === maxChallengeSeconds}
                  onClick={() => onMaxChallengeSecondsChange(duration.seconds)}
                  className={optionClass(duration.seconds === maxChallengeSeconds)}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2">
            <span className={LABEL_CLASS}>Posta in palio</span>
            <input
              value={stake}
              onChange={(event) => onStakeChange(event.target.value)}
              spellCheck={false}
              className={`w-full border border-ink bg-paper px-3 py-3 text-lg ${FOCUS_CLASS}`}
            />
          </label>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-display text-4xl italic lg:text-5xl">I due posti</h2>

          {SEATS.map((seat) => {
            const initial = names[seat].trim().charAt(0).toUpperCase() || String(seat);
            const isReady = ready[seat];
            return (
              <article
                key={seat}
                className={`border-2 bg-paper p-5 ${SEAT_BORDER[colors[seat]] ?? "border-ink"}`}
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-2xl text-paper italic ${
                      SEAT_TOKEN[colors[seat]] ?? "bg-ink"
                    }`}
                  >
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg">{names[seat]}</p>
                    <p className={LABEL_CLASS}>Posto {seat}</p>
                  </div>
                </div>

                <dl className="mt-5 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt>Pedina</dt>
                    <dd>{PAWN_LABELS[pawns[seat]] ?? pawns[seat]}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Colore</dt>
                    <dd>{COLOR_LABELS[colors[seat]] ?? colors[seat]}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  aria-pressed={isReady}
                  onClick={() => onToggleReady(seat)}
                  className={`mt-6 w-full ${optionClass(isReady)}`}
                >
                  {isReady ? "Pronto" : "Sono pronto"}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
