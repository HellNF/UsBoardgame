import { z } from "zod";

/**
 * Schemi dei contenuti versionati nel repo (domande, sfide, disposizioni).
 * I file dati in src/content/* vengono validati qui e trasformati in
 * supabase/seed.sql da `pnpm content:seed`. Formato: docs/content.md.
 */

export const questionCategory = z.enum(["tastes", "memories", "future", "deep", "funny"]);

export const questionSchema = z
  .object({
    /** Stabile e univoco, es. "tastes-001". Non va mai rinumerato: domande_usate e schede lo referenziano. */
    id: z.string().regex(/^[a-z]+-\d{3}$/),
    category: questionCategory,
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    kind: z.enum(["multiple", "short", "open"]),
    /** Testo mostrato in partita, riferito all'altro giocatore ("Qual è il mio piatto preferito?"). */
    text: z.string().min(5),
    /** Testo mostrato nella scheda a chi la compila ("Qual è il tuo piatto preferito?"). Non serve per le aperte. */
    sheetText: z.string().min(5).optional(),
    /** Solo per `multiple`: opzioni fisse, 2-6. */
    options: z.array(z.string().min(1)).min(2).max(6).optional(),
  })
  .superRefine((q, ctx) => {
    if (q.kind === "multiple" && !q.options) {
      ctx.addIssue({ code: "custom", message: `${q.id}: le domande multiple richiedono options` });
    }
    if (q.kind !== "multiple" && q.options) {
      ctx.addIssue({ code: "custom", message: `${q.id}: options è ammesso solo per multiple` });
    }
    if (q.kind !== "open" && !q.sheetText) {
      ctx.addIssue({ code: "custom", message: `${q.id}: le domande della scheda richiedono sheetText` });
    }
    if (!q.id.startsWith(`${q.category}-`)) {
      ctx.addIssue({ code: "custom", message: `${q.id}: il prefisso dell'id deve essere la categoria` });
    }
  });

export const challengeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string(),
    category: z.enum(["builtin", "videocall", "external", "emulator"]),
    mode: z.enum(["duel", "trial"]),
    verdict: z.enum(["automatic", "double_confirm", "judge"]),
    durationSeconds: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
    instructions: z.string(),
    prize: z.number().int().nonnegative(),
    /** Può essere usata come sfida lampo del serpente (≤ 30 s). */
    snakeFlash: z.boolean().default(false),
    /** Per i minigiochi integrati: id del componente in src/features/minigames. */
    minigame: z.string().optional(),
    /** Per il quiz-lampo: le domande della carta (contenuto pubblico, non la scheda). */
    quiz: z
      .array(
        z.object({
          question: z.string().min(5),
          options: z.array(z.string().min(1)).min(2).max(4),
          /** Indice dell'opzione giusta dentro `options`. */
          correct: z.number().int().nonnegative(),
        }),
      )
      .min(1)
      .optional(),
    /** Per le sfide esterne: link da aprire. */
    url: z.url().optional(),
  })
  .superRefine((c, ctx) => {
    // prova → giudica l'altro; duello → minigioco automatico o doppia conferma (docs/rules.md § Sfide).
    if (c.mode === "trial" && c.verdict !== "judge") {
      ctx.addIssue({ code: "custom", message: `${c.id}: una prova si decide sempre con verdict "judge"` });
    }
    if (c.mode === "duel" && c.verdict === "judge") {
      ctx.addIssue({ code: "custom", message: `${c.id}: un duello usa "automatic" o "double_confirm"` });
    }
    if (c.verdict === "automatic" && !c.minigame) {
      ctx.addIssue({ code: "custom", message: `${c.id}: il verdetto automatico richiede minigame` });
    }
    if (c.snakeFlash && c.durationSeconds.max > 30) {
      ctx.addIssue({ code: "custom", message: `${c.id}: una sfida lampo dura al massimo 30 secondi` });
    }
    // Il quiz-lampo senza domande non si può giocare: il motore non ha da dove pescarle.
    if (c.minigame === "quiz" && (!c.quiz || c.quiz.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: `${c.id}: il minigioco "quiz" richiede le domande nel campo quiz`,
      });
    }
    if (c.minigame !== "quiz" && c.quiz) {
      ctx.addIssue({
        code: "custom",
        message: `${c.id}: il campo quiz è ammesso solo con il minigioco "quiz"`,
      });
    }
    for (const item of c.quiz ?? []) {
      if (item.correct >= item.options.length) {
        ctx.addIssue({
          code: "custom",
          message: `${c.id}: una risposta del quiz punta a un'opzione che non c'è`,
        });
      }
    }
    // Le sfide esterne si giocano fuori: serve il link.
    if (c.category === "external" && !c.url) {
      ctx.addIssue({ code: "custom", message: `${c.id}: una sfida esterna richiede url` });
    }
  });

export type QuestionContent = z.infer<typeof questionSchema>;
export type ChallengeContent = z.infer<typeof challengeSchema>;
