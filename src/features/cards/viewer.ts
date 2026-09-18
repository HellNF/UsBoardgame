import { minigameTurn, otherSeat } from "@/engine";
import type { ActiveCard, GameState, Seat } from "@/engine";

/**
 * Cosa vede chi guarda una carta aperta (F3-03, F4-02, F4-06, F5-05).
 *
 * Nella hot seat i due giocatori usano lo stesso schermo e vedono tutti i comandi
 * (`viewer = "all"`); in una partita vera ogni schermo guarda da un posto solo. Qui
 * stanno le regole della visibilità, pure e testabili: i componenti delle carte
 * disegnano quello che queste funzioni dicono, senza ripercorrere le regole per conto loro.
 *
 * Non è una regola di sicurezza — il server rifiuta comunque le azioni di un posto non
 * suo (403) e il motore quelle fuori turno (422): è chiarezza, perché nessuno deve
 * vedere il campo di risposta dell'altro.
 */

/** Chi guarda una carta: un posto, oppure «tutti e due» (hot seat e pagina degli scenari). */
export type Viewer = Seat | "all";

/** Chi deve agire: un posto, oppure «tutti e due» (i riflessi: chi tocca per primo). */
export type Actor = Seat | "both";

/**
 * Il posto che deve agire adesso sulla carta aperta.
 * Domanda breve con la risposta già data: decide l'altro. Prova: decide l'altro.
 * Minigioco: tocca a chi ha il turno nel minigioco (`"both"` nei riflessi).
 * Per gli altri casi agisce chi ha il turno.
 */
export function cardActor(state: GameState, card: ActiveCard): Actor {
  if (card.type === "question") {
    return card.kind === "short" && card.givenAnswer !== null ? otherSeat(state.turn) : state.turn;
  }
  if (card.type === "challenge") {
    // Doppia conferma e disaccordo: ognuno ha il suo pezzo, nessuno aspetta.
    if (card.disputed || card.verdict === "double_confirm") return state.turn;
    if (card.verdict === "judge") return otherSeat(state.turn);
    if (card.verdict === "automatic" && card.minigame !== null) return minigameTurn(card.minigame);
  }
  return state.turn;
}

/** Vero se chi guarda può usare i comandi destinati a `actor`. */
export const viewerActs = (viewer: Viewer, actor: Actor): boolean =>
  viewer === "all" || actor === "both" || viewer === actor;

/**
 * La riga di attesa di chi non deve agire, oppure `null` quando chi guarda ha i comandi
 * in mano (o li vede tutti, come nella hot seat).
 */
export function waitingLine(
  state: GameState,
  card: ActiveCard,
  viewer: Viewer,
  names: Record<Seat, string>,
): string | null {
  if (viewer === "all") return null;
  const actor = cardActor(state, card);
  if (viewer === actor) return null;
  if (actor === "both") return null;
  const who = names[actor];

  switch (card.type) {
    case "question":
      if (card.kind === "multiple") return `${who} sta scegliendo la risposta…`;
      if (card.kind === "short") {
        return card.givenAnswer === null
          ? `${who} sta scrivendo la risposta…`
          : `${who} sta giudicando la tua risposta…`;
      }
      return `Tocca a ${who} confermare di averne parlato.`;
    case "challenge":
      // Doppia conferma e disaccordo: ognuno dichiara il suo pezzo (righe per posto).
      if (card.disputed || card.verdict === "double_confirm") return null;
      if (card.verdict === "judge") return `${who} sta giudicando…`;
      // Nel quiz non si "muove": si risponde. Gli altri minigiochi sono mosse su un tabellino.
      return card.minigameId === "quiz" ? `Tocca a ${who} rispondere.` : `Tocca a ${who} muovere.`;
    case "event":
      return `Tocca a ${who} leggere l'imprevisto.`;
    case "star_offer":
      return `${who} sta decidendo se comprare la stella…`;
    case "item_overflow":
      return `${who} sta scegliendo cosa scartare…`;
  }
}
