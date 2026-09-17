"use client";

import { useEffect, useRef, useState } from "react";
import { minigameTurn, otherSeat, RULES, SEATS } from "@/engine";
import type { ActiveCard, MinigameState, Seat } from "@/engine";
import { plural } from "@/lib/plural";
import type { CardPanelProps } from "./card-panel";
import { viewerActs, type Viewer } from "./viewer";
import { WaitingRow } from "./waiting-row";
import { Minigame } from "@/features/minigames/minigame";

/** Il colore è solo dei giocatori: posto 1 rosso, posto 2 blu (docs/design.md § Token). */
const SEAT_TEXT: Record<Seat, string> = { 1: "text-player-red", 2: "text-player-blue" };

/** Pulsante pieno: nero su carta. */
const SOLID_BUTTON =
  "border-2 border-ink bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-dashed disabled:bg-paper disabled:text-ink";

/** Pulsante vuoto: carta con bordo nero spesso. */
const OUTLINE_BUTTON =
  "border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-dashed disabled:hover:bg-paper disabled:hover:text-ink";

/** Tempo che manca in «m:ss», mai sotto zero. */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const seconds = total % 60;
  return `${Math.floor(total / 60)}:${String(seconds).padStart(2, "0")}`;
}

/** Nome del vincitore dichiarato, leggibile. */
function winnerLabel(winner: Seat | "draw", names: Record<Seat, string>): string {
  return winner === "draw" ? "pareggio" : names[winner];
}

/** Vero se chi guarda ha il suo pezzo da dichiarare (doppia conferma e disaccordo). */
const owns = (viewer: Viewer, seat: Seat): boolean => viewer === "all" || viewer === seat;

/**
 * Chi manda la mossa e quale tabellone è cliccabile. Nei minigiochi a turni è chi ha il turno
 * nel minigioco; nei riflessi (`"both"`) è chi guarda lo schermo — nella hot seat, il posto di
 * turno della partita.
 */
const seatFor = (minigame: MinigameState, viewer: Viewer, turnOfGame: Seat): Seat => {
  const current = minigameTurn(minigame);
  if (current === "both") return viewer === "all" ? turnOfGame : viewer;
  return current;
};

