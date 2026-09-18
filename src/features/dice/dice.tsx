"use client";

import { DieView } from "@/art/rive";
import type { DiceRoll } from "@/engine";

/**
 * Dadi e pulsante del tiro (task F1-05, H2).
 *
 * Il disegno del dado lo fa `DieView` (il wrapper Rive): finché `dice.riv` non c'è mostra il
 * **dado a pallini** di qui — `DieFace` — che è quello che si vede oggi in partita. Il dado a
 * cifra di `/dev/art` non entra in partita: sarebbe un peggioramento silenzioso (H2).
 */

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

/** La faccia del dado: quadrato bianco con i pallini. È il segnaposto della partita e di `/dev/art`. */
export function DieFace({ value, highlight }: { value: number; highlight: boolean }) {
  const pips = PIPS[value] ?? [];
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16" role="img" aria-label={`Dado: ${value}`}>
      <rect
        x={6}
        y={6}
        width={88}
        height={88}
        rx={14}
        fill="var(--color-paper)"
        stroke={highlight ? "var(--color-ink)" : "var(--color-ink)"}
        strokeWidth={highlight ? 8 : 5}
      />
      {pips.map(([dx, dy], index) => (
        <circle key={index} cx={50 + dx * 24} cy={50 + dy * 24} r={9} fill="var(--color-ink)" />
      ))}
    </svg>
  );
}

export type DiceProps = {
  roll: DiceRoll | null;
  canRoll: boolean;
  onRoll: () => void;
  /** Perché non si può tirare (turno dell'altro, carta aperta…). */
  blockedReason?: string;
  /** Vero se il prossimo tiro usa un solo dado (oggetto Dado singolo). */
  singleDie?: boolean;
  /**
   * Quanti tiri ha fatto la partita finora: è il contatore che fa scattare `roll` in
   * `dice.riv`. Lo conta chi possiede gli eventi (il tavolo), non questo componente.
   */
  rollCount?: number;
};

export function Dice({ roll, canRoll, onRoll, blockedReason, singleDie, rollCount }: DiceProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onRoll}
        disabled={!canRoll}
        className="rounded-full border-4 border-ink bg-ink px-6 py-3 font-sans text-lg whitespace-nowrap text-paper disabled:cursor-not-allowed disabled:border-dashed disabled:bg-paper disabled:text-ink"
      >
        Tira i dadi
      </button>

      <div className="flex items-center gap-2">
        {roll ? (
          roll.dice.map((value, index) => (
            <DieView
              key={`${value}-${index}`}
              value={value}
              roll={rollCount}
              placeholder={<DieFace value={value} highlight />}
            />
          ))
        ) : (
          <>
            <DieView value={1} placeholder={<DieFace value={1} highlight={false} />} />
            {!singleDie && <DieView value={1} placeholder={<DieFace value={1} highlight={false} />} />}
          </>
        )}
      </div>

      <div className="font-sans text-sm leading-tight">
        {roll && (
          <p>
            Totale <strong>{roll.total}</strong>
            {roll.comebackBonus > 0 && <> (rimonta +{roll.comebackBonus})</>}
          </p>
        )}
        {singleDie && <p>Un solo dado</p>}
        {!canRoll && blockedReason && <p className="max-w-[16rem] italic">{blockedReason}</p>}
      </div>
    </div>
  );
}
