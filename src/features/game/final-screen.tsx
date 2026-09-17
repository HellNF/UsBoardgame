"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { RULES, type GameState, type PlayerColor, type Seat } from "@/engine";
import { plural } from "@/lib/plural";

/**
 * Schermata finale (task F1-05, rules.md § Fine partita): le stelle bonus si rivelano
 * una alla volta, poi si scoprono vincitore e posta in palio.
 */

export type FinalScreenProps = {
  state: GameState;
  names: Record<Seat, string>;
  colors: Record<Seat, PlayerColor>;
  /** Stelle bonus di fine partita: Sapientone e Campione (null se in pareggio). */
  bonus: { knowItAll: Seat | null; champion: Seat | null } | null;
  stake: string;
  onRestart: () => void;
};

export function FinalScreen({ state, names, colors, bonus, stake, onRestart }: FinalScreenProps) {
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= 3;

  const reveal = () => setRevealed((value) => Math.min(3, value + 1));

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-xl border-4 border-ink bg-paper p-6">
      <header>
        <h1 className="font-display text-3xl italic">Serata finita</h1>
        <p className="font-sans text-sm text-ink/70">
          {done
            ? `In palio c'era: ${stake}`
            : "Le stelle bonus si scoprono una alla volta: premi il pulsante."}
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {([1, 2] as Seat[]).map((seat) => (
          <li key={seat} className="flex items-center gap-3 border-b-2 border-ink/20 pb-2">
            <span
              className="h-4 w-4 rounded-full border border-ink"
              style={{ background: `var(--color-player-${colors[seat]})` }}
            />
            <span className="font-display text-xl italic">{names[seat]}</span>
            <span className="ml-auto font-sans">
              {plural(state.players[seat].stars, "stella", "stelle")} ·{" "}
              {plural(state.players[seat].coins, "moneta", "monete")} ·{" "}
              {plural(state.players[seat].stats.correctAnswers, "risposta giusta", "risposte giuste")} ·{" "}
              {plural(state.players[seat].stats.challengesWon, "sfida vinta", "sfide vinte")}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex min-h-[7rem] flex-col gap-2">
        {revealed >= 1 && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-sans">
            <strong>Sapientone</strong> (+{RULES.stars.knowItAllBonus}):{" "}
            {bonus?.knowItAll ? (
              <>{names[bonus.knowItAll]} ha risposto bene più spesso.</>
            ) : (
              "nessuno: stesse risposte giuste."
            )}
          </motion.p>
        )}
        {revealed >= 2 && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-sans">
            <strong>Campione</strong> (+{RULES.stars.championBonus}):{" "}
            {bonus?.champion ? (
              <>{names[bonus.champion]} ha vinto più sfide.</>
            ) : (
              "nessuno: stesso numero di sfide."
            )}
          </motion.p>
        )}
        {done && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <h2 className="font-display text-3xl italic">
              {state.winner === "draw" ? "Pareggio" : `Vince ${names[state.winner as Seat]}`}
            </h2>
            <p className="font-sans text-sm text-ink/70">
              Più stelle, a parità più monete ({RULES.stars.finishBonus} stelle a chi è arrivato per primo
              alla 100).
            </p>
          </motion.div>
        )}
      </div>

      <div className="flex gap-3">
        {!done && (
          <button
            type="button"
            onClick={reveal}
            className="rounded-full border-4 border-ink bg-ink px-6 py-2 font-sans text-paper"
          >
            Rivela la prossima stella
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full border-4 border-ink px-6 py-2 font-sans"
        >
          Nuova partita
        </button>
      </div>
    </section>
  );
}