export function ChallengeCard({
  state,
  challenge,
  card,
  act,
  now,
  names,
  viewerSeat,
}: CardPanelProps & { card: Extract<ActiveCard, { type: "challenge" }> }) {
  const judge = otherSeat(state.turn);
  const deadline = card.deadlineAt;
  const deadlineMs = deadline === null ? null : new Date(deadline).getTime();
  // Un solo TIMER_EXPIRED per scadenza; il ref si riarma quando cambiano sfida o timer.
  // La scadenza la può annunciare chiunque abbia la schermata aperta: se l'altro è
  // disconnesso, la partita deve andare avanti lo stesso (il secondo annuncio riceve 409).
  const expiredRef = useRef<string | null>(null);
  // Costante locale: la narrowing regge anche dentro la callback di `onMove`.
  const minigame = card.minigame;
  // Sfida esterna: si va a giocare fuori e si torna a dichiarare (F4-05). La pausa è della
  // schermata, non della partita: lo stato condiviso resta quello del server.
  const [away, setAway] = useState(false);

  useEffect(() => {
    if (deadlineMs === null || Number.isNaN(deadlineMs) || now < deadlineMs) return;
    const key = `${card.challengeId}@${deadline}`;
    if (expiredRef.current === key) return;
    expiredRef.current = key;
    act({ type: "TIMER_EXPIRED", seat: state.turn });
  }, [act, card.challengeId, deadline, deadlineMs, now, state.turn]);

  const isExternal = challenge?.category === "external";

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-2xl italic">{challenge?.name ?? card.challengeId}</p>
      {challenge && <p className="text-sm">{challenge.instructions}</p>}
      {isExternal && challenge.url && (
        <p className="text-sm">
          Si gioca fuori:{" "}
          <a
            className="underline decoration-2 underline-offset-2"
            href={challenge.url}
            target="_blank"
            rel="noreferrer"
          >
            apri {challenge.name}
          </a>
          , poi tornate qui a dichiarare chi ha vinto.
        </p>
      )}

      <p className="text-sm">
        {card.mode === "duel" ? "Sfida a due" : "Prova"} — premio {plural(card.prize, "moneta", "monete")}
      </p>
      {card.snakeFlash && (
        <p className="text-sm">
          Sfida lampo da {RULES.challenges.snakeFlashSeconds} secondi: chi non vince scende dal serpente.
        </p>
      )}

      {deadlineMs !== null && !Number.isNaN(deadlineMs) && (
        <p className="font-display text-3xl italic">{formatRemaining(deadlineMs - now)}</p>
      )}

      {/* Sfida esterna in pausa: la partita resta ferma finché non si torna (F4-05). */}
      {isExternal && away && (
        <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          <p className="text-sm">
            In pausa: la partita aspetta il risultato di {challenge?.name ?? card.challengeId}.
          </p>
          <div>
            <button type="button" className={SOLID_BUTTON} onClick={() => setAway(false)}>
              Siamo tornati: chi ha vinto?
            </button>
          </div>
        </div>
      )}

      {isExternal && !away && !card.disputed && (
        <div>
          <button type="button" className={OUTLINE_BUTTON} onClick={() => setAway(true)}>
            Andiamo a giocare
          </button>
        </div>
      )}

      {/* Doppia conferma andata storta: si sceglie come sciogliere il nodo (D-27). */}
      {card.disputed && !away && (
        <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          <p className="text-sm">Le dichiarazioni non coincidono: scegliete come sciogliere il nodo.</p>
          {SEATS.map((seat) => {
            const choice = card.disputeChoices[seat];
            if (!owns(viewerSeat, seat)) {
              return (
                <p key={seat} className="text-sm text-ink/70">
                  <span className={`font-semibold ${SEAT_TEXT[seat]}`}>{names[seat]}</span>
                  {choice === undefined
                    ? " deve ancora scegliere."
                    : ` ha scelto: ${choice === "rematch" ? "rivincita" : "lancio di moneta"}.`}
                </p>
              );
            }
            return (
              <div key={seat} className="flex flex-col gap-2">
                <p className="text-sm">
                  {viewerSeat === "all" && (
                    <span className={`font-semibold ${SEAT_TEXT[seat]}`}>{names[seat]}</span>
                  )}
                  {viewerSeat === "all" ? " " : "Tocca a te: "}
                  {choice === undefined
                    ? "scegli come sciogliere il nodo."
                    : `hai scelto: ${choice === "rematch" ? "rivincita" : "lancio di moneta"}.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={SOLID_BUTTON}
                    disabled={choice !== undefined}
                    onClick={() => act({ type: "RESOLVE_DISPUTE", seat, method: "rematch" })}
                  >
                    Rivincita
                  </button>
                  <button
                    type="button"
                    className={OUTLINE_BUTTON}
                    disabled={choice !== undefined}
                    onClick={() => act({ type: "RESOLVE_DISPUTE", seat, method: "coin_flip" })}
                  >
                    Lancio di moneta
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-xs">Se le scelte non coincidono decide la moneta.</p>
        </div>
      )}

      {card.verdict === "judge" && !card.disputed && (
        <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          {viewerActs(viewerSeat, judge) ? (
            <>
              <p className="text-sm">
                Giudica <span className={`font-semibold ${SEAT_TEXT[judge]}`}>{names[judge]}</span>: la prova
                è riuscita?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={SOLID_BUTTON}
                  onClick={() => act({ type: "CLAIM_CHALLENGE_RESULT", seat: judge, winner: state.turn })}
                >
                  Riuscita
                </button>
                <button
                  type="button"
                  className={OUTLINE_BUTTON}
                  onClick={() => act({ type: "CLAIM_CHALLENGE_RESULT", seat: judge, winner: judge })}
                >
                  Non riuscita
                </button>
              </div>
              <p className="text-xs">Se non è riuscita, nessuno prende il premio.</p>
            </>
          ) : (
            <WaitingRow text={`${names[judge]} sta giudicando la prova.`} />
          )}
        </div>
      )}

      {card.verdict === "double_confirm" && !card.disputed && !away && (
        <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          <p className="text-sm">Chi ha vinto? Dichiarano entrambi.</p>
          {SEATS.map((seat) => {
            const claim = card.claims[seat];
            if (!owns(viewerSeat, seat)) {
              return (
                <p key={seat} className="text-sm text-ink/70">
                  <span className={`font-semibold ${SEAT_TEXT[seat]}`}>{names[seat]}</span>
                  {claim === undefined
                    ? " non ha ancora dichiarato."
                    : ` ha dichiarato: ${winnerLabel(claim, names)}.`}
                </p>
              );
            }
            return (
              <div key={seat} className="flex flex-col gap-2">
                <p className="text-sm">
                  {viewerSeat === "all" && (
                    <span className={`font-semibold ${SEAT_TEXT[seat]}`}>{names[seat]}</span>
                  )}
                  {viewerSeat === "all" ? " " : "Tocca a te: "}
                  {claim === undefined ? "chi ha vinto?" : `hai dichiarato: ${winnerLabel(claim, names)}.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={SOLID_BUTTON}
                    disabled={claim !== undefined}
                    onClick={() => act({ type: "CLAIM_CHALLENGE_RESULT", seat, winner: state.turn })}
                  >
                    Ha vinto {names[state.turn]}
                  </button>
                  <button
                    type="button"
                    className={OUTLINE_BUTTON}
                    disabled={claim !== undefined}
                    onClick={() =>
                      act({ type: "CLAIM_CHALLENGE_RESULT", seat, winner: otherSeat(state.turn) })
                    }
                  >
                    Ha vinto {names[otherSeat(state.turn)]}
                  </button>
                  <button
                    type="button"
                    className={OUTLINE_BUTTON}
                    disabled={claim !== undefined}
                    onClick={() => act({ type: "CLAIM_CHALLENGE_RESULT", seat, winner: "draw" })}
                  >
                    Pareggio
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-xs">Se le dichiarazioni non coincidono si sceglie con rivincita o moneta.</p>
        </div>
      )}

      {card.verdict === "automatic" && minigame !== null && (
        <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          {viewerActs(viewerSeat, minigameTurn(minigame)) ? (
            <Minigame
              state={minigame}
              seat={minigame.winner === null ? seatFor(minigame, viewerSeat, state.turn) : null}
              onMove={(move) =>
                act({ type: "MINIGAME_MOVE", seat: seatFor(minigame, viewerSeat, state.turn), move })
              }
              names={names}
            />
          ) : (
            <>
              <Minigame state={minigame} seat={null} onMove={() => {}} names={names} />
              <WaitingRow text={`Tocca a ${names[seatFor(minigame, viewerSeat, state.turn)]} muovere.`} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
