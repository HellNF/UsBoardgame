import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { plural } from "@/lib/plural";
import { SheetContainer } from "@/features/sheet/sheet-container";
import type { SheetQuestion } from "@/features/sheet/sheet-view";
import { currentRoom } from "@/server/room/current";

/**
 * Scheda (F3-02): le domande non aperte del catalogo, con le risposte di questo posto.
 *
 * Le risposte le legge il **client con RLS**, che mostra solo la propria scheda: quelle
 * dell'altro non passano di qui e non finiscono mai nella pagina (regola 4 di AGENTS.md).
 * Il salvataggio passa dalla route `PUT /api/sheet/[questionId]`.
 */

export default async function SheetPage({ params }: PageProps<"/r/[code]/sheet">) {
  const { code } = await params;
  const room = await currentRoom(code);
  if (room.game.status === "playing") redirect(`/r/${room.code}/game`);

  const supabase = await createSupabaseServerClient();
  const [questions, answers] = await Promise.all([
    supabase
      .from("questions")
      .select("id, category, level, kind, text, sheet_text, options")
      .eq("active", true)
      .neq("kind", "open")
      .order("category")
      .order("level"),
    supabase.from("sheet_answers").select("question_id, answer"),
  ]);

  const sheetQuestions: SheetQuestion[] = (
    (questions.data ?? []) as {
      id: string;
      category: string;
      level: number;
      kind: "multiple" | "short" | "open";
      text: string;
      sheet_text: string | null;
      options: string[] | null;
    }[]
  ).map((question) => ({
    id: question.id,
    category: question.category,
    level: question.level,
    kind: question.kind,
    label: question.sheet_text ?? question.text,
    options: question.options ?? undefined,
  }));

  const given: Record<string, string> = {};
  for (const row of (answers.data ?? []) as { question_id: string; answer: string }[]) {
    given[row.question_id] = row.answer;
  }

  const complete = sheetQuestions.length > 0 && sheetQuestions.every((question) => given[question.id]);
  const missing = sheetQuestions.filter((question) => !given[question.id]).length;

  return (
    <main className="flex flex-1 flex-col pb-10">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 font-sans text-sm">
        {complete ? (
          <p className="border-2 border-ink px-4 py-3">Scheda completa: si può cominciare.</p>
        ) : (
          <p className="border-2 border-ink px-4 py-3">
            {plural(missing, "risposta mancante", "risposte mancanti")} alla scheda: si può giocare lo stesso,
            ma le domande senza risposta non escono in partita.
          </p>
        )}
      </div>

      <SheetContainer code={room.code} seat={room.seat} questions={sheetQuestions} answers={given} />
    </main>
  );
}
