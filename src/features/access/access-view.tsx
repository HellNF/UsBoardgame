"use client";

import { useState, type FormEvent } from "react";

export type AccessViewProps = {
  /** Codice stanza già noto (arriva dal link), se c'è. */
  roomCode?: string;
  /** Vero se l'altro giocatore risulta collegato. */
  otherConnected: boolean;
  /** Chiamata con i dati inseriti; il server arriverà con il pacchetto D. */
  onJoin?: (code: string, password: string) => void;
};

const FIELD_CLASS =
  "border border-ink bg-paper px-3 py-3 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const LABEL_CLASS = "text-xs tracking-[0.2em] uppercase";

/** Accesso — codice stanza, password e stato dell'altro giocatore. */
export function AccessView({ roomCode, otherConnected, onJoin }: AccessViewProps) {
  const [code, setCode] = useState(roomCode ?? "");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode || !password) return;
    onJoin?.(trimmedCode, password);
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

          <button
            type="submit"
            className="border border-ink bg-ink px-6 py-4 text-sm tracking-[0.2em] text-paper uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Entra nella stanza
          </button>
        </form>

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
