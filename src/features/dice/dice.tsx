"use client";

import type { DiceRoll } from "@/engine";

/**
 * Dadi e pulsante del tiro (task F1-05, docs/design.md § Tabellone e Rive).
 * Segnaposto geometrico: quadrato bianco bordato con i punti neri; quando esistono i
 * file Rive si sostituisce il disegno, non il pulsante.
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

function Die({ value, highlight }: { value: number; highlight: boolean }) {
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
};

export function Dice({ roll, canRoll, onRoll, blockedReason, singleDie }: DiceProps) {
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
          roll.dice.map((value, index) => <Die key={`${value}-${index}`} value={value} highlight />)
        ) : (
          <>
            <Die value={1} highlight={false} />
            {!singleDie && <Die value={1} highlight={false} />}
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
