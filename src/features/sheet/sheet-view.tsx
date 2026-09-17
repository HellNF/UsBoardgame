"use client";

import type { Seat } from "@/engine";

export type SheetQuestion = {
  id: string;
  category: string;
  level: number;
  kind: "multiple" | "short" | "open";
  label: string; // sheetText o text
  options?: string[];
};

export type SheetViewProps = {
  /** Chi compila la scheda. */
  seat: Seat;
  questions: SheetQuestion[];
  /** Risposte date: id della domanda → risposta (per le aperte il testo). */
  answers: Record<string, string>;
  /** Chiamata a ogni risposta data; il salvataggio è automatico. */
  onAnswer: (questionId: string, answer: string) => void;
  /** Vero mentre il salvataggio finto è in corso. */
  saving?: boolean;
};

/** Titoli italiani delle categorie, in ordine di gioco (docs/rules.md). */
const CATEGORY_TITLES: Record<string, string> = {
  tastes: "Gusti",
  memories: "Ricordi",
  future: "Futuro",
  deep: "Profonde",
  funny: "Buffe",
};

const CATEGORY_ORDER = ["tastes", "memories", "future", "deep", "funny"];

const FOCUS_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const LABEL_CLASS = "text-xs tracking-[0.15em] uppercase";

const optionClass = (selected: boolean) =>
  `border border-ink px-3 py-2 text-sm ${FOCUS_CLASS} ${
    selected ? "bg-ink text-paper" : "bg-paper text-ink"
  }`;

/** Scheda — domande private a blocchi per categoria, con salvataggio automatico. */
export function SheetView({ seat, questions, answers, onAnswer, saving = false }: SheetViewProps) {
  // Le domande aperte non hanno risposta giusta: non si compilano, si discutono.
  const sheetQuestions = questions.filter((question) => question.kind !== "open");
  const answeredCount = sheetQuestions.filter(
    (question) => (answers[question.id] ?? "").trim().length > 0,
  ).length;
  const complete = sheetQuestions.length > 0 && answeredCount === sheetQuestions.length;
  const missing = sheetQuestions.length - answeredCount;

  const groups = CATEGORY_ORDER.map((category) => ({
    id: category,
    title: CATEGORY_TITLES[category] ?? category,
    items: sheetQuestions.filter((question) => question.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="w-full px-4 py-10 font-sans text-ink lg:px-10 lg:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-5">
          <div>
            <h2 className="font-display text-4xl italic lg:text-5xl">La mia scheda</h2>
            <p className={`mt-3 ${LABEL_CLASS}`}>Posto {seat} · privata, la vede solo chi la compila</p>
          </div>
          <div className="text-right">
            <p className="text-lg">
              {answeredCount} di {sheetQuestions.length} risposte
            </p>
            <p className={`mt-1 ${LABEL_CLASS}`} aria-live="polite">
              {saving ? "Salvo…" : "Salvato"}
            </p>
          </div>
        </header>

        {!complete && (
          <p className="mt-6 border border-ink bg-paper px-4 py-3 text-sm">
            La scheda va completata prima della prima partita: mancano {missing} risposte.
          </p>
        )}

        <p className={`mt-4 ${LABEL_CLASS}`}>
          Le domande aperte non stanno nella scheda: si leggono in videochiamata e non hanno risposta giusta.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {groups.map((group) => (
            <section key={group.id} className="border-t-2 border-ink pt-5">
              <h3 className="font-display text-2xl italic">{group.title}</h3>

              <ul className="mt-5 flex flex-col gap-5">
                {group.items.map((question) => (
                  <li key={question.id} className="border border-ink bg-paper p-4">
                    <p className="text-sm">{question.label}</p>

                    {question.kind === "multiple" ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(question.options ?? []).map((option) => (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={answers[question.id] === option}
                            onClick={() => onAnswer(question.id, option)}
                            className={optionClass(answers[question.id] === option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        value={answers[question.id] ?? ""}
                        onChange={(event) => onAnswer(question.id, event.target.value)}
                        aria-label={question.label}
                        spellCheck={false}
                        className={`mt-4 w-full border border-ink bg-paper px-3 py-2 text-base ${FOCUS_CLASS}`}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
