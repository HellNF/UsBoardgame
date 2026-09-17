import type { ItemId } from "@/engine/types";

/** Testi degli oggetti. I prezzi stanno in src/engine/config.ts (RULES.items.prices). */
export const ITEMS: Record<ItemId, { name: string; effect: string }> = {
  single_die: { name: "Dado singolo", effect: "Tiri un solo dado, per muoverti piano." },
  loaded_die: { name: "Dado truccato", effect: "Scegli il risultato di un dado." },
  skip_question: { name: "Salta domanda", effect: "Salti una domanda senza penalità." },
  antidote: { name: "Antidoto", effect: "Ignori il prossimo serpente." },
  portable_ladder: { name: "Scala portatile", effect: "Sali in cima alla scala più vicina davanti a te." },
  thief: { name: "Ladro", effect: "Rubi 5 monete all'altro." },
  swap: { name: "Scambio", effect: "Scambi la tua posizione con l'altro." },
};
