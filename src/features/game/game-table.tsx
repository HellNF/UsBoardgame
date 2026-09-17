"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/features/board/board";
import { CardPanel } from "@/features/cards/card-panel";
import { Dice } from "@/features/dice/dice";
import { challenges } from "@/content/challenges";
import { questions } from "@/content/questions";
import {
  createInitialState,
  otherSeat,
  reduce,
  type Action,
  type GameEvent,
  type GameSettings,
  type GameState,
  type ItemId,
  type Seat,
} from "@/engine";
import {
  createHotseatContext,
  HOTSEAT_CHALLENGE_CONTENT,
  HOTSEAT_NOTES,
  HOTSEAT_SETTINGS,
} from "./dev-context";
import { FinalScreen } from "./final-screen";
import { SidePanel } from "./side-panel";

/**
 * Tavolo della partita in hot seat (task F1-05): il reducer gira nel browser con un
 * `EngineContext` finto, i due giocatori usano lo stesso schermo.
 *
 * **Eccezione alla regola 1 di AGENTS.md**, valida solo qui: nelle partite vere le regole
 * girano sul server (docs/decisions.md D-43). La pagina che usa questo componente risponde
 * 404 in produzione.
 */

export type GameTableProps = {
  /** Seme del caso: la stessa partita si ripete (default 1). */
  seed?: number;
  firstSeat?: Seat;
  names?: Record<Seat, string>;
  settings?: Partial<GameSettings>;
};

const DEFAULT_NAMES: Record<Seat, string> = { 1: "Giocatore 1", 2: "Giocatore 2" };

