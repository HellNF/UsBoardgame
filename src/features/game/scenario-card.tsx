"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { challenges } from "@/content/challenges";
import { questions } from "@/content/questions";
import { reduce, SEATS, type Action, type GameState } from "@/engine";
import { CardPanel } from "@/features/cards/card-panel";
import type { Viewer } from "@/features/cards/viewer";
import { plural } from "@/lib/plural";
import { createHotseatContext, HOTSEAT_SETTINGS } from "./dev-context";
import { SCENARIO_NAMES, startState, type Scenario } from "./dev-scenarios";
import { FinalScreen } from "./final-screen";

/**
 * Uno scenario della pagina `/dev/scenari`: la carta viva e cliccabile di uno stato
 * fissato a mano. Non c'è un tabellone né un turno da giocare, solo la carta.
 *
 * Il reducer gira nel browser con l'`EngineContext` finto della hot seat (D-43): è la
 * stessa eccezione alla regola 1 di AGENTS.md, confinata alle pagine di sviluppo.
 */

export type ScenarioCardProps = { scenario: Scenario };

/** Nessuna sorgente esterna da seguire: serve solo a distinguere server e browser. */
const subscribeNothing = () => () => {};

/**
 * Vero solo nel browser. Il server rende il segnaposto e il client il primo render
 * uguale: la carta compare al secondo render, senza disaccordi di idratazione sul
 * conto alla rovescia (la scadenza dei timer è un istante assoluto).
 */
const useMounted = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

/** Riquadro con titolo, riga di spiegazione e carta giocabile. */
export function ScenarioCard({ scenario }: ScenarioCardProps) {
  return (
    <article id={scenario.id} className="flex scroll-mt-6 flex-col gap-3 border-4 border-ink/25 p-4">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-2xl italic">{scenario.title}</h2>
        <p className="font-sans text-sm text-ink/70">{scenario.description}</p>
      </header>
      <ScenarioLive scenario={scenario} />
    </article>
  );
}

/**
 * Interruttore «chi guarda»: la stessa carta vista dal posto 1, dal posto 2 o da tutti e
 * due (come nella hot seat). È il modo di controllare le due viste della partita a due
 * schermi senza database e senza due browser (F3-03, F4-02, F4-06, F5-05).
 */
function ViewerSwitch({ viewer, onChange }: { viewer: Viewer; onChange: (viewer: Viewer) => void }) {
  const options: { value: Viewer; label: string }[] = [
    { value: 1, label: `Guarda come posto 1 (${SCENARIO_NAMES[1]})` },
    { value: 2, label: `Guarda come posto 2 (${SCENARIO_NAMES[2]})` },
    { value: "all", label: "Tutti e due (hot seat)" },
  ];
  return (
    <div
      role="group"
      aria-label="Chi guarda la carta"
      className="flex flex-wrap items-center gap-2 font-sans text-xs"
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={viewer === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border-2 border-ink px-3 py-1 ${
            viewer === option.value ? "bg-ink text-paper" : "hover:bg-ink hover:text-paper"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * La carta dello scenario. Si monta solo nel browser: il segnale dei riflessi è un istante
 * assoluto, quindi renderla anche sul server darebbe un segnale diverso da quello del client.
 */
function ScenarioLive({ scenario }: ScenarioCardProps) {
  const mounted = useMounted();
  const ctx = useMemo(() => createHotseatContext({ seed: 7 }), []);
  const [state, setState] = useState<GameState>(() => startState(scenario));
  const [error, setError] = useState<string | null>(null);
  // Chi guarda la carta: è l'interruttore della pagina, per vedere le due viste senza database.
  const [viewer, setViewer] = useState<Viewer>(1);

  // Il reducer vuole lo stato più fresco: il ref evita di ricreare `act` a ogni azione.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const act = useCallback(
    (action: Action) => {
      const result = reduce(stateRef.current, action, ctx);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState(result.state);
      setError(null);
    },
    [ctx],
  );

  const reset = useCallback(() => {
    setState(startState(scenario));
    setError(null);
  }, [scenario]);

  if (!mounted) {
    return <p className="font-sans text-sm italic">Carico lo scenario…</p>;
  }

  const card = state.card;
  const question =
    card?.type === "question" ? (questions.find((item) => item.id === card.questionId) ?? null) : null;
  const challenge =
    card?.type === "challenge" ? (challenges.find((item) => item.id === card.challengeId) ?? null) : null;
  const finished = state.phase === "finished";

  return (
    <div className="flex flex-col gap-3">
      <ViewerSwitch viewer={viewer} onChange={setViewer} />
      {card !== null ? (
        <CardPanel
          state={state}
          question={question}
          challenge={challenge}
          act={act}
          names={SCENARIO_NAMES}
          viewerSeat={viewer}
        />
      ) : finished ? (
        <FinalScreen
          state={state}
          names={SCENARIO_NAMES}
          colors={HOTSEAT_SETTINGS.colors}
          bonus={scenario.bonus ?? null}
          stake={HOTSEAT_SETTINGS.stake}
          onRestart={reset}
        />
      ) : (
        <p className="font-sans text-sm italic">
          Carta risolta: premi «Ricomincia lo scenario» per rivederla.
        </p>
      )}

      {error && (
        <p role="status" className="border-2 border-ink px-3 py-2 font-sans text-sm">
          Il motore ha rifiutato l&apos;azione: {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border-2 border-ink px-4 py-1 font-sans text-sm hover:bg-ink hover:text-paper"
        >
          Ricomincia lo scenario
        </button>
        {/* Riga di controllo: dopo un clic si vede subito dove sono finiti i posti e i conti. */}
        <span className="font-sans text-xs text-ink/60">
          round {state.round} · tocca al posto {state.turn} · {state.phase}
        </span>
        {SEATS.map((seat) => {
          const player = state.players[seat];
          return (
            <span key={seat} className="font-sans text-xs text-ink/60">
              {SCENARIO_NAMES[seat]}: casella {player.position} · {plural(player.coins, "moneta", "monete")} ·{" "}
              {plural(player.stars, "stella", "stelle")}
              {player.items.length > 0 && ` · ${plural(player.items.length, "oggetto", "oggetti")}`}
            </span>
          );
        })}
      </div>
    </div>
  );
}
