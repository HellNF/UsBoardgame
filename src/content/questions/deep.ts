import type { QuestionContent } from "../schema";

/**
 * Profonde — illustrazioni: specchio, rosa nella campana, serratura.
 * Unica categoria filtrata per livello in base alla casella (1-30 → 1, 31-70 → 2, 71-100 → 3).
 * TODO(F3-04): arrivare a ~30 domande, distribuite sui tre livelli.
 */
export const deep: QuestionContent[] = [
  {
    id: "deep-001",
    category: "deep",
    level: 2,
    kind: "short",
    text: "Di cosa ho più paura?",
    sheetText: "Di cosa hai più paura?",
  },
];
