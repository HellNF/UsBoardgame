import "server-only";
import type { Action } from "@/engine";

/**
 * Pipeline di un'azione (docs/architecture.md § Flusso di un'azione):
 *  1. identifica il giocatore dalla sessione e verifica che `action.seat` sia il suo;
 *  2. carica `games.state` + `version`;
 *  3. costruisce l'EngineContext (RNG del server, domande, schede);
 *  4. `reduce(state, action, ctx)`;
 *  5. update con `where version = <atteso>` + insert in `game_events`;
 *  6. Realtime propaga il nuovo stato a entrambi i client.
 * TODO(F2-01): implementare.
 */
export async function applyAction(_gameId: string, _action: Action): Promise<never> {
  throw new Error("Non implementato (F2-01)");
}
