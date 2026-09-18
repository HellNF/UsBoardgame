import type { Phase } from "@/engine";

/**
 * Lo stato della serata nella tabella `games` (F1, docs/data-model.md).
 *
 * La stessa regola vive in due posti per necessità: `statusAfterAction` è la regola che la
 * migrazione `20260918130000_finish_game.sql` esegue dentro `apply_game_action` (una sola
 * transazione, D-52) — qui è scritta in TypeScript perché si possa provare senza database,
 * come `readyOutcome` per la lobby (D-53).
 */

export type GameStatus = "lobby" | "sheets" | "playing" | "finished" | "abandoned";

/** Le serate ancora aperte: ce n'è al massimo una per stanza (indice univoco parziale). */
export const OPEN_GAME_STATUSES: readonly GameStatus[] = ["lobby", "sheets", "playing"];

/** Vero se la serata è ancora in corso (lobby, schede o partita). */
export const isOpenGame = (status: GameStatus): boolean => OPEN_GAME_STATUSES.includes(status);

/** La fase dello stato di gioco, se la riga ne ha uno leggibile. */
export function phaseOf(state: unknown): Phase | null {
  if (typeof state !== "object" || state === null) return null;
  const phase = (state as { phase?: unknown }).phase;
  return phase === "pre_roll" || phase === "resolving" || phase === "finished" ? phase : null;
}

/**
 * Lo stato della riga dopo un'azione del motore (F1).
 *
 * Quando l'azione porta il motore a `phase = "finished"` la serata è **conclusa**: la riga
 * diventa `finished` e prende `finished_at`, così entra nell'archivio (`findFinishedGames`) e
 * non può più essere abbandonata. In ogni altro caso lo stato non si tocca: è una serata in
 * corso, e l'azione non cambia la fase della riga.
 */
export function statusAfterAction(current: GameStatus, phase: Phase): GameStatus {
  return phase === "finished" ? "finished" : current;
}

/**
 * Vero se la serata è conclusa: lo dice lo stato della riga, oppure la fase dello stato di gioco.
 *
 * La seconda strada serve alle righe scritte prima di questa migrazione, quando la partita
 * finiva e `status` restava `playing`: senza, una serata già finita sarebbe di nuovo
 * abbandonabile da «Nuova partita».
 */
export function isConcludedGame(status: GameStatus, phase: Phase | null): boolean {
  return status === "finished" || phase === "finished";
}

/**
 * Lo stato di una serata lasciata indietro da «Nuova partita».
 *
 * Solo una partita **non conclusa** diventa `abandoned`: una conclusa resta `finished` e quindi
 * nell'archivio del diario — è il difetto che la voce F1 del Registro fa verificare. Vale anche
 * per una riga scritta prima di questa migrazione, con la partita finita e `status` ancora
 * `playing`: la si archivia adesso invece di abbandonarla (la migrazione le sistema comunque).
 */
export function statusOnNewGame(status: GameStatus, phase: Phase | null): GameStatus {
  if (isConcludedGame(status, phase)) return "finished";
  return isOpenGame(status) ? "abandoned" : status;
}

/**
 * Quale serata mostra la stanza (D-64).
 *
 * Con una serata aperta si mostra quella. Senza, ma con una **conclusa**, si resta sulla
 * schermata finale: è il finale della serata, e deve reggere una ricarica. Solo una stanza
 * senza nessuna serata ne apre una nuova da sé (`null` = «creane una»).
 *
 * Senza questa regola, appena la partita finiva bastava ricaricare una pagina qualsiasi della
 * stanza perché nascesse una lobby nuova e il finale sparisse.
 */
export function roomGameChoice<T>(games: { open: T | null; latestFinished: T | null }): T | null {
  return games.open ?? games.latestFinished ?? null;
}
