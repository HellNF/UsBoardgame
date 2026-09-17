import type { QuestionContent } from "../schema";

/**
 * Gusti — illustrazioni: bottiglia, calici, vinile, chitarra.
 * TODO(F3-04): arrivare a ~30 domande (circa 8 da scheda + 22 aperte).
 */
export const tastes: QuestionContent[] = [
  {
    id: "tastes-001",
    category: "tastes",
    level: 1,
    kind: "short",
    text: "Qual è il mio piatto preferito?",
    sheetText: "Qual è il tuo piatto preferito?",
  },
  {
    id: "tastes-002",
    category: "tastes",
    level: 1,
    kind: "multiple",
    text: "Per una vacanza preferisco…",
    sheetText: "Per una vacanza preferisci…",
    options: ["Mare", "Montagna", "Città d'arte", "Campagna"],
  },
  {
    id: "tastes-003",
    category: "tastes",
    level: 1,
    kind: "open",
    text: "Qual è una canzone che ti fa pensare a noi, e perché?",
  },
];
