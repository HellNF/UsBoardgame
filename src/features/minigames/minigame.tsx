"use client";

import type { MinigameState, Seat } from "@/engine";
import { ConnectFourBoard } from "@/features/minigames/forza-4";
import { MemoryBoard } from "@/features/minigames/memory";
import { QuizBoard } from "@/features/minigames/quiz";
import { ReflexBoard } from "@/features/minigames/riflessi";
import { TicTacToeBoard } from "@/features/minigames/tris";

/**
 * Minigiochi integrati (D-26): i tabelloni condividono la stessa interfaccia.
 * Sono componenti puramente presentazionali — nessuno stato locale condiviso, nessun calcolo
 * delle regole: disegnano lo stato ricevuto dal motore e traducono i clic in mosse.
 */

export type MinigameViewProps = {
  state: MinigameState;
  /** Posto che sta muovendo nel minigioco; null = non si può cliccare. */
  seat: Seat | null;
  onMove: (move: unknown) => void;
  names: Record<Seat, string>;
};

/** Sceglie il tabellone in base a `state.kind` (unione chiusa del motore). */
export function Minigame(props: MinigameViewProps) {
  switch (props.state.kind) {
    case "tic-tac-toe":
      return <TicTacToeBoard {...props} />;
    case "connect-four":
      return <ConnectFourBoard {...props} />;
    case "memory":
      return <MemoryBoard {...props} />;
    case "quiz":
      return <QuizBoard {...props} />;
    case "reflex":
      return <ReflexBoard {...props} />;
  }

  // MinigameState è una unione chiusa: qui non si arriva mai.
  return null;
}
