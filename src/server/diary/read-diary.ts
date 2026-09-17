import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { EVENTS } from "@/content/events";
import { ITEMS } from "@/content/items";
import type { EventCardId, GameState, ItemId, Seat } from "@/engine";
import { parseGameState } from "@/server/game/context";

/**
 * Diario della serata (F5-06): i momenti si costruiscono dal registro `game_events`, non da
 * uno stato salvato a parte. Le risposte della scheda non compaiono mai: negli eventi c'è solo
 * la risposta **data** dal giocatore.
 *
 * La mappa evento → momento è pura e si prova con i test; sotto c'è solo la lettura del database.
 * I tipi qui sotto rispecchiano `DiaryEntry` e l'archivio di `src/features/diary/diary-view.tsx`
 * (che `src/server` non può importare: la regola di import vale in un verso solo).
 */

export type DiaryEntryRow = {
  id: string;
  round: number;
  seat: Seat;
  kind: "question" | "challenge" | "event" | "coins" | "star";
  title: string;
  detail: string;
};

export type ArchiveRow = {
  id: string;
  date: string;
  winner: Seat | "draw";
  stars: { 1: number; 2: number };
  coins: { 1: number; 2: number };
};

/** Riga di `game_events` che serve al diario. */
export type EventRow = {
  id: number | string;
  version: number;
  seat: number | null;
  type: string;
  payload: Record<string, unknown>;
};

const VERDICTS: Record<string, string> = {
  correct: "giusta",
  almost: "quasi",
  wrong: "sbagliata",
};

const METHODS: Record<string, string> = {
  automatic: "minigioco",
  double_confirm: "doppia conferma",
  judge: "giudizio",
  coin_flip: "lancio di moneta",
};

const COIN_SOURCES: Record<string, string> = {
  cell: "casella",
  question: "domanda",
  challenge: "sfida",
  gift: "regalo",
  thief: "ladro",
  star_purchase: "stella comprata",
  item_purchase: "oggetto comprato",
};

const asSeat = (value: unknown): Seat | null => (value === 1 || value === 2 ? value : null);
const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" ? value : fallback);
const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);

/**
 * Trasforma gli eventi in momenti leggibili: una riga per evento che vale la pena raccontare
 * (le domande, le sfide, gli imprevisti, le monete, gli oggetti, le scale e i serpenti).
 * I tiri e i cambi di turno restano fuori: sono rumore nel diario.
 */
