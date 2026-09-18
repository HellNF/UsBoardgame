"use client";

import { useReducedMotion } from "motion/react";

/**
 * L'ingresso in scena di una pedina o di una carta dei minigiochi (F2-05).
 *
 * `enter` arriva da `enteringCells`: vero solo per gli elementi comparsi adesso, così al
 * caricamento della pagina (o entrando a metà sfida) quello che è già in tavola sta fermo.
 * Con `prefers-reduced-motion` non si anima niente (docs/design.md § Animazioni Rive).
 */

export type EnterFrom = { scale?: number; opacity?: number; y?: number };

/** Quanto dura l'ingresso: breve, come gli spostamenti della pedina. */
export const ENTER_TRANSITION = { duration: 0.22, ease: "easeOut" } as const;

export function useEnterFrom(from: EnterFrom, enter: boolean): EnterFrom | false {
  const reduced = useReducedMotion();
  return enter && !reduced ? from : false;
}
