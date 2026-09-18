"use client";

import { motion } from "motion/react";
import type * as React from "react";
import { CardView } from "@/art/rive";
import type { Action, ActiveCard, GameState, Seat } from "@/engine";
import type { ChallengeContent, QuestionContent } from "@/content/schema";
import { ChallengeCard } from "./challenge-card";
import { EventCard } from "./event-card";
import { ItemOverflowCard } from "./item-overflow-card";
import { QuestionCard } from "./question-card";
import { StarOfferCard } from "./star-offer-card";
import { cardActor, type Actor, type Viewer } from "./viewer";

/** Manda un'azione al motore: la cabla il contenitore della partita. */
export type CardAct = (action: Action) => void;

export type CardPanelProps = {
  state: GameState;
  /** Contenuto della domanda attiva dal catalogo (null se la carta non è una domanda). */
  question: QuestionContent | null;
  /** Contenuto della sfida attiva dal catalogo. */
  challenge: ChallengeContent | null;
  act: CardAct;
  /** Adesso in millisecondi epoch, aggiornato ogni secondo dal chiamante. */
  now: number;
  names: Record<Seat, string>;
  /**
   * Il posto di chi guarda questa carta: in una partita vera ognuno vede i comandi suoi,
   * nella hot seat e negli scenari `"all"` (li vedono tutti e due, comportamento di prima).
   */
  viewerSeat: Viewer;
};

/** Identità della carta: l'ingresso si ripete quando cambia la carta, non a ogni ritocco. */
function cardKey(card: ActiveCard): string {
  switch (card.type) {
    case "question":
      return `question:${card.questionId}`;
    case "challenge":
      return `challenge:${card.challengeId}`;
    case "event":
      return `event:${card.eventId}`;
    case "star_offer":
      return "star_offer";
    case "item_overflow":
      return `item_overflow:${card.incoming}`;
  }
}

/** Titolo della cornice: il tipo di carta si legge subito. Lo usa anche `CardStage`. */
export const CARD_TITLES: Record<ActiveCard["type"], string> = {
  question: "Domanda",
  challenge: "Sfida",
  event: "Imprevisto",
  star_offer: "Stella",
  item_overflow: "Zaino pieno",
};

/** Il colore è solo dei giocatori: posto 1 rosso, posto 2 blu (docs/design.md § Token). */
const SEAT_TEXT: Record<Seat, string> = { 1: "text-player-red", 2: "text-player-blue" };

/**
 * Cornice della carta attiva: carta bianca, bordo spesso nero, titolo in corsivo.
 * Ritorna `null` quando non c'è nulla da risolvere.
 */
export function CardPanel(props: CardPanelProps): React.ReactElement | null {
  const { state, names } = props;
  const card = state.card;
  if (card === null) return null;

  // Chi deve agire adesso (in una prova a decidere è l'altro posto): l'intestazione lo dice.
  const actor: Actor = cardActor(state, card);
  const actorLabel = card.type === "challenge" ? (card.verdict === "judge" ? "Giudica" : "Gioca") : "Tocca a";

  return (
    <motion.section
      key={cardKey(card)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="border-4 border-ink bg-paper font-sans text-ink"
      aria-label={CARD_TITLES[card.type]}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-4 border-ink px-5 py-3">
        <h2 className="font-display text-2xl italic">{CARD_TITLES[card.type]}</h2>
        <p className="text-sm">
          {actor === "both" ? (
            <>Pronti tutti e due: chi tocca per primo</>
          ) : (
            <>
              {actorLabel} <span className={`font-semibold ${SEAT_TEXT[actor]}`}>{names[actor]}</span>
            </>
          )}
        </p>
      </header>
      <div className="px-5 py-5">
        {/*
          Il `.riv` della carta si **aggiunge** all'ingresso che c'è già (Motion, D-57) e non lo
          sostituisce: per questo il segnaposto è «i figli così come sono», e non il mezzo giro
          in CSS di `CardPlaceholder` (H2).
        */}
        <CardView faceUp placeholder="children" className="block">
          {card.type === "question" ? (
            <QuestionCard {...props} card={card} />
          ) : card.type === "challenge" ? (
            <ChallengeCard {...props} card={card} />
          ) : card.type === "event" ? (
            <EventCard {...props} card={card} />
          ) : card.type === "star_offer" ? (
            <StarOfferCard {...props} card={card} />
          ) : (
            <ItemOverflowCard {...props} card={card} />
          )}
        </CardView>
      </div>
    </motion.section>
  );
}
