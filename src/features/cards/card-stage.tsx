"use client";

import type { ReactNode } from "react";
import type { GameState, PlayerColor, Seat } from "@/engine";
import { plural } from "@/lib/plural";

/**
 * La carta aperta occupa **tutto lo schermo** e blocca il resto (D-76).
 *
 * Prima la carta viveva nella colonna di destra, accanto al tabellone: va bene per il dado e per
 * i punteggi, non per un'attività. Una domanda o un tris si guardano **in due**, e il tabellone
 * di fianco è solo una distrazione — per questo qui non si vede: è una schermata che si chiude
 * quando la carta è risolta, non un riquadro.
 *
 * Cosa resta visibile è la riga in alto, e la decide il chiamante (`head`): serve a non perdere
 * il contesto che dava il tabellone — su che casella sei, come stanno i punteggi, in una partita
 * vera la stanza e il posto. La carta non perde nessun comando: «Salta domanda» sta dentro la
 * carta della domanda, e gli oggetti attivi si usano **prima** del tiro, quindi mai mentre una
 * carta è aperta.
 */
export type CardStageProps = {
  /** Nome della schermata per chi usa uno screen reader («Domanda», «Sfida»…). */
  label: string;
  /** La riga di contesto in alto: casella, punteggi, e in partita stanza e posto. */
  head: ReactNode;
  children: ReactNode;
};

export function CardStage({ label, head, children }: CardStageProps) {
  return (
    // Niente dissolvenza sul contenitore, ed è una regola non un gusto: una schermata che deve
    // **bloccare** non può dipendere da un'animazione per essere opaca. Se i fotogrammi vengono
    // strozzati (scheda in secondo piano) l'opacità resta a metà e il tabellone si vede attraverso.
    // L'ingresso ce l'ha già la carta dentro (Motion, D-57): questo strato compare e basta.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex flex-col bg-paper"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-4 border-ink px-4 py-2 font-sans text-sm text-ink">
        {head}
      </div>
      {/*
        La carta al centro dello schermo, non appoggiata in alto: è l'unica cosa che c'è, quindi
        sta al centro. `min-h-full` sul figlio interno è quello che tiene insieme le due cose —
        centrata quando è bassa, e scorre dall'inizio quando è più alta dello schermo (i
        minigiochi lo sono), invece di farsi tagliare la testa.
      */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 py-6">
          <div className="w-full max-w-4xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * I punteggi in una riga, per la fascia in alto: è il pezzo di contesto che il tabellone dava
 * e che a tutto schermo si perderebbe. Compatto, perché non è il protagonista della schermata.
 */
export function StageScores({
  state,
  names,
  colors,
}: {
  state: GameState;
  names: Record<Seat, string>;
  colors: Record<Seat, PlayerColor>;
}) {
  return (
    <>
      {([1, 2] as Seat[]).map((seat) => (
        <span key={seat} className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full border border-ink"
            style={{ background: `var(--color-player-${colors[seat]})` }}
          />
          <span className="font-display italic">{names[seat]}</span>
          <span className="text-ink/70">
            {plural(state.players[seat].stars, "stella", "stelle")} ·{" "}
            {plural(state.players[seat].coins, "moneta", "monete")}
          </span>
        </span>
      ))}
    </>
  );
}
