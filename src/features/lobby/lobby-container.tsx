"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { GameSettings, Seat } from "@/engine";
import { LobbyView } from "@/features/lobby/lobby-view";
import { useRoomRealtime, type RoomRow } from "@/features/presence/use-room-realtime";

/**
 * Lobby collegata ai dati veri (F2-02, F2-03, F2-04): le impostazioni e il pronto passano
 * da `POST /api/rooms/[code]/games`, il resto lo porta il canale Realtime.
 * `LobbyView` resta il componente di presentazione: qui ci sono solo dati e chiamate.
 */

export type LobbyContainerProps = {
  code: string;
  roomId: string;
  gameId: string | null;
  seat: Seat;
  status: string;
  names: Record<Seat, string>;
  colors: Record<Seat, string>;
  pawns: Record<Seat, string>;
  boardNames: { id: string; name: string }[];
  settings: GameSettings;
  ready: Record<string, boolean>;
  categoryOptions: { id: string; label: string }[];
};

type LobbyResponse = { game?: { status?: string } | null; screen?: string; error?: string };

export function LobbyContainer(props: LobbyContainerProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(props.settings);
  const [ready, setReady] = useState<Record<Seat, boolean>>({
    1: props.ready["1"] === true,
    2: props.ready["2"] === true,
  });
  const [status, setStatus] = useState(props.status);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useCallback(
    async (body: Record<string, unknown>): Promise<void> => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch(`/api/rooms/${props.code}/games`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json().catch(() => ({}))) as LobbyResponse;
        if (!response.ok) {
          setError(payload.error ?? "La richiesta non è andata a buon fine.");
          return;
        }
        if (payload.game?.status) setStatus(payload.game.status);
        if (payload.screen === "game" || payload.screen === "sheet") {
          router.push(`/r/${props.code}/${payload.screen}`);
          return;
        }
        // La lobby è cambiata dall'altro lato: si rilegge dal server.
        router.refresh();
      } catch {
        setError("Errore di rete: controlla la connessione e riprova.");
      } finally {
        setBusy(false);
      }
    },
    [props.code, router],
  );

  const onGame = useCallback((row: RoomRow) => {
    if (row.status) setStatus(row.status);
  }, []);

  const { otherConnected } = useRoomRealtime({
    roomId: props.roomId,
    gameId: props.gameId,
    seat: props.seat,
    screen: "lobby",
    onGame,
  });

  const updateSettings = (change: Partial<GameSettings>) => {
    const next = { ...settings, ...change };
    setSettings(next);
    void send({ action: "settings", settings: next });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 pt-6 font-sans text-sm">
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">Stanza {props.code}</span>
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">
          Tu sei il posto {props.seat}
        </span>
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">
          {otherConnected ? "L'altro è collegato" : "L'altro non è collegato"}
        </span>
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">
          {status === "lobby" ? "In lobby" : status === "sheets" ? "Prima le schede" : "Si gioca"}
        </span>
        <button
          type="button"
          className="ml-auto border border-ink px-3 py-1 tracking-[0.15em] uppercase hover:bg-ink hover:text-paper"
          onClick={() => void send({ action: "new" })}
        >
          Nuova serata
        </button>
      </div>

      {error && (
        <p role="status" className="mx-auto w-full max-w-6xl border-2 border-ink px-4 py-3 font-sans text-sm">
          {error}
        </p>
      )}

      {status === "sheets" && (
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 font-sans text-sm">
          <p>
            Una scheda non è completa: potete finirla, oppure cominciare lo stesso (si pescano solo le domande
            a cui l&apos;altro ha risposto).
          </p>
          <button
            type="button"
            className="border-2 border-ink bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink"
            onClick={() => void send({ action: "start" })}
          >
            Gioca lo stesso
          </button>
          <a className="underline" href={`/r/${props.code}/sheet`}>
            Vai alla scheda
          </a>
        </div>
      )}

      <LobbyView
        boardNames={props.boardNames}
        boardId={settings.boardId}
        onBoardChange={(id) => updateSettings({ boardId: id })}
        categoryOptions={props.categoryOptions}
        activeCategories={settings.challengeCategories}
        onToggleCategory={(id) =>
          updateSettings({
            challengeCategories: settings.challengeCategories.includes(
              id as GameSettings["challengeCategories"][number],
            )
              ? settings.challengeCategories.filter((category) => category !== id)
              : [...settings.challengeCategories, id as GameSettings["challengeCategories"][number]],
          })
        }
        maxChallengeSeconds={settings.maxChallengeSeconds}
        onMaxChallengeSecondsChange={(seconds) => updateSettings({ maxChallengeSeconds: seconds })}
        stake={settings.stake}
        onStakeChange={(stake) => updateSettings({ stake })}
        pawns={props.pawns}
        colors={props.colors}
        ready={ready}
        onToggleReady={(toggleSeat) => {
          const value = !ready[toggleSeat];
          setReady((current) => ({ ...current, [toggleSeat]: value }));
          void send({ action: "ready", ready: value });
        }}
        names={props.names}
      />

      {busy && <p className="mx-auto w-full max-w-6xl px-4 font-sans text-xs italic">Salvataggio…</p>}
    </div>
  );
}
