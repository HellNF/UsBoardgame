"use client";

import { useState, type FormEvent } from "react";

import type { Seat } from "@/engine";

export type AccessViewProps = {
  /** Codice stanza già noto (arriva dal link, o dal proxy che rimanda qui). */
  roomCode?: string;
  /** Vero se l'altro giocatore risulta collegato. */
  otherConnected: boolean;
  /** Posto scelto in questo browser. */
  seat: Seat;
  onSeatChange: (seat: Seat) => void;
  /** Chiamata con i dati inseriti: codice, password e posto scelto. */
  onJoin?: (code: string, password: string, seat: Seat) => void;
  /** Messaggio del server quando l'accesso non riesce. */
  error?: string | null;
  /** Vero mentre la richiesta di accesso è in corso. */
  busy?: boolean;
};

const FIELD_CLASS =
  "border border-ink bg-paper px-3 py-3 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const LABEL_CLASS = "text-xs tracking-[0.2em] uppercase";

const SEATS: Seat[] = [1, 2];

/** Accesso — codice stanza, password, scelta del posto e stato dell'altro giocatore. */
export function AccessView({
  roomCode,
  otherConnected,
  seat,
  onSeatChange,
  onJoin,
  error,
  busy = false,
}: AccessViewProps) {
  const [code, setCode] = useState(roomCode ?? "");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode || !password) return;
    onJoin?.(trimmedCode, password, seat);
  };

  return (
    <div className="flex w-full flex-col items-center px-4 py-10 font-sans text-ink lg:py-16">
      <div className="w-full max-w-xl">
        <h1 className="font-display text-4xl italic lg:text-6xl">Scale e serpenti di coppia</h1>
        <p className="mt-4 text-xs tracking-[0.2em] uppercase">Una serata in due, a distanza</p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className={LABEL_CLASS}>Codice stanza</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className={`${FIELD_CLASS} tracking-[0.3em] uppercase`}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className={LABEL_CLASS}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="off"
              className={FIELD_CLASS}
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className={LABEL_CLASS}>Il tuo posto</legend>
            <div className="mt-2 flex gap-3">
              {SEATS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === seat}
                  onClick={() => onSeatChange(option)}
                  className={`border border-ink px-6 py-3 text-sm tracking-[0.2em] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    option === seat ? "bg-ink text-paper" : "bg-paper text-ink"
                  }`}
                >
                  Posto {option}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={busy}
            className="border border-ink bg-ink px-6 py-4 text-sm tracking-[0.2em] text-paper uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:border-dashed disabled:bg-paper disabled:text-ink"
          >
            {busy ? "Entro…" : "Entra nella stanza"}
          </button>
        </form>

        {error && (
          <p role="status" className="mt-6 border-2 border-ink px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <div className="mt-10 flex items-center gap-3 border border-ink bg-paper px-4 py-3">
          <span
            aria-hidden
            className={
              otherConnected ? "h-3 w-3 rounded-full border-2 border-ink" : "h-3 w-3 rounded-full bg-ink"
            }
          />
          <span className="text-sm tracking-wide uppercase">
            {otherConnected ? "Collegato" : "In attesa del tuo compagno"}
          </span>
        </div>
      </div>
    </div>
  );
}
