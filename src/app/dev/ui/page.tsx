import { notFound } from "next/navigation";

import { boards, defaultBoardId } from "@/content/boards";
import { challenges } from "@/content/challenges";
import { ITEMS } from "@/content/items";
import { questions } from "@/content/questions";
import type { Seat } from "@/engine";
import type { DiaryEntry, DiaryViewProps } from "@/features/diary/diary-view";
import type { SheetQuestion } from "@/features/sheet/sheet-view";
import { DevViews } from "./views";

/**
 * Pagina di sviluppo: mostra le schermate su dati finti, senza Supabase.
 * Fuori dalla produzione: in build di produzione risponde 404.
 */

/** Etichette delle categorie di sfida (docs/specs.md § Sfide). */
const CHALLENGE_CATEGORY_LABELS: Record<string, string> = {
  builtin: "Integrati",
  videocall: "Videochiamata",
  external: "Siti esterni",
  emulator: "Emulatore",
};

/** Ordine stabile delle categorie in lobby. */
const CHALLENGE_CATEGORY_ORDER = ["builtin", "videocall", "external", "emulator"];

const NAMES: Record<Seat, string> = { 1: "Leo", 2: "Marta" };

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  // Scheda: le aperte restano nel mazzo, la scheda le ignora.
  const sheetQuestions: SheetQuestion[] = questions.map((question) => ({
    id: question.id,
    category: question.category,
    level: question.level,
    kind: question.kind,
    label: question.sheetText ?? question.text,
    options: question.options,
  }));

  // Due risposte finte: la scheda resta incompleta, così si vede l'avviso.
  const firstMultiple = sheetQuestions.find((question) => question.kind === "multiple");
  const firstShort = sheetQuestions.find((question) => question.kind === "short");
  const sheetAnswers: Record<string, string> = {};
  if (firstMultiple?.options?.[0]) sheetAnswers[firstMultiple.id] = firstMultiple.options[0];
  if (firstShort) sheetAnswers[firstShort.id] = "Risotto ai funghi";

  const boardNames = boards.map((board) => ({ id: board.id, name: board.name }));

  const categoryOptions = CHALLENGE_CATEGORY_ORDER.map((id) => ({
    id,
    label: CHALLENGE_CATEGORY_LABELS[id],
  }));
  // Attive di default: solo le categorie che hanno almeno una carta nel mazzo.
  const activeCategories = Array.from(new Set(challenges.map((challenge) => challenge.category)));

  const entries: DiaryEntry[] = [
    {
      id: "momento-1",
      round: 1,
      seat: 1,
      kind: "question",
      title: "Qual è il mio piatto preferito?",
      detail: "Leo ha risposto giusto: +3 monete.",
    },
    {
      id: "momento-2",
      round: 2,
      seat: 2,
      kind: "challenge",
      title: "Tris",
      detail: "Marta vince il duello integrato: +3 monete.",
    },
    {
      id: "momento-3",
      round: 4,
      seat: 1,
      kind: "event",
      title: "Vento a favore",
      detail: "Leo va avanti di 5 caselle, dalla 8 alla 13.",
    },
    {
      id: "momento-4",
      round: 6,
      seat: 2,
      kind: "coins",
      title: `Oggetto: ${ITEMS.thief.name}`,
      detail: `${ITEMS.thief.effect} Marta ruba 5 monete a Leo.`,
    },
    {
      id: "momento-5",
      round: 7,
      seat: 1,
      kind: "star",
      title: "Stella comprata",
      detail: "Leo paga 10 monete per una stella.",
    },
  ];

  const archive: DiaryViewProps["archive"] = [
    {
      id: "serata-2026-09-12",
      date: "12 settembre 2026",
      winner: 2,
      stars: { 1: 2, 2: 3 },
      coins: { 1: 14, 2: 19 },
    },
    {
      id: "serata-2026-09-05",
      date: "5 settembre 2026",
      winner: "draw",
      stars: { 1: 2, 2: 2 },
      coins: { 1: 11, 2: 9 },
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-10 px-4 py-10 font-sans text-ink lg:px-10">
      <p className="border border-ink bg-paper px-4 py-3 text-sm">
        Pagina di sviluppo: schermate senza Supabase, dati finti.
      </p>

      <DevViews
        access={{ roomCode: "COPPIA-42", otherConnected: false }}
        lobby={{
          boardNames,
          boardId: defaultBoardId,
          categoryOptions,
          activeCategories,
          maxChallengeSeconds: 60,
          stake: "Chi perde prepara la colazione",
          pawns: { 1: "fox", 2: "owl" },
          colors: { 1: "red", 2: "blue" },
          ready: { 1: true, 2: false },
          names: NAMES,
        }}
        sheet={{ seat: 1, questions: sheetQuestions, answers: sheetAnswers }}
        diary={{ names: NAMES, entries, archive }}
      />
    </main>
  );
}
