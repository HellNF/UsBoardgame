"use client";

import { useEffect, useState } from "react";
import { RULES, SEATS, type ReflexState, type Seat } from "@/engine";
import type { MinigameViewProps } from "@/features/minigames/minigame";

/**
 * Riflessi (F4-04, D-55): un segnale parte a sorpresa e il primo che lo tocca prende il punto.
 *
 * Il momento del segnale è deciso dal server e vive nello stato (`goAt`), quindi è lo stesso per
 * le due schermate: qui si accende il pulsante quando quell'istante arriva. Il pulsante è sempre
 * acceso — chi tocca prima del segnale regala il punto all'altro, ed è parte del gioco.
 */

const SEAT_TEXT: Record<Seat, string> = { 1: "text-player-red", 2: "text-player-blue" };

export function ReflexBoard(props: MinigameViewProps) {
  // Il dispatcher passa sempre lo stato giusto: il controllo è solo difensivo.
  if (props.state.kind !== "reflex") return null;
  // La chiave sul momento del segnale rimonta la scena a ogni round: il pulsante torna
  // a "Aspetta il segnale…" senza doverlo rimettere a posto da un effetto.
  return <ReflexLive key={props.state.goAt} {...props} state={props.state} />;
}

function ReflexLive({ state, seat, onMove, names }: MinigameViewProps & { state: ReflexState }) {
  // Si accende esattamente all'istante del segnale: un conto alla rovescia a intervalli
  // mostrerebbe il segnale con un ritardo a caso (e i riflessi si misurano in decine di ms).
  //
  // Parte **sempre** spento, anche se il segnale è già passato: l'orologio non può entrare nel
  // primo disegno, altrimenti il server e il browser scrivono due cose diverse e React rifà
  // l'albero (disaccordo di idratazione, D-60). Ci pensa l'effetto qui sotto, subito dopo.
  const [signalOn, setSignalOn] = useState(false);

  const goAt = state.goAt;
  useEffect(() => {
    const at = Date.parse(goAt);
    const timer = setTimeout(() => setSignalOn(true), Math.max(0, at - Date.now()));
    return () => clearTimeout(timer);
  }, [goAt]);

  const running = state.winner === null;
  const pressed = seat !== null && state.pressed.includes(seat);

  return (
    <div className="flex flex-col items-center gap-4 font-sans text-ink">
      <p className="text-xs tracking-[0.2em] uppercase">
        Round {state.round} · meglio di {RULES.minigames.reflex.bestOf}
      </p>

      <button
        type="button"
        disabled={seat === null || !running || pressed}
        onClick={() => {
          if (seat === null || !running || pressed) return;
          onMove({ press: true });
        }}
        className={`border-4 border-ink px-10 py-8 font-display text-3xl italic disabled:cursor-not-allowed ${
          signalOn ? "bg-ink text-paper" : "border-dashed"
        }`}
      >
        {signalOn ? "Tocca!" : "Aspetta il segnale…"}
      </button>

      {state.lastRound && (
        <p className="text-sm">
          {state.lastRound.falseStart
            ? `Partenza falsa: il punto va a ${names[state.lastRound.winner]}.`
            : `Punto a ${names[state.lastRound.winner]}.`}
        </p>
      )}

      <p className="text-sm">
        {SEATS.map((who) => (
          <span key={who} className="mr-4">
            <span className={`font-semibold ${SEAT_TEXT[who]}`}>{names[who]}</span>: {state.scores[who]}
          </span>
        ))}
      </p>

      {state.winner !== null && state.winner !== "draw" && (
        <p className="font-display text-xl italic">Ha vinto {names[state.winner]}</p>
      )}
    </div>
  );
}
