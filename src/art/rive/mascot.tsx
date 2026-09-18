"use client";

import type { ReactNode } from "react";
import type { PawnId } from "@/engine";
import { RIVE_FILES } from "./files";
import { RiveCanvas, useRiveFile } from "./rive";

/**
 * Mascotte delle reazioni: un artboard per forma in `mascots.riv`, macchina a stati `Mood`,
 * ingresso numerico `mood` (0 neutro, 1 felice, 2 sorpreso, 3 triste, 4 esultante).
 *
 * Le sei forme sono le stesse sei delle pedine: sono i personaggi del gioco. Senza il file, il
 * segnaposto è la testa dell'animale, ferma.
 */
export type MascotForm = PawnId;

export type MascotMood = 0 | 1 | 2 | 3 | 4;

export type MascotViewProps = {
  form: MascotForm;
  /** 0 neutro, 1 felice, 2 sorpreso, 3 triste, 4 esultante. */
  mood?: MascotMood;
  className?: string;
};

export function MascotView({ form, mood, className }: MascotViewProps) {
  const available = useRiveFile(RIVE_FILES.mascots);
  if (!available) return <MascotPlaceholder form={form} className={className} />;

  return (
    <RiveCanvas
      file={RIVE_FILES.mascots}
      artboard={form}
      stateMachine="Mood"
      className={className}
      inputs={{ numbers: { mood } }}
    />
  );
}

/** Segnaposto della mascotte: la testa dell'animale, ferma (l'espressione è del `.riv`). */
export function MascotPlaceholder({ form, className }: { form: MascotForm; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`Mascotte: ${form}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {HEADS[form]}
    </svg>
  );
}

/** Occhi: due punti pieni. */
const EYES = (
  <>
    <circle cx="41" cy="50" r="3.4" fill="currentColor" stroke="none" />
    <circle cx="59" cy="50" r="3.4" fill="currentColor" stroke="none" />
  </>
);

/** Le sei teste: poche forme, lette a 48 px come le illustrazioni del tabellone. */
const HEADS: Record<MascotForm, ReactNode> = {
  fox: (
    <>
      <path d="M30 32 26 14l17 9" />
      <path d="M70 32 74 14 57 23" />
      <circle cx="50" cy="52" r="26" />
      <path d="M40 58 50 70l10-12" />
      {EYES}
    </>
  ),
  rabbit: (
    <>
      <ellipse cx="41" cy="24" rx="7" ry="17" />
      <ellipse cx="59" cy="24" rx="7" ry="17" />
      <circle cx="50" cy="58" r="25" />
      <path d="M50 66v4M44 68h-6M56 68h6" />
      {EYES}
    </>
  ),
  cat: (
    <>
      <path d="M32 32 30 14l16 9" />
      <path d="M68 32 70 14 54 23" />
      <circle cx="50" cy="54" r="25" />
      <path d="M50 62v3M44 66c-4 2-8 2-11 0M56 66c4 2 8 2 11 0" />
      {EYES}
    </>
  ),
  bear: (
    <>
      <circle cx="30" cy="28" r="10" />
      <circle cx="70" cy="28" r="10" />
      <circle cx="50" cy="56" r="26" />
      <ellipse cx="50" cy="66" rx="12" ry="9" />
      <circle cx="50" cy="63" r="3.4" fill="currentColor" stroke="none" />
      {EYES}
    </>
  ),
  frog: (
    <>
      <circle cx="34" cy="34" r="12" />
      <circle cx="66" cy="34" r="12" />
      <circle cx="34" cy="34" r="4.5" fill="currentColor" stroke="none" />
      <circle cx="66" cy="34" r="4.5" fill="currentColor" stroke="none" />
      <ellipse cx="50" cy="62" rx="32" ry="22" />
      <path d="M28 60c8 8 36 8 44 0" />
    </>
  ),
  owl: (
    <>
      <path d="M30 26 26 14l12 6" />
      <path d="M70 26 74 14 62 20" />
      <circle cx="50" cy="54" r="27" />
      <circle cx="39" cy="48" r="9" />
      <circle cx="61" cy="48" r="9" />
      <path d="M50 58 45 68h10z" />
    </>
  ),
};
