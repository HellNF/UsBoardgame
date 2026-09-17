"use client";

import { useEffect, useState } from "react";

import type { GameEvent, GameState, Seat } from "@/engine";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Tempo reale e presenza della stanza (F2-03, F2-04).
 *
 * Un solo canale per la stanza:
 *  - `postgres_changes` su `games` → la partita è cambiata (nuovo stato, nuova versione);
 *  - `postgres_changes` su `game_events` → è successo qualcosa, da animare o raccontare;
 *  - Presence → chi è collegato (`{ seat, screen }`).
 *
 * RLS filtra gli eventi: a un browser arrivano solo le righe della propria stanza (e il canale
 * di Presence è privato della stanza perché il nome del canale contiene l'id della stanza).
 *
 * Il client non ricalcola mai l'esito di una mossa: quando arriva uno stato nuovo lo prende
 * così com'è, e quando il proprio `POST` risponde `409` si riallinea (`refresh`).
 */

export type RoomRow = { state: GameState | null; version: number; status: string };

export type UseRoomRealtimeInput = {
  roomId: string;
  gameId: string | null;
  seat: Seat;
  /** Schermata in cui si trova questo browser: la presenza la mostra all'altro. */
  screen: "lobby" | "sheet" | "game" | "diary";
  /** Stato nuovo della partita (dal database, non calcolato qui). */
  onGame?: (row: RoomRow) => void;
  /** Eventi nuovi, in ordine. */
  onEvents?: (events: GameEvent[]) => void;
};

export type RoomRealtimeState = {
  /** Vero se l'altro posto è collegato. */
  otherConnected: boolean;
  /** Vero quando il canale è sottoscritto. */
  connected: boolean;
};

export function useRoomRealtime(input: UseRoomRealtimeInput): RoomRealtimeState {
  const { roomId, gameId, seat, screen, onGame, onEvents } = input;
  const [otherConnected, setOtherConnected] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`room:${roomId}`, { config: { presence: { key: String(seat) } } });

    if (gameId) {
      channel
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
          (payload) => onGame?.(payload.new as RoomRow),
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "game_events", filter: `game_id=eq.${gameId}` },
          (payload) => {
            const row = payload.new as { payload?: GameEvent };
            if (row.payload) onEvents?.([row.payload]);
          },
        );
    }

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const seats = Object.values(state)
        .flat()
        .map((entry) => (entry as { seat?: number }).seat)
        .filter((value): value is number => typeof value === "number");
      setOtherConnected(seats.some((value) => value !== seat));
    });

    let cancelled = false;

    // Il token della sessione deve arrivare al tempo reale **prima** della sottoscrizione:
    // senza, il canale si collega come `anon`, RLS non consegna nessuna riga e le pagine
    // restano ferme (la presenza invece funziona, quindi il guasto è silenzioso).
    // Dopo un caricamento di pagina la sessione arriva dal cookie e nessun evento di
    // autenticazione la passa al canale: va fatto qui a mano.
    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel.subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") void channel.track({ seat, screen });
      });
    });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [roomId, gameId, seat, screen, onGame, onEvents]);

  return { otherConnected, connected };
}
