import { createElement, type ReactElement } from "react";

import type { IllustrationProps } from "./types";

import { DeepCandle } from "./deep-candle";
import { DeepHourglass } from "./deep-hourglass";
import { DeepLock } from "./deep-lock";
import { DeepMirror } from "./deep-mirror";
import { DeepMoon } from "./deep-moon";
import { DeepRoots } from "./deep-roots";
import { DeepRose } from "./deep-rose";
import { FunnyAlarm } from "./funny-alarm";
import { FunnyApple } from "./funny-apple";
import { FunnyBanana } from "./funny-banana";
import { FunnyDice } from "./funny-dice";
import { FunnyEye } from "./funny-eye";
import { FunnySock } from "./funny-sock";
import { FunnyToothbrush } from "./funny-toothbrush";
import { FutureCage } from "./future-cage";
import { FutureHouse } from "./future-house";
import { FutureKey } from "./future-key";
import { FutureMap } from "./future-map";
import { FuturePlane } from "./future-plane";
import { FutureRing } from "./future-ring";
import { FutureSprout } from "./future-sprout";
import { MemoriesCassette } from "./memories-cassette";
import { MemoriesFrame } from "./memories-frame";
import { MemoriesLetter } from "./memories-letter";
import { MemoriesPhone } from "./memories-phone";
import { MemoriesSuitcase } from "./memories-suitcase";
import { MemoriesTicket } from "./memories-ticket";
import { MemoriesTypewriter } from "./memories-typewriter";
import { StarsBigStar } from "./stars-big-star";
import { StarsStar } from "./stars-star";
import { StarsStarCluster } from "./stars-star-cluster";
import { TastesBottle } from "./tastes-bottle";
import { TastesBread } from "./tastes-bread";
import { TastesCup } from "./tastes-cup";
import { TastesGlasses } from "./tastes-glasses";
import { TastesGuitar } from "./tastes-guitar";
import { TastesIceCream } from "./tastes-ice-cream";
import { TastesVinyl } from "./tastes-vinyl";

/**
 * Registro delle illustrazioni (F6-02): da `IllustrationId` al componente.
 *
 * `IllustrationId` è una stringa libera nel motore (la disposizione dichiara l'illustrazione di
 * ogni casella), quindi qui il registro è un elenco di chiavi **stabili**: rinominare un file
 * significa cambiare la disposizione in `src/content/boards`. `illustrationFor` ritorna `null`
 * per un id sconosciuto e chi disegna il tabellone ripiega sul numero della casella: una
 * disposizione nuova non fa sparire il tabellone.
 *
 * Le stesse chiavi le mostra `/dev/art` (pagina di sviluppo, 404 in produzione) a 48 e 200 px.
 */
export type IllustrationComponent = (props: IllustrationProps) => ReactElement;

export const ILLUSTRATIONS: Record<string, IllustrationComponent> = {
  "deep-candle": DeepCandle,
  "deep-hourglass": DeepHourglass,
  "deep-lock": DeepLock,
  "deep-mirror": DeepMirror,
  "deep-moon": DeepMoon,
  "deep-roots": DeepRoots,
  "deep-rose": DeepRose,
  "funny-alarm": FunnyAlarm,
  "funny-apple": FunnyApple,
  "funny-banana": FunnyBanana,
  "funny-dice": FunnyDice,
  "funny-eye": FunnyEye,
  "funny-sock": FunnySock,
  "funny-toothbrush": FunnyToothbrush,
  "future-cage": FutureCage,
  "future-house": FutureHouse,
  "future-key": FutureKey,
  "future-map": FutureMap,
  "future-plane": FuturePlane,
  "future-ring": FutureRing,
  "future-sprout": FutureSprout,
  "memories-cassette": MemoriesCassette,
  "memories-frame": MemoriesFrame,
  "memories-letter": MemoriesLetter,
  "memories-phone": MemoriesPhone,
  "memories-suitcase": MemoriesSuitcase,
  "memories-ticket": MemoriesTicket,
  "memories-typewriter": MemoriesTypewriter,
  "stars-big-star": StarsBigStar,
  "stars-star": StarsStar,
  "stars-star-cluster": StarsStarCluster,
  "tastes-bottle": TastesBottle,
  "tastes-bread": TastesBread,
  "tastes-cup": TastesCup,
  "tastes-glasses": TastesGlasses,
  "tastes-guitar": TastesGuitar,
  "tastes-ice-cream": TastesIceCream,
  "tastes-vinyl": TastesVinyl,
};

/** Il componente di un'illustrazione, o `null` se l'id non è nel registro. */
export const illustrationFor = (id: string): IllustrationComponent | null => ILLUSTRATIONS[id] ?? null;

/**
 * L'illustrazione di un id, o niente se l'id non è nel registro.
 *
 * È `createElement` e non `const Disegno = illustrationFor(id); <Disegno />` perché quest'ultimo,
 * per `react-hooks/static-components`, è un componente creato durante il disegno — e la regola ha
 * ragione: il tipo dell'elemento cambierebbe identità a ogni passaggio.
 */
export function Illustration({ id, ...props }: { id: string } & IllustrationProps): ReactElement | null {
  const illustration = illustrationFor(id);
  if (!illustration) return null;
  return createElement(illustration, props);
}

/** Le illustrazioni raggruppate per prefisso (`tastes`, `memories`, …), nell'ordine del registro. */
export function illustrationGroups(): { prefix: string; ids: string[] }[] {
  const groups: { prefix: string; ids: string[] }[] = [];
  for (const id of Object.keys(ILLUSTRATIONS)) {
    const prefix = id.split("-")[0];
    const group = groups.find((entry) => entry.prefix === prefix);
    if (group) group.ids.push(id);
    else groups.push({ prefix, ids: [id] });
  }
  return groups;
}
