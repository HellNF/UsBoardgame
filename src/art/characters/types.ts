/**
 * I sei personaggi del gioco: la pedina sul tabellone e la mascotte del pannello sono lo stesso
 * disegno (docs/design.md § Personaggi).
 *
 * Gli umori hanno un nome, non un numero: il numero (0-4) è un dettaglio del contratto di
 * `mascots.riv`, che ha bisogno di un ingresso numerico, e vive solo in `MOODS_BY_NUMBER`.
 */
import type { PawnId, PlayerColor } from "@/engine";

export type CharacterId = PawnId;

export type CharacterMood = "neutro" | "felice" | "sorpreso" | "triste" | "esultante";

/** L'ordine è il contratto di `mascots.riv`: 0 neutro, 1 felice, 2 sorpreso, 3 triste, 4 esultante. */
export const MOODS_BY_NUMBER = ["neutro", "felice", "sorpreso", "triste", "esultante"] as const satisfies readonly CharacterMood[];

export type CharacterProps = {
  /** L'espressione. Senza, `neutro`. */
  mood?: CharacterMood;
  /**
   * Il colore del giocatore, che sta **fuori** dal personaggio: è la pedana su cui sta.
   * Lo stesso animale lo può scegliere chiunque dei due, quindi non può essere rosso o blu
   * nel disegno (docs/design.md § Personaggi). `null` o assente = nessuna pedana.
   */
  base?: PlayerColor | null;
  /** Il numero del posto, scritto nella pedana: si legge anche dove il disegno è minuscolo. */
  seat?: number;
  /** Posizione e lato quando il personaggio sta dentro un altro SVG (il tabellone). */
  x?: number;
  y?: number;
  size?: number;
  className?: string;
  /** Etichetta accessibile; senza, il personaggio è decorativo. */
  label?: string;
};