export function diaryEntriesFromEvents(events: EventRow[]): DiaryEntryRow[] {
  const entries: DiaryEntryRow[] = [];
  let round = 1;

  for (const event of events) {
    if (event.type === "ROUND_STARTED") round = asNumber(event.payload.round, round);
    const seat = asSeat(event.seat);
    if (!seat) continue;

    const push = (kind: DiaryEntryRow["kind"], title: string, detail: string) => {
      entries.push({ id: String(event.id), round, seat, kind, title, detail });
    };

    switch (event.type) {
      case "QUESTION_ANSWERED":
        push(
          "question",
          `Domanda ${asString(event.payload.questionId, "?")}`,
          `Risposta: «${asString(event.payload.answer)}»`,
        );
        break;
      case "QUESTION_JUDGED":
        push(
          "question",
          `Domanda ${asString(event.payload.questionId, "?")}`,
          `Verdetto: ${VERDICTS[asString(event.payload.verdict)] ?? asString(event.payload.verdict)}.`,
        );
        break;
      case "QUESTION_SKIPPED":
        push("question", "Domanda saltata", "Salta domanda consumato: nessuna moneta, nessuna salita.");
        break;
      case "CHALLENGE_RESOLVED": {
        const winner = event.payload.seat;
        push(
          "challenge",
          `Sfida ${asString(event.payload.challengeId, "?")}`,
          winner === "draw" || winner === null
            ? `Pareggio: nessun premio (${METHODS[asString(event.payload.method)] ?? "?"}).`
            : `Vinta: +${asNumber(event.payload.prize)} monete (${METHODS[asString(event.payload.method)] ?? "?"}).`,
        );
        break;
      }
      case "CHALLENGE_DISPUTED":
        entries.push({
          id: String(event.id),
          round,
          seat: 1,
          kind: "challenge",
          title: "Dichiarazioni diverse",
          detail: "Rivincita o lancio di moneta (D-27).",
        });
        break;
      case "TIMER_EXPIRED":
        push(
          "challenge",
          `Tempo scaduto: ${asString(event.payload.challengeId, "?")}`,
          event.payload.outcome === "failed"
            ? "Prova fallita: nessun premio."
            : "Si passa alla doppia conferma.",
        );
        break;
      case "EVENT_RESOLVED": {
        const eventId = asString(event.payload.eventId) as EventCardId;
        push(
          "event",
          EVENTS[eventId]?.name ?? `Imprevisto ${eventId}`,
          asString(event.payload.detail, EVENTS[eventId]?.effect ?? ""),
        );
        break;
      }
      case "COINS_GAINED":
        push(
          "coins",
          `+${asNumber(event.payload.amount)} monete`,
          `${COIN_SOURCES[asString(event.payload.source)] ?? asString(event.payload.source)}${
            event.payload.doubled === true ? " (raddoppiate)" : ""
          }.`,
        );
        break;
      case "COINS_LOST":
        push(
          "coins",
          `−${asNumber(event.payload.amount)} monete`,
          `${COIN_SOURCES[asString(event.payload.source)] ?? asString(event.payload.source)}.`,
        );
        break;
      case "ITEM_BOUGHT":
        push(
          "coins",
          ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto",
          `Comprato: ${asNumber(event.payload.price)} monete.`,
        );
        break;
      case "ITEM_RECEIVED":
        push(
          "coins",
          ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto",
          "Ricevuto in regalo.",
        );
        break;
      case "ITEM_USED":
        push("coins", ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto", "Usato.");
        break;
      case "ITEM_DISCARDED":
        push(
          "coins",
          ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto",
          "Scartato: lo zaino è pieno.",
        );
        break;
      case "CLIMBED_LADDER":
        push("event", "Scala", `Dalla ${asNumber(event.payload.from)} alla ${asNumber(event.payload.to)}.`);
        break;
      case "SLID_DOWN_SNAKE":
        push(
          "event",
          "Serpente",
          `Dalla ${asNumber(event.payload.from)} alla ${asNumber(event.payload.to)}.`,
        );
        break;
      case "STAR_BOUGHT":
        push("star", "Stella comprata", `${asNumber(event.payload.price)} monete.`);
        break;
      case "STAR_DECLINED":
        push("star", "Stella rifiutata", "Nessuna moneta spesa.");
        break;
      case "FINISH_REACHED":
        push("star", "Arrivo alla 100", `Round ${asNumber(event.payload.round, round)}.`);
        break;
      default:
        break;
    }
  }

  return entries;
}

/** Il minimo che serve al diario di una partita: le due forme di `GameRow` (context e lobby) lo soddisfano. */
export type DiaryGame = {
  id: string;
  status: string;
  state: unknown;
  finished_at?: string | null;
};

/** Momenti della serata: gli eventi della partita più recente che li ha. */
export async function readDiary(
  admin: SupabaseClient,
  games: DiaryGame[],
): Promise<{ entries: DiaryEntryRow[]; archive: ArchiveRow[] }> {
  const dateFormat = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const archive: ArchiveRow[] = [];
  for (const game of games) {
    if (game.status !== "finished" || game.state === null) continue;
    const state: GameState = parseGameState(game.state);
    archive.push({
      id: game.id,
      date: game.finished_at ? dateFormat.format(new Date(game.finished_at)) : "senza data",
      winner: state.winner ?? "draw",
      stars: { 1: state.players[1].stars, 2: state.players[2].stars },
      coins: { 1: state.players[1].coins, 2: state.players[2].coins },
    });
  }

  const playing = games.filter((game) => game.status === "playing" || game.status === "finished").at(0);
  if (!playing) return { entries: [], archive };

  const result = await admin
    .from("game_events")
    .select("id, version, seat, type, payload")
    .eq("game_id", playing.id)
    .order("id", { ascending: true });
  if (result.error) throw new Error(`Lettura del diario fallita: ${result.error.message}`);

  return { entries: diaryEntriesFromEvents((result.data ?? []) as EventRow[]), archive };
}
