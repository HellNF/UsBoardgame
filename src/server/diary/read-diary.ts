import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { EVENTS } from "@/content/events";
import { ITEMS } from "@/content/items";
import { challenges } from "@/content/challenges";
import { questions } from "@/content/questions";
import type { EventCardId, GameState, ItemId, Seat } from "@/engine";
import { plural } from "@/lib/plural";
import { parseGameState } from "@/server/game/context";

/**
 * Diario della serata (F5-06): i momenti si costruiscono dal registro `game_events`, non da
 * uno stato salvato a parte. Le risposte della scheda non compaiono mai: negli eventi c'è solo
 * la risposta **data** dal giocatore.
 *
 * La mappa evento → momento è pura e si prova con i test; sotto c'è solo la lettura del database.
 * I tipi qui sotto rispecchiano `DiaryEntry` e l'archivio di `src/features/diary/diary-view.tsx`
 * (che `src/server` non può importare: la regola di import vale in un verso solo).
 *
 * I **testi** delle domande e i **nomi** delle sfide si prendono dal catalogo nel bundle
 * (`src/content`), come fa `online-table` per le carte: stesso testo della partita, nessuna
 * seconda copia nel database e nessuna query in più (D-54).
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

/** Da dove arrivano (o dove vanno) le monete, detto come si direbbe a voce. */
const COIN_SOURCES: Record<string, { gained: string; lost: string }> = {
  cell: { gained: "Dalla casella", lost: "Alla casella" },
  question: { gained: "Dalla domanda", lost: "Alla domanda" },
  challenge: { gained: "Dalla sfida", lost: "Alla sfida" },
  gift: { gained: "Dal regalo", lost: "Al regalo" },
  thief: { gained: "Dal ladro", lost: "Al ladro" },
  star_purchase: { gained: "Dalla stella", lost: "Alla stella comprata" },
  item_purchase: { gained: "Dall'oggetto", lost: "All'oggetto comprato" },
};

/** Testi delle domande dal catalogo nel bundle: nel diario ci va il testo, non l'id. */
const QUESTION_TEXTS = new Map(questions.map((question) => [question.id, question.text]));

/** Nomi delle sfide dal catalogo nel bundle. */
const CHALLENGE_NAMES = new Map(challenges.map((challenge) => [challenge.id, challenge.name]));

const questionTitle = (id: string): string => QUESTION_TEXTS.get(id) ?? `Domanda ${id}`;
const challengeName = (id: string): string => CHALLENGE_NAMES.get(id) ?? `Sfida ${id}`;

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
          questionTitle(asString(event.payload.questionId, "?")),
          `Risposta: «${asString(event.payload.answer)}»`,
        );
        break;
      case "QUESTION_JUDGED":
        push(
          "question",
          questionTitle(asString(event.payload.questionId, "?")),
          `Verdetto: ${VERDICTS[asString(event.payload.verdict)] ?? asString(event.payload.verdict)}.`,
        );
        break;
      case "QUESTION_SKIPPED":
        push("question", "Domanda saltata", "Usato «Salta domanda»: l'oggetto è andato, il turno no.");
        break;
      case "CHALLENGE_RESOLVED": {
        const winner = event.payload.seat;
        push(
          "challenge",
          challengeName(asString(event.payload.challengeId, "?")),
          winner === "draw" || winner === null
            ? `Pareggio: nessun premio (${METHODS[asString(event.payload.method)] ?? "?"}).`
            : `Vinta: +${plural(asNumber(event.payload.prize), "moneta", "monete")} (${METHODS[asString(event.payload.method)] ?? "?"}).`,
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
          `Tempo scaduto: ${challengeName(asString(event.payload.challengeId, "?"))}`,
          event.payload.outcome === "failed"
            ? "La prova non è riuscita: nessun premio."
            : "Si passa alle dichiarazioni di entrambi.",
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
      case "COINS_GAINED": {
        // Le monete a zero non sono un momento della serata.
        const amount = asNumber(event.payload.amount);
        if (amount <= 0) break;
        const source = COIN_SOURCES[asString(event.payload.source)];
        push(
          "coins",
          `+${plural(amount, "moneta", "monete")}`,
          `${source?.gained ?? asString(event.payload.source)}${event.payload.doubled === true ? ", raddoppiate" : ""}.`,
        );
        break;
      }
      case "COINS_LOST": {
        const amount = asNumber(event.payload.amount);
        if (amount <= 0) break;
        const source = COIN_SOURCES[asString(event.payload.source)];
        push(
          "coins",
          `−${plural(amount, "moneta", "monete")}`,
          `${source?.lost ?? asString(event.payload.source)}.`,
        );
        break;
      }
      case "ITEM_BOUGHT":
        push(
          "coins",
          ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto",
          `Comprato: ${plural(asNumber(event.payload.price), "moneta", "monete")}.`,
        );
        break;
      case "ITEM_RECEIVED":
        push(
          "coins",
          ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto",
          "Arrivato in regalo.",
        );
        break;
      case "ITEM_USED":
        push("coins", ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto", "Usato nel turno.");
        break;
      case "ITEM_DISCARDED":
        push(
          "coins",
          ITEMS[asString(event.payload.item) as ItemId]?.name ?? "Oggetto",
          "Lasciato andare: lo zaino era pieno.",
        );
        break;
      case "CLIMBED_LADDER":
        push("event", "La scala", `Su, dalla ${asNumber(event.payload.from)} alla ${asNumber(event.payload.to)}.`);
        break;
      case "SLID_DOWN_SNAKE":
        push("event", "Il serpente", `Giù, dalla ${asNumber(event.payload.from)} alla ${asNumber(event.payload.to)}.`);
        break;
      case "STAR_BOUGHT":
        push("star", "Stella comprata", `Pagata ${plural(asNumber(event.payload.price), "moneta", "monete")}.`);
        break;
      case "STAR_DECLINED":
        push("star", "Stella rifiutata", "Nessuna moneta spesa: le monete restano in tasca.");
        break;
      case "FINISH_REACHED":
        push("star", "Arrivo alla 100", `Round ${asNumber(event.payload.round, round)}: la partita si chiude alla fine del giro.`);
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
