"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Seat } from "@/engine";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AccessView } from "./access-view";

/**
 * Accesso: il pezzo che parla con Supabase (F0-04).
 * `AccessView` resta il componente di presentazione: qui stanno la sessione anonima,
 * la chiamata a `POST /api/rooms/join` e la navigazione verso la schermata della serata.
 */

export type AccessContainerProps = { roomCode?: string };

/** Risposta di `POST /api/rooms/join`. */
type JoinResponse = {
  code?: string;
  seat?: Seat;
  displayName?: string;
  screen?: "lobby" | "sheet" | "game" | "diary";
  error?: string;
};

export function AccessContainer({ roomCode }: AccessContainerProps) {
  const router = useRouter();
  const [seat, setSeat] = useState<Seat>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleJoin = async (code: string, password: string, chosenSeat: Seat) => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();

      // Sessione anonima: si crea al primo accesso, poi vive nel cookie.
      const current = await supabase.auth.getSession();
      if (!current.data.session) {
        const created = await supabase.auth.signInAnonymously();
        if (created.error) {
          setError("Non è stato possibile aprire una sessione anonima. Riprova.");
          return;
        }
      }

      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, password, seat: chosenSeat }),
      });
      const payload = (await response.json().catch(() => ({}))) as JoinResponse;

      if (!response.ok) {
        setError(payload.error ?? "Accesso non riuscito.");
        return;
      }

      const room = payload.code ?? code.toUpperCase();
      const screen = payload.screen ?? "lobby";
      router.push(`/r/${room}/${screen}`);
    } catch {
      setError("Errore di rete: controlla la connessione e riprova.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccessView
      roomCode={roomCode}
      otherConnected={false}
      seat={seat}
      onSeatChange={setSeat}
      onJoin={handleJoin}
      error={error}
      busy={busy}
    />
  );
}
