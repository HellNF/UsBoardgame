"use client";

import { motion, useReducedMotion } from "motion/react";

import { CHARACTERS, type CharacterProps } from "@/art/characters";
import { PawnView, RIVE_FILES, useRiveFile } from "@/art/rive";
import type { PawnId, PlayerColor, Seat } from "@/engine";
import type { PawnRouteKind } from "./route";

/**
 * Pedina del tabellone (F1-05, H2).
 *
 * La pedina **è il personaggio**: l'animale scelto in lobby, disegnato in SVG dentro il
 * tabellone (`src/art/characters`), con la pedana del colore del giocatore e il numero del
 * posto scritto dentro. Il disco colorato di prima resta solo per il caso in cui non ci sia un
 * animale — in una partita non capita, perché la lobby ne assegna sempre uno.
 *
 * **Il salto non si aggiunge qui**, e vale la pena scriverlo perché è il primo errore che ho
 * fatto: l'arco in aria c'è già, lo fa il percorso (`route.ts` mette un punto a mezz'aria fra
 * due caselle). Quello che manca a un personaggio è il peso — si schiaccia atterrando e si
 * allunga in volo — e il peso è un'altra cosa dal movimento. Quindi qui c'è un `<motion.g>`
 * che deforma, dentro quello del tabellone che sposta: due movimenti che si sommano senza che
 * nessuno dei due debba sapere dell'altro.
 *
 * Quando `pawns.riv` ci sarà, il canvas Rive prende il posto del disegno: è la porta che i
 * wrapper di `src/art/rive` tengono aperta (D-14). Il canvas è HTML, quindi dentro l'SVG entra
 * solo attraverso un `foreignObject`; il personaggio disegnato no, è SVG e ci sta dentro.
 */
export type PawnProps = {
  seat: Seat;
  name: string;
  color: PlayerColor;
  /** L'animale scelto in lobby. Senza, resta il disco col numero. */
  animal?: PawnId;
  x: number;
  y: number;
  /** Che movimento sta facendo: viene dal percorso, che è l'unico a saperlo. */
  kind?: PawnRouteKind;
  /** Quanti punti ha il percorso: servono ad allineare la deformazione agli atterraggi. */
  steps?: number;
  /** Quanto dura il movimento in corso, in secondi. */
  duration?: number;
  /** Tocca a questa pedina: respira, piano. */
  active?: boolean;
};

/**
 * Lato del riquadro della pedina, in unità del tabellone (una casella è 100).
 *
 * 72 e non 96: a 96 il personaggio è **una volta e mezza** il disco che ha sostituito (che era
 * un cerchio di raggio 32) e nell'angolo in basso a sinistra, dove sta la casella 1, usciva
 * dalla cornice. Visto renderizzando, non ragionando.
 */
const PAWN_BOX = 72;

/** Quanto si alza il disegno rispetto al centro della casella. */
const PAWN_LIFT = 4;

/**
 * Dove stanno i piedi del personaggio rispetto al centro della casella, in unità del tabellone.
 *
 * La pedana è a 89 su 100 del disegno. Serve qui e serve al tabellone, che ci appoggia l'alone
 * del turno: un numero solo, in un posto solo.
 */
export const PAWN_FEET_Y = (89 / 100) * PAWN_BOX - PAWN_BOX / 2 - PAWN_LIFT;

/**
 * Quanto si scosta una pedina su una casella di bordo, verso il centro del tabellone.
 *
 * Sette unità: bastano a togliere la pedana e l'alone del turno da sotto la cornice, e sono
 * poche abbastanza da non far sembrare la pedina fuori dalla sua casella.
 */
export const PAWN_NUDGE = 7;

/**
 * Il punto fermo delle deformazioni: i piedi, non il centro.
 *
 * Schiacciare intorno al centro farebbe affondare la pedina nel tabellone; intorno ai piedi la
 * fa cedere sulle gambe, che è quello che fa una cosa che atterra. Si calcola dal riquadro
 * invece di essere scritto a mano, perché la misura del riquadro l'ho già cambiata una volta.
 */
const FEET = `0px ${PAWN_FEET_Y}px`;

