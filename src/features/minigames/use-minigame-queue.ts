"use client";

import { useEffect, useRef, useState } from "react";

import type { MinigameState } from "@/engine";
import { enteringCells, revealDelay } from "./queue";

/**
 * Un movimento per volta anche nei minigiochi (F2-05).
 *
 * `MINIGAME_MOVED` arriva, ma tris, forza 4 e memory ridisegnavano lo stato **senza transizione**:
 * due mosse ravvicinate (l'altra schermata che muove, il tempo reale che consegna due righe
 * insieme) cambiavano il disegno nello stesso istante. Qui ogni stato nuovo entra in **coda** e
 * va in scena uno per volta, con l'attesa che decide `revealDelay`: la mossa precedente è finita
 * prima che arrivi la successiva, e in memory una coppia sbagliata resta scoperta il tempo di
 * vederla prima di richiudersi.
 *
 * È lo stesso impianto di `useMoveQueue` (`src/features/board/use-move-queue.ts`) per la pedina
 * del tabellone, applicato allo stato del minigioco: la coda vive in un ref, la scena disegnata
 * in uno stato, e a far passare il turno è un timer (mai un `setState` dentro un effetto).
 *
 * Non serve nessun evento: **ogni stato nuovo del minigioco è una mossa**, quindi la coda si
 * costruisce dal solo `state` e vale identica nella hot seat, negli scenari e nella partita vera.
 */
export type MinigameScene = {
  /** Lo stato da disegnare adesso (può essere indietro di qualche mossa rispetto a quello vero). */
  state: MinigameState | null;
  /** Gli elementi entrati adesso, da animare (indici come da `enteringCells`). */
  entering: number[];
};

export function useMinigameQueue(minigame: MinigameState | null): MinigameScene {
  // Gli stati che devono ancora andare in scena, dal più vecchio.
  const pending = useRef<MinigameState[]>([]);
  const [scene, setScene] = useState<MinigameScene>(() => ({ state: minigame, entering: [] }));

  // 1. Ogni stato nuovo entra in coda. Il primo (o il cambio di minigioco) è già la scena:
  //    al caricamento della pagina non si anima niente che fosse già in tavola.
  useEffect(() => {
    if (minigame === null) return;
    if (minigame === scene.state || pending.current.at(-1) === minigame) return;
    pending.current.push(minigame);
  }, [minigame, scene.state]);

  // 2. Un passo per volta: si aspetta che la scena precedente si sia vista, poi si passa alla
  //    prossima. Un arrivo nuovo non anticipa il passo in corso: si accoda.
  useEffect(() => {
    const next = pending.current[0];
    if (!next) return;
    const previous = scene.state;
    const timer = setTimeout(
      () => {
        pending.current.shift();
        setScene({ state: next, entering: enteringCells(previous, next) });
      },
      revealDelay(previous, next),
    );
    return () => clearTimeout(timer);
  }, [minigame, scene]);

  return { state: scene.state ?? minigame, entering: scene.entering };
}
