"use client";

import { useCallback, useState } from "react";

import type { Seat } from "@/engine";
import { SheetView, type SheetQuestion } from "./sheet-view";

/**
 * Scheda collegata ai dati veri (F3-02): ogni risposta si salva da sola con
 * `PUT /api/sheet/[questionId]`. `SheetView` resta il componente di presentazione.
 */

export type SheetContainerProps = {
  code: string;
  seat: Seat;
  questions: SheetQuestion[];
  answers: Record<string, string>;
};

export function SheetContainer({ code, seat, questions, answers: initial }: SheetContainerProps) {
  const [answers, setAnswers] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAnswer = useCallback(async (questionId: string, answer: string) => {
    // Prima si vede la risposta, poi si salva: se il salvataggio fallisce l'avviso lo dice.
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/sheet/${questionId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Salvataggio non riuscito.");
      }
    } catch {
      setError("Errore di rete: la risposta non è stata salvata.");
    } finally {
      setSaving(false);
    }
  }, []);

  const answered = questions.filter(
    (question) => question.kind !== "open" && (answers[question.id] ?? "").length > 0,
  ).length;
  const required = questions.filter((question) => question.kind !== "open").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 pt-6 font-sans text-sm">
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">
          Posto {seat} · {answered}/{required} risposte
        </span>
        <a className="underline" href={`/r/${code}/lobby`}>
          Lobby
        </a>
        {saving && <span className="italic">Salvataggio…</span>}
      </div>

      {error && (
        <p role="status" className="mx-auto w-full max-w-6xl border-2 border-ink px-4 py-3 font-sans text-sm">
          {error}
        </p>
      )}

      <SheetView seat={seat} questions={questions} answers={answers} onAnswer={onAnswer} saving={saving} />
    </div>
  );
}
