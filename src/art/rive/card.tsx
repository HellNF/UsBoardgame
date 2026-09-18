"use client";

import type { ReactNode } from "react";
import { RIVE_FILES } from "./files";
import { RiveCanvas, useRiveFile } from "./rive";

/**
 * Carta che si gira: artboard `Card`, macchina a stati `Flip`. `flip` è un contatore (cambia a
 * ogni giro e fa scattare l'ingresso omonimo); `faceUp` dice se la faccia è in vista.
 *
 * Senza il file, il segnaposto fa il mezzo giro in CSS: il dorso nero si tira via mentre la
 * faccia entra. La transizione si spegne con `prefers-reduced-motion`.
 *
 * `placeholder="children"` è per le schermate che hanno **già** un'animazione d'ingresso loro
 * (la carta della partita, D-57): i figli si disegnano così come sono, senza un secondo giro
 * in CSS che litigherebbe con Motion. Il file, quando c'è, si aggiunge sopra.
 */
export type CardViewProps = {
  /** Contatore dei giri: cambia a ogni giro e fa scattare `flip`. */
  flip?: number;
  /** Vero quando la carta mostra la faccia. */
  faceUp: boolean;
  /** La faccia della carta. */
  children?: ReactNode;
  /** Cosa mostrare finché il file non c'è: i figli così come sono, o un altro segnaposto. */
  placeholder?: ReactNode | "children";
  className?: string;
};

const FLIP_STYLE = "transition-transform duration-[420ms] ease-out motion-reduce:transition-none";

export function CardView({ flip, faceUp, children, placeholder, className }: CardViewProps) {
  const available = useRiveFile(RIVE_FILES.card);
  if (!available) {
    if (placeholder === "children") return <>{children}</>;
    if (placeholder !== undefined) return <>{placeholder}</>;
    return (
      <CardPlaceholder faceUp={faceUp} className={className}>
        {children}
      </CardPlaceholder>
    );
  }

  return (
    <span className={`relative block ${className ?? ""}`} style={{ perspective: "800px" }}>
      <span
        className={`relative block ${FLIP_STYLE}`}
        style={{
          transform: faceUp ? "rotateY(0deg)" : "rotateY(-90deg)",
          opacity: faceUp ? 1 : 0,
        }}
      >
        <RiveCanvas
          file={RIVE_FILES.card}
          artboard="Card"
          stateMachine="Flip"
          className="pointer-events-none absolute inset-0 h-full w-full"
          inputs={{ triggers: { flip } }}
        />
        {children}
      </span>
    </span>
  );
}

/** Segnaposto della carta: mezzo giro in CSS, dorso nero e faccia che entra. */
export function CardPlaceholder({
  faceUp,
  children,
  className,
}: {
  faceUp: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative block ${className ?? ""}`} style={{ perspective: "800px" }}>
      <span
        aria-hidden="true"
        className={`absolute inset-0 block border-2 border-[var(--color-ink)] bg-[var(--color-ink)] ${FLIP_STYLE}`}
        style={{
          transform: faceUp ? "rotateY(90deg)" : "rotateY(0deg)",
          backfaceVisibility: "hidden",
        }}
      />
      <span
        className={`relative block ${FLIP_STYLE}`}
        style={{
          transform: faceUp ? "rotateY(0deg)" : "rotateY(-90deg)",
          opacity: faceUp ? 1 : 0,
        }}
      >
        {children}
      </span>
    </span>
  );
}
