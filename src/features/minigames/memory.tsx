"use client";

import { motion } from "motion/react";
import type { Seat } from "@/engine";
import { ENTER_TRANSITION, useEnterFrom } from "@/features/minigames/enter";
import type { MinigameViewProps } from "@/features/minigames/minigame";

/** Memory: 12 carte (6 coppie) in griglia 4 × 3. */

const SYMBOLS = ["A", "B", "C", "D", "E", "F"];

/**
 * Turno o esito in una riga. Copiata dai tabelloni invece di importarla dal dispatcher
 * per non creare un ciclo di import `minigame.tsx` ↔ tabelloni.
 */
const statusText = (winner: Seat | "draw" | null, turn: Seat, names: Record<Seat, string>): string => {
  if (winner === "draw") return "Pareggio";
  if (winner !== null) return `Ha vinto ${names[winner]}`;
  return `Tocca a ${names[turn]}`;
};

/**
 * La faccia della carta girata adesso. `enter` è vero quando la carta si è appena scoperta
 * (F2-05): entra con un mezzo giro, così si vede che qualcuno l'ha girata. Le carte che si
 * richiudono spariscono senza animazione — la coppia sbagliata resta scoperta il tempo di
 * vederla (lo decide `revealDelay`), e dopo coprirla è la mossa successiva.
 */
function Face({ symbol, enter }: { symbol: string; enter: boolean }) {
  const initial = useEnterFrom({ scale: 0.7, opacity: 0 }, enter);
  return (
    <motion.span
      initial={initial}
      animate={{ scale: 1, opacity: 1 }}
      transition={ENTER_TRANSITION}
      className="font-display text-3xl italic"
    >
      {symbol}
    </motion.span>
  );
}

export function MemoryBoard(props: MinigameViewProps) {
  const { state, seat, onMove, names, entering = [] } = props;

  // Il dispatcher passa sempre lo stato giusto: il controllo è solo difensivo.
  if (state.kind !== "memory") return null;

  const highlight: Seat | null =
    state.winner === null ? state.turn : state.winner === "draw" ? null : state.winner;
  const dotClass =
    highlight === 1
      ? "bg-player-red"
      : highlight === 2
        ? "bg-player-blue"
        : "border-2 border-ink bg-transparent";

  return (
    <div className="flex flex-col items-center gap-4 font-sans text-ink">
      {/* Punteggio: il colore è ammesso solo sui giocatori e sui loro punteggi. */}
      <p className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
        <span className="text-player-red">
          {names[1]} {state.pairs[1]}
        </span>
        <span aria-hidden="true">·</span>
        <span className="text-player-blue">
          {names[2]} {state.pairs[2]}
        </span>
      </p>

      <div className="mx-auto grid w-full max-w-[min(34rem,64vh)] grid-cols-4 gap-3">
        {state.cards.map((value, index) => {
          // Una carta resta scoperta anche quando la coppia è già stata incassata.
          const matched = state.matched[index];
          const faceUp = matched || state.revealed.includes(index);
          const symbol = SYMBOLS[value % SYMBOLS.length];
          const playable = !faceUp && seat !== null;

          return (
            <button
              key={index}
              type="button"
              disabled={!playable}
              onClick={() => onMove({ index })}
              aria-label={faceUp ? `Carta ${index + 1}, ${symbol}` : `Carta ${index + 1}, coperta`}
              className={`flex aspect-square items-center justify-center ${
                playable ? "cursor-pointer" : "cursor-default"
              } ${faceUp ? "border-2 border-ink bg-paper" : "bg-ink"}`}
            >
              {faceUp ? (
                <Face symbol={symbol} enter={entering.includes(index)} />
              ) : (
                // Rombo bianco: la faccia coperta è un rettangolo nero pieno.
                <span className="size-3 rotate-45 bg-paper" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
        <span className={`size-3 rounded-full ${dotClass}`} aria-hidden="true" />
        {statusText(state.winner, state.turn, names)}
      </p>
    </div>
  );
}
