"use client";

import { useState } from "react";
import { otherSeat } from "@/engine";
import type { ActiveCard, QuestionCategory, Seat } from "@/engine";
import type { CardPanelProps } from "./card-panel";
import { viewerActs, waitingLine } from "./viewer";
import { WaitingRow } from "./waiting-row";

/** Etichette italiane delle categorie (docs/specs.md § Domande). */
const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  tastes: "Gusti",
  memories: "Ricordi",
  future: "Futuro",
  deep: "Profonde",
  funny: "Buffe",
};

/** Il colore è solo dei giocatori: posto 1 rosso, posto 2 blu (docs/design.md § Token). */
const SEAT_TEXT: Record<Seat, string> = { 1: "text-player-red", 2: "text-player-blue" };

/** Pulsante pieno: nero su carta. */
const SOLID_BUTTON =
  "border-2 border-ink bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-dashed disabled:bg-paper disabled:text-ink";

/** Pulsante vuoto: carta con bordo nero spesso. */
const OUTLINE_BUTTON =
  "border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-dashed disabled:hover:bg-paper disabled:hover:text-ink";

export function QuestionCard({
  state,
  question,
  card,
  act,
  names,
  viewerSeat,
}: CardPanelProps & { card: Extract<ActiveCard, { type: "question" }> }) {
  // Risposta breve in scrittura: l'unico stato locale della carta.
  const [answer, setAnswer] = useState("");

  // Chi risponde è chi ha il turno; chi giudica una risposta breve è sempre l'altro posto
  // (src/engine/cards.ts). `viewerSeat` decide quali comandi si vedono (viewer.ts).
  const judge = otherSeat(state.turn);
  // Con la risposta già data si aspetta il giudizio: lì i pulsanti di risposta si spengono.
  const awaitingJudge = card.givenAnswer !== null;
  const canSkip =
    viewerActs(viewerSeat, state.turn) && state.players[state.turn].items.includes("skip_question");
  const waiting = waitingLine(state, card, viewerSeat, names);
  const seesJudge = viewerActs(viewerSeat, judge);
  const seesAnswer = viewerActs(viewerSeat, state.turn);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs tracking-wide uppercase">{CATEGORY_LABELS[card.category]}</p>
      <p className="font-display text-2xl italic">{question?.text ?? card.questionId}</p>
      {card.forLadder && <p className="text-sm">Questa domanda vale anche per la scala</p>}

      {card.kind === "multiple" && seesAnswer && (
        <div className="flex flex-col gap-2">
          {(question?.options ?? []).map((option, index) => (
            <button
              key={`${option}-${index}`}
              type="button"
              className={`${OUTLINE_BUTTON} text-left`}
              onClick={() => act({ type: "ANSWER_QUESTION", seat: state.turn, answer: option })}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {card.kind === "short" && card.givenAnswer === null && seesAnswer && (
        <div className="flex flex-col gap-3">
          <label className="text-sm" htmlFor="card-short-answer">
            La tua risposta
          </label>
          <input
            id="card-short-answer"
            className="border-2 border-ink bg-paper px-3 py-2"
            type="text"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Scrivi qui la risposta"
          />
          <button
            type="button"
            className={SOLID_BUTTON}
            disabled={answer.trim() === ""}
            onClick={() => act({ type: "ANSWER_QUESTION", seat: state.turn, answer })}
          >
            Conferma risposta
          </button>
        </div>
      )}

      {card.kind === "short" && awaitingJudge && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Risposta di <span className={`font-semibold ${SEAT_TEXT[state.turn]}`}>{names[state.turn]}</span>:{" "}
            <span className="font-display font-medium italic">«{card.givenAnswer}»</span>
          </p>
          {seesJudge && (
            <>
              <p className="text-sm">
                Decide <span className={`font-semibold ${SEAT_TEXT[judge]}`}>{names[judge]}</span>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={SOLID_BUTTON}
                  onClick={() => act({ type: "JUDGE_ANSWER", seat: judge, verdict: "correct" })}
                >
                  Giusta
                </button>
                <button
                  type="button"
                  className={OUTLINE_BUTTON}
                  onClick={() => act({ type: "JUDGE_ANSWER", seat: judge, verdict: "almost" })}
                >
                  Quasi
                </button>
                <button
                  type="button"
                  className={OUTLINE_BUTTON}
                  onClick={() => act({ type: "JUDGE_ANSWER", seat: judge, verdict: "wrong" })}
                >
                  Sbagliata
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {card.kind === "open" && seesAnswer && (
        <div>
          <button
            type="button"
            className={SOLID_BUTTON}
            onClick={() => act({ type: "ACK_OPEN_QUESTION", seat: state.turn })}
          >
            Ne abbiamo parlato
          </button>
        </div>
      )}

      {canSkip && (
        <div>
          <button
            type="button"
            className={OUTLINE_BUTTON}
            onClick={() => act({ type: "SKIP_QUESTION", seat: state.turn })}
          >
            Salta domanda
          </button>
          <p className="mt-1 text-xs">Consuma l&apos;oggetto «Salta domanda».</p>
        </div>
      )}

      {waiting !== null && <WaitingRow text={waiting} />}
    </div>
  );
}
