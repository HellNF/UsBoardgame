import type { EventCardId } from "@/engine/types";

/** Testi degli imprevisti. I numeri stanno in src/engine/config.ts (RULES.events). */
export const EVENTS: Record<EventCardId, { name: string; effect: string }> = {
  tailwind: { name: "Vento a favore", effect: "Avanti di 5 caselle." },
  wrong_path: { name: "Sentiero sbagliato", effect: "Indietro di 5 caselle." },
  gift: { name: "Regalo", effect: "L'altro ti dà 3 monete." },
  treasure: { name: "Tesoro", effect: "Ricevi un oggetto a caso." },
  sudden_snake: {
    name: "Serpente improvviso",
    effect: "Scendi dal serpente più vicino dietro di te, se c'è.",
  },
  lucky_ladder: {
    name: "Scala fortunata",
    effect: "Sali sulla scala più vicina davanti a te, senza domanda.",
  },
  snack_break: {
    name: "Pausa ghiotta",
    effect: "Entrambi prendete uno snack: 2 minuti di pausa, nessun effetto.",
  },
};