export function Pawn({
  seat,
  name,
  color,
  animal,
  x,
  y,
  kind = "fermo",
  steps = 0,
  duration = 0,
  active,
}: PawnProps) {
  const riveReady = useRiveFile(RIVE_FILES.pawns);

  const inner =
    riveReady && animal ? (
      <foreignObject x={-PAWN_BOX / 2} y={-PAWN_BOX / 2} width={PAWN_BOX} height={PAWN_BOX}>
        <div className="h-full w-full">
          <PawnView animal={animal} color={color} number={seat} className="size-full" />
        </div>
      </foreignObject>
    ) : animal ? (
      // Spostato in alto di quattro unità: la pedana del personaggio sta in fondo al disegno,
      // e centrandolo com'era il disco l'animale finiva a sedere sotto il centro della casella.
      <Draw
        animal={animal}
        x={-PAWN_BOX / 2}
        y={-PAWN_BOX / 2 - PAWN_LIFT}
        size={PAWN_BOX}
        base={color}
        seat={seat}
      />
    ) : (
      <PawnDisc color={color} seat={seat} />
    );

  return (
    <g transform={`translate(${x} ${y})`}>
      <title>{`Pedina ${seat} (${name})`}</title>
      <Weight kind={kind} steps={steps} duration={duration} active={active}>
        {inner}
      </Weight>
    </g>
  );
}

/** Il personaggio scelto, preso dal registro. */
function Draw({ animal, ...rest }: { animal: PawnId } & CharacterProps) {
  const character = CHARACTERS[animal];
  return <character.Draw {...rest} />;
}

/**
 * Il peso del personaggio: come si deforma mentre si muove, e come respira quando aspetta.
 *
 * I fotogrammi sono **allineati ai punti del percorso**, che è quello che li rende credibili:
 * il percorso alterna un punto a mezz'aria e un atterraggio, quindi `scaleY` alterna allungato
 * e schiacciato sugli stessi istanti. Non c'è un tempo da indovinare, c'è lo stesso elenco.
 *
 * Una cosa per tipo di movimento, e niente dove non serve:
 *  - **saltelli**: si allunga in aria e cede sulle gambe atterrando;
 *  - **serpente**: non salta, scivola — quindi si inclina da una parte e dall'altra;
 *  - **scala**: sale gradino per gradino e basta. Ho provato a deformarla anche qui e a otto
 *    gradini in un secondo e mezzo diventa un tremolio, non una salita;
 *  - **fermo, col turno in mano**: sale e scende di due unità in due secondi e mezzo. Serve a
 *    dire di chi è il turno col movimento e non solo con l'anello del colore, e resta piccolo
 *    perché una cosa che respira accanto a una domanda da leggere non deve tirare l'occhio.
 */
function Weight({
  kind,
  steps,
  duration,
  active,
  children,
}: {
  kind: PawnRouteKind;
  steps: number;
  duration: number;
  active?: boolean;
  children: React.ReactNode;
}) {
  // `prefers-reduced-motion` spegne prima di tutto il respiro, che è l'unica animazione
  // **ciclica** del tabellone: chi ha chiesto meno movimento non deve avere una cosa che si
  // muove per sempre in un angolo dello schermo (docs/design.md § Animazioni Rive).
  const reduced = useReducedMotion();
  const moving = duration > 0 && steps > 0;

  if (moving && kind === "saltelli") {
    // Il percorso comincia con un punto a mezz'aria: pari = in volo, dispari = atterraggio.
    const frames = [1, ...Array.from({ length: steps }, (_, i) => (i % 2 === 0 ? 1.08 : 0.9)), 1];
    return (
      <motion.g
        initial={false}
        style={{ transformOrigin: FEET }}
        animate={{ scaleY: frames }}
        transition={{ duration, ease: "easeInOut" }}
      >
        {children}
      </motion.g>
    );
  }

  if (moving && kind === "serpente") {
    return (
      <motion.g
        initial={false}
        style={{ transformOrigin: FEET }}
        animate={{ rotate: [0, 9, -7, 6, -3, 0] }}
        transition={{ duration, ease: "easeInOut" }}
      >
        {children}
      </motion.g>
    );
  }

  if (!moving && active && !reduced) {
    return (
      <motion.g
        initial={false}
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.g>
    );
  }

  return (
    <motion.g initial={false} style={{ transformOrigin: FEET }} animate={{ y: 0, scaleY: 1, rotate: 0 }}>
      {children}
    </motion.g>
  );
}

/**
 * Il disco col numero del posto: la pedina senza personaggio.
 *
 * Non è più quello che si vede in partita — ci sta il personaggio — ma resta perché una pedina
 * senza animale deve pur disegnarsi, e perché è il segnaposto che le pagine di sviluppo usano
 * per mostrare un tabellone senza scelte fatte.
 */
export function PawnDisc({ color, seat }: { color: PlayerColor; seat: Seat }) {
  return (
    <>
      <circle r={32} fill={`var(--color-player-${color})`} stroke="var(--color-ink)" strokeWidth={5} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={34}
        fill="var(--color-paper)"
        fontFamily="var(--font-sans)"
      >
        {seat}
      </text>
    </>
  );
}
