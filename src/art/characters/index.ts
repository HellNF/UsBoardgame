/**
 * I sei personaggi: un posto solo dove sono elencati, come per le illustrazioni.
 *
 * Lo stesso disegno fa la **pedina** sul tabellone (con la pedana del colore e il numero del
 * posto) e la **mascotte** del pannello (più grande, con l'umore): non sono due famiglie di
 * disegni da tenere allineate, è la stessa, guardata da vicino o da lontano.
 */
import type { CharacterId, CharacterProps } from "./types";
import { Bear } from "./bear";
import { Cat } from "./cat";
import { Fox } from "./fox";
import { Frog } from "./frog";
import { Owl } from "./owl";
import { Rabbit } from "./rabbit";

export type Character = {
  id: CharacterId;
  /** Il nome in italiano: lo legge la lobby e l'etichetta accessibile della pedina. */
  name: string;
  Draw: (props: CharacterProps) => React.ReactNode;
};

export const CHARACTERS: Record<CharacterId, Character> = {
  fox: { id: "fox", name: "Volpe", Draw: Fox },
  rabbit: { id: "rabbit", name: "Coniglio", Draw: Rabbit },
  cat: { id: "cat", name: "Gatto", Draw: Cat },
  bear: { id: "bear", name: "Orso", Draw: Bear },
  frog: { id: "frog", name: "Rana", Draw: Frog },
  owl: { id: "owl", name: "Civetta", Draw: Owl },
};

/** L'ordine in cui si mostrano (lobby, campionario): è quello di `PawnId`. */
export const characterIds = ["fox", "rabbit", "cat", "bear", "frog", "owl"] as const satisfies readonly CharacterId[];

export { Bear, Cat, Fox, Frog, Owl, Rabbit };
export { Face, type FaceSpec } from "./face";
export { CharacterFrame } from "./frame";
export { MOODS_BY_NUMBER, type CharacterId, type CharacterMood, type CharacterProps } from "./types";