export function GameTable({ seed = 1, firstSeat = 1, names = DEFAULT_NAMES, settings }: GameTableProps) {
  const [sessionSeed, setSessionSeed] = useState(seed);
  const [state, setState] = useState<GameState>(() =>
    createInitialState({ ...HOTSEAT_SETTINGS, ...settings }, firstSeat),
  );
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const allSettings = useMemo<GameSettings>(() => ({ ...HOTSEAT_SETTINGS, ...settings }), [settings]);
  const ctx = useMemo(
    () => createHotseatContext({ seed: sessionSeed, settings: allSettings }),
    [sessionSeed, allSettings],
  );

  // Il reducer vuole sempre lo stato più fresco: il ref evita di ricreare `act` a ogni turno.
  const stateRef = useRef(state);
  // Aggiornato in un effetto, mai durante il render (regola react-hooks/refs).
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Esegue un'azione; se il motore la rifiuta mostra il motivo senza cambiare nulla. */
  const act = useCallback(
    (action: Action) => {
      const result = reduce(stateRef.current, action, ctx);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState(result.state);
      setEvents((previous) => [...previous, ...result.events]);
      setError(null);
    },
    [ctx],
  );

  // Orologio della pagina: serve al conto alla rovescia delle sfide.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /** Strumenti di prova: toccano lo stato direttamente, senza passare dalle regole. */
  const tweak = useCallback((change: (draft: GameState) => void) => {
    setState((current) => {
      const copy = structuredClone(current);
      change(copy);
      copy.version += 1;
      return copy;
    });
    setError(null);
  }, []);

  const restart = useCallback(() => {
    setState(createInitialState(allSettings, firstSeat));
    setEvents([]);
    setError(null);
    setSessionSeed((value) => value + 1);
  }, [allSettings, firstSeat]);

  const question = useMemo(() => {
    const card = state.card;
    if (card?.type !== "question") return null;
    return questions.find((item) => item.id === card.questionId) ?? null;
  }, [state.card]);

  const challenge = useMemo(() => {
    const card = state.card;
    if (card?.type !== "challenge") return null;
    const deck = [...challenges, ...HOTSEAT_CHALLENGE_CONTENT];
    return deck.find((item) => item.id === card.challengeId) ?? null;
  }, [state.card]);

  const bonus = (() => {
    for (let index = events.length - 1; index >= 0; index--) {
      const event = events[index];
      if (event.type === "BONUS_STARS") return { knowItAll: event.knowItAll, champion: event.champion };
    }
    return null;
  })();

  // Ultimo spostamento per posto, preso dagli eventi: lo usa l'animazione della pedina.
  const moves = useMemo(() => {
    const result: Partial<Record<Seat, { from: number; to: number }>> = {};
    for (const event of events) {
      if (event.type === "MOVED") result[event.seat] = { from: event.from, to: event.to };
    }
    return result;
  }, [events]);

  const finished = state.phase === "finished";
  const canRoll = state.phase === "pre_roll";
  const blockedReason = finished
    ? "La partita è finita."
    : state.phase === "resolving"
      ? "Prima si risolve la carta aperta."
      : `Tocca a ${names[state.turn]}.`;

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex flex-col gap-4">
        <div className="mx-auto w-full max-w-[38rem] lg:max-w-none">
          <Board board={ctx.board} state={state} names={names} colors={allSettings.colors} moves={moves} />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {finished ? (
          <FinalScreen
            state={state}
            names={names}
            colors={allSettings.colors}
            bonus={bonus}
            stake={allSettings.stake}
            onRestart={restart}
          />
        ) : (
          <>
            <Dice
              roll={state.lastRoll}
              canRoll={canRoll}
              onRoll={() => act({ type: "ROLL", seat: state.turn })}
              blockedReason={blockedReason}
              singleDie={state.singleDie}
            />

            <CardPanel
              state={state}
              question={question}
              challenge={challenge}
              act={act}
              now={now}
              names={names}
            />
          </>
        )}

        {error && (
          <p role="status" className="rounded border-2 border-ink px-3 py-2 font-sans text-sm">
            Il motore ha rifiutato l&apos;azione: {error}
          </p>
        )}

        <SidePanel
          state={state}
          names={names}
          colors={allSettings.colors}
          stake={allSettings.stake}
          onBuyItem={(item: ItemId) => act({ type: "BUY_ITEM", seat: state.turn, item })}
          onUseItem={(item: ItemId, loadedDieValue?: number) =>
            act({ type: "USE_ITEM", seat: state.turn, item, loadedDieValue })
          }
        />

        <details className="rounded border-2 border-dashed border-ink/50 px-3 py-2 font-sans text-xs">
          <summary className="cursor-pointer">Strumenti di prova (solo sviluppo)</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border-2 border-ink px-2 py-1"
              onClick={() =>
                tweak((draft) => {
                  draft.phase = "pre_roll";
                  draft.card = null;
                  draft.players[1].position = 97;
                  draft.players[2].position = 93;
                })
              }
            >
              Avvicina alla 100
            </button>
            <button
              type="button"
              className="rounded border-2 border-ink px-2 py-1"
              onClick={() =>
                tweak((draft) => {
                  draft.players[1].coins += 10;
                  draft.players[2].coins += 10;
                })
              }
            >
              10 monete a testa
            </button>
            {/* Serve a provare a occhio le caselle rare (domande, imprevisti, stelle). */}
            <label className="flex items-center gap-1 rounded border-2 border-ink px-2 py-1">
              Il giocatore di turno va alla casella
              <input
                type="number"
                min={1}
                max={100}
                defaultValue={4}
                onChange={(event) => {
                  const cell = Number(event.target.value);
                  if (!Number.isInteger(cell) || cell < 1 || cell > 100) return;
                  tweak((draft) => {
                    draft.phase = "pre_roll";
                    draft.card = null;
                    draft.players[draft.turn].position = cell;
                  });
                }}
                className="w-16 rounded border-2 border-ink bg-paper px-1 text-center"
              />
            </label>
            <button
              type="button"
              className="rounded border-2 border-ink px-2 py-1"
              onClick={() =>
                tweak((draft) => {
                  draft.players[1].items = ["single_die", "loaded_die"];
                  draft.players[2].items = ["antidote", "portable_ladder"];
                })
              }
            >
              Un paio di oggetti a testa
            </button>
            <button type="button" className="rounded border-2 border-ink px-2 py-1" onClick={restart}>
              Nuova partita
            </button>
          </div>
          <ul className="mt-2 list-disc pl-4">
            {HOTSEAT_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
            <li>
              Il turno è di {names[state.turn]}
              {otherSeat(state.turn) === 1 ? " (l'altro è Giocatore 1)" : ""}.
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}
