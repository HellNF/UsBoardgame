"use client";

import type { ReactNode } from "react";
import { RIVE_FILES } from "./files";
import { RiveCanvas, useRiveFile } from "./rive";

/**
 * Dado: artboard `Die`, macchina a stati `Roll`. `roll` è un contatore (cambia a ogni lancio e
 * fa scattare l'ingresso omonimo), `value` è la faccia da mostrare alla fine del rotolamento.
 * Senza il file, il segnaposto è il numero dentro un quadrato; la partita passa il **dado a
 * pallini** che si vede oggi, che è un'altra cosa e non va perso (H2).
 */
export type DieViewProps = {
  /** Faccia, da 1 a 6. */
  value: number;
  /** Contatore dei lanci: cambia a ogni lancio e fa scattare `roll`. */
  roll?: number;
  /** Cosa mostrare finché il file non c'è (senza, il numero nel quadrato di `/dev/art`). */
  placeholder?: ReactNode;
  className?: string;
};

export function DieView({ value, roll, placeholder, className }: DieViewProps) {
  const available = useRiveFile(RIVE_FILES.dice);
  if (!available) return <>{placeholder ?? <DiePlaceholder value={value} className={className} />}</>;

  return (
    <RiveCanvas
      file={RIVE_FILES.dice}
      artboard="Die"
      stateMachine="Roll"
      className={className}
      inputs={{ triggers: { roll }, numbers: { value } }}
    />
  );
}

/** Segnaposto del dado: la faccia in un quadrato. */
export function DiePlaceholder({ value, className }: { value: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`Dado: ${value}`}
      className={`inline-flex items-center justify-center border-[3px] border-[var(--color-ink)] bg-[var(--color-paper)] font-sans leading-none text-[var(--color-ink)] ${className ?? ""}`}
    >
      {value}
    </span>
  );
}
