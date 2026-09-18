"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { challenges } from "@/content/challenges";
import { questions } from "@/content/questions";
import type {
  Action,
  BoardLayout,
  GameEvent,
  GameSettings,
  GameState,
  ItemId,
  PlayerColor,
  Seat,
} from "@/engine";
import { Board } from "@/features/board/board";
import { useMoveQueue } from "@/features/board/use-move-queue";
import { CardPanel } from "@/features/cards/card-panel";
import { Dice } from "@/features/dice/dice";
import { FinalScreen } from "@/features/game/final-screen";
import { SidePanel } from "@/features/game/side-panel";
import { useRoomRealtime, type RoomRow } from "@/features/presence/use-room-realtime";

/**
 * Partita collegata ai dati veri (F2-01, F2-03, F2-04).
 *
 * Lo stato arriva **sempre dal server**: il browser non calcola mai l'esito di una mossa, manda
 * un'azione a `POST /api/games/[gameId]/actions` e prende lo stato che torna. Gli eventi
 * servono solo ad animare (pedina, carte) e a raccontare.
 *
 * Quando arriva un `409` (qualcuno ha giocato prima) il client si riallinea sullo stato fresco
 * che accompagna la risposta, senza perdere nulla. Il canale Realtime porta le mosse dell'altro
 * posto e la sua presenza.
 *
 * I componenti sono quelli del pacchetto C (tabellone, carte, pannello, dadi, schermata finale):
 * qui c'è solo il caricamento dei dati e l'invio delle azioni.
 */

export type OnlineTableProps = {
  code: string;
  gameId: string;
  seat: Seat;
  version: number;
  state: GameState;
  board: BoardLayout;
  names: Record<Seat, string>;
  colors: Record<Seat, PlayerColor>;
  settings: GameSettings;
  roomId: string;
};

type ActionResponse = {
  state?: GameState;
  version?: number;
  events?: GameEvent[];
  error?: string;
};

/** Ultime stelle bonus annunciate dagli eventi: le rivela la schermata finale. */
function lastBonusStars(events: GameEvent[]): { knowItAll: Seat | null; champion: Seat | null } | null {
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index];
    if (event.type === "BONUS_STARS") return { knowItAll: event.knowItAll, champion: event.champion };
  }
  return null;
}

