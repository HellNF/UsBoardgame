import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Salvataggio di una risposta della scheda (F3-02).
 *
 * La scheda è privata: la risposta si scrive solo dal server, con la secret key, e solo per
 * il posto della sessione. `sheet_answers` ha `primary key (player_id, question_id)`: si
 * scrive in upsert, quindi ricompilare la scheda non crea doppioni.
 */

export const sheetAnswerSchema = z.strictObject({ answer: z.string().min(1).max(500) });

export type SheetQuestion = {
  id: string;
  kind: "multiple" | "short" | "open";
  options: string[] | null;
};

export type SheetAnswerCheck = { ok: true } | { ok: false; error: string };

/**
 * Una risposta si accetta solo se la domanda esiste, ha una scheda e — per le domande a
 * scelta multipla — se è **il testo esatto di una delle opzioni** (docs/data-model.md:
 * cambiare il testo di un'opzione invalida le risposte date).
 */
export function checkSheetAnswer(question: SheetQuestion | null, answer: string): SheetAnswerCheck {
  if (!question) return { ok: false, error: "Domanda inesistente." };
  if (question.kind === "open") {
    return { ok: false, error: "Le domande aperte non stanno nella scheda." };
  }
  if (answer.trim() === "") return { ok: false, error: "La risposta non può essere vuota." };
  if (question.kind === "multiple") {
    const options = question.options ?? [];
    if (!options.includes(answer)) {
      return { ok: false, error: "Per le domande a scelta multipla serve una delle opzioni." };
    }
  }
  return { ok: true };
}

export type SaveAnswerInput = {
  admin: SupabaseClient;
  playerId: string;
  questionId: string;
  answer: string;
};

export type SaveAnswerResult = { ok: true } | { ok: false; status: 400 | 404 | 500; error: string };

/** Legge la domanda, controlla la risposta e la scrive. */
export async function saveSheetAnswer(input: SaveAnswerInput): Promise<SaveAnswerResult> {
  const question = await input.admin
    .from("questions")
    .select("id, kind, options")
    .eq("id", input.questionId)
    .maybeSingle();
  if (question.error) return { ok: false, status: 500, error: "Lettura della domanda fallita." };

  const row = question.data as SheetQuestion | null;
  const check = checkSheetAnswer(row, input.answer);
  if (!check.ok) return { ok: false, status: row ? 400 : 404, error: check.error };

  const written = await input.admin.from("sheet_answers").upsert(
    {
      player_id: input.playerId,
      question_id: input.questionId,
      answer: input.answer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "player_id,question_id" },
  );
  if (written.error) return { ok: false, status: 500, error: "Salvataggio della risposta fallito." };
  return { ok: true };
}