export function OnlineTable(props: OnlineTableProps) {
  const router = useRouter();
  const [state, setState] = useState<GameState>(props.state);
  const [version, setVersion] = useState(props.version);
  // La versione mostrata, leggibile dalle richiamate del tempo reale senza rifarle a ogni cambio.
  const versionRef = useRef(props.version);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const act = useCallback(
    async (action: Action) => {
      setError(null);
      try {
        const response = await fetch(`/api/games/${props.gameId}/actions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, expectedVersion: version }),
        });
        const payload = (await response.json().catch(() => ({}))) as ActionResponse;

        if (response.status === 409) {
          // Riallineamento: lo stato del server vince, senza ricalcolare nulla (D-23).
          if (payload.state) setState(payload.state);
          if (typeof payload.version === "number") setVersion(payload.version);
          setNotice(payload.error ?? "Qualcuno ha giocato prima di te: stato ricaricato.");
          return;
        }
        if (!response.ok) {
          setError(payload.error ?? "Il motore ha rifiutato l'azione.");
          return;
        }
        if (payload.state) setState(payload.state);
        if (typeof payload.version === "number") setVersion(payload.version);
        if (payload.events) setEvents((previous) => [...previous, ...(payload.events ?? [])]);
        setNotice(null);
      } catch {
        setError("Errore di rete: l'azione non è arrivata al server.");
      }
    },
    [props.gameId, version],
  );

  // Una riga più vecchia di quella che si sta già mostrando non deve riportare indietro il
  // tabellone: può succedere se la risposta del proprio `POST` arriva prima del messaggio di
  // tempo reale dell'azione precedente.
  const onGame = useCallback((row: RoomRow) => {
    if (typeof row.version !== "number" || row.version < versionRef.current) return;
    if (row.state) setState(row.state);
    setVersion(row.version);
  }, []);

  const onEvents = useCallback((incoming: GameEvent[]) => {
    setEvents((previous) => [...previous, ...incoming]);
  }, []);

  /**
   * «Nuova partita» dalla schermata finale: apre davvero la serata nuova e porta in lobby.
   * Prima si limitava a passare al diario, e da quando la serata conclusa resta la schermata
   * finale (D-64) sarebbe un vicolo cieco: nessun modo di ricominciare.
   */
  const startNewEvening = useCallback(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/rooms/${props.code}/games`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "new" }),
        });
        if (!response.ok) {
          setError("Non è stato possibile aprire una serata nuova: riprova.");
          return;
        }
        router.push(`/r/${props.code}/lobby`);
      } catch {
        setError("Errore di rete: la serata nuova non è partita.");
      }
    })();
  }, [props.code, router]);

  const { otherConnected } = useRoomRealtime({
    roomId: props.roomId,
    gameId: props.gameId,
    seat: props.seat,
    screen: "game",
    onGame,
    onEvents,
  });

  const question = useMemo(() => {
    const card = state.card;
    return card?.type === "question" ? (questions.find((item) => item.id === card.questionId) ?? null) : null;
  }, [state.card]);

  const challenge = useMemo(() => {
    const card = state.card;
    return card?.type === "challenge"
      ? (challenges.find((item) => item.id === card.challengeId) ?? null)
      : null;
  }, [state.card]);

  const bonus = lastBonusStars(events);

  // Un movimento per volta, in ordine: dal tempo reale possono arrivare due righe insieme (F2-05).
  const moves = useMoveQueue(props.board, events);
  // I tiri fatti finora: è il contatore che fa scattare `roll` in `dice.riv` (H2).
  const rollCount = events.filter((event) => event.type === "ROLLED").length;

  const finished = state.phase === "finished";
  const myTurn = state.turn === props.seat && !finished;
  const canRoll = state.phase === "pre_roll" && myTurn;

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <div className="flex flex-wrap items-center gap-3 font-sans text-sm">
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">Stanza {props.code}</span>
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">Posto {props.seat}</span>
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">
          {myTurn ? "Tocca a te" : `Tocca a ${props.names[state.turn]}`}
        </span>
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">
          {otherConnected ? "L'altro è collegato" : "L'altro non è collegato"}
        </span>
        <a className="ml-auto underline" href={`/r/${props.code}/diary`}>
          Diario
        </a>
      </div>

      {notice && (
        <p role="status" className="border-2 border-ink px-4 py-2 font-sans text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p role="status" className="border-2 border-ink px-4 py-2 font-sans text-sm">
          Il motore ha rifiutato l&apos;azione: {error}
        </p>
      )}

      <div className="grid w-full gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_26rem] lg:grid-rows-[minmax(0,1fr)] lg:gap-4">
        <div className="flex flex-col gap-4 lg:min-h-0">
          <div className="mx-auto w-full max-w-[38rem] lg:flex lg:min-h-0 lg:max-w-none lg:flex-1">
            <Board
              board={props.board}
              state={state}
              names={props.names}
              colors={props.colors}
              pawns={props.settings.pawns}
              moves={moves}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:min-h-0 lg:overflow-y-auto">
          {finished ? (
            <FinalScreen
              state={state}
              names={props.names}
              colors={props.colors}
              bonus={bonus}
              stake={props.settings.stake}
              onRestart={startNewEvening}
            />
          ) : (
            <>
              <Dice
                roll={state.lastRoll}
                canRoll={canRoll}
                onRoll={() => void act({ type: "ROLL", seat: props.seat })}
                blockedReason={
                  myTurn ? "Prima si risolve la carta aperta." : `Tocca a ${props.names[state.turn]}.`
                }
                singleDie={state.singleDie}
                rollCount={rollCount}
              />

              <CardPanel
                state={state}
                question={question}
                challenge={challenge}
                act={(action) => void act(action)}
                now={now}
                names={props.names}
                /* Partita vera: ogni schermo vede i comandi del posto che guarda. */
                viewerSeat={props.seat}
              />
            </>
          )}

          <SidePanel
            state={state}
            names={props.names}
            colors={props.colors}
            stake={props.settings.stake}
            onBuyItem={(item: ItemId) => void act({ type: "BUY_ITEM", seat: state.turn, item })}
            onUseItem={(item: ItemId, loadedDieValue?: number) =>
              void act({ type: "USE_ITEM", seat: state.turn, item, loadedDieValue })
            }
          />
        </div>
      </div>
    </div>
  );
}
