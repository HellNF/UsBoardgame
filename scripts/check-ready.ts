/**
 * Il controllo prima della serata (K3): `pnpm doctor`.
 *
 *   pnpm doctor
 *
 * Dice se un ambiente è pronto a ospitare una partita vera — locale o remoto, le variabili si leggono
 * da `.env.local` come `content:push` (l'ambiente vince sul file). Risponde a sei domande che finora
 * erano sei verifiche a mano nel Registro:
 *
 *  1. le **migrazioni** applicate sono quelle in `supabase/migrations` (controllate una per una
 *     provando gli oggetti che creano: una tabella si legge, una funzione si chiama con argomenti
 *     finti e innocui — un id che non esiste, così non scrive niente);
 *  2. l'**accesso anonimo** è attivo (sul remoto è spento di default: senza, nessuno entra);
 *  3. i **contenuti** sono pubblicati e identici ai file (stesso confronto canonico di J2, sulle
 *     colonne che `content:push` scrive davvero);
 *  4. esiste **almeno una stanza con due posti**;
 *  5. la **RLS** regge: una sessione anonima non legge `rooms`, non scrive direttamente e non chiama
 *     `apply_game_action`;
 *  6. il **canale privato** — che non si prova da qui — rimanda a `pnpm check:realtime`.
 *
 * Ogni riga ha un esito, e quando è rossa dice cosa fare. Quello che il doctor **non può sapere**
 * (l'interruttore «Allow public access» del dashboard) non diventa verde per finta: è una riga
 * «a mano», con dove guardare. Il giudizio sulle righe sta in `scripts/lib/doctor.ts`, con i test.
 */
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { exitCodeFor, renderLines, summarize, type CheckLine } from "./lib/checks";
import {
  boardRows,
  challengeRows,
  compareContentRows,
  CONTENT_COLUMNS,
  questionRows,
  type ContentDrift,
} from "./lib/content-publish";
import {
  anonymousLine,
  contentLines,
  manualLines,
  migrationLines,
  MIGRATION_PROBES,
  roomLines,
  rlsLines,
  type MigrationOutcome,
  type RlsOutcome,
} from "./lib/doctor";
import { loadEnvFile } from "./lib/env-file";

const envPath = resolve(import.meta.dirname, "../.env.local");
loadEnvFile(envPath);

/** PostgREST risponde così quando una funzione non esiste con quegli argomenti. */
const isMissingFunction = (error: { code?: string; message: string }): boolean =>
  error.code === "PGRST202" || /could not find the function/i.test(error.message);

/** Il database non risponde affatto: è un'altra cosa da una tabella che manca. */
const isUnreachable = (error: { message: string }): boolean =>
  /fetch failed|ECONNREFUSED|ENOTFOUND|network|socket hang up/i.test(error.message);

/** Un oggetto manca? Una tabella che non si legge, una funzione che non si trova. */
async function probeMigrations(admin: SupabaseClient): Promise<MigrationOutcome[]> {
  const outcomes: MigrationOutcome[] = [];

  for (const probe of MIGRATION_PROBES) {
    const missing: string[] = [];
    const probeId = randomUUID();

    for (const object of probe.objects ?? []) {
      if (object.kind === "table") {
        const result = await admin.from(object.name).select("*", { count: "exact", head: true });
        if (result.error) {
          // Con il database irraggiungibile *ogni* tabella risulta mancante: meglio dirlo una volta.
          if (isUnreachable(result.error))
            throw new Error(`Il database non risponde: ${result.error.message}`);
          missing.push(`${object.name} (tabella)`);
        }
      } else {
        const args = object.args ? object.args(probeId) : {};
        const result = await admin.rpc(object.name, args);
        if (result.error && isMissingFunction(result.error)) missing.push(`${object.name} (funzione)`);
      }
    }

    outcomes.push({ file: probe.file, missing });
  }

  return outcomes;
}

/** I contenuti pubblicati, confrontati con i file (le stesse colonne che scrive `content:push`). */
async function contentDrifts(admin: SupabaseClient): Promise<ContentDrift[]> {
  const tables = [
    { table: "questions" as const, local: questionRows() as unknown as Record<string, unknown>[] },
    { table: "challenges" as const, local: challengeRows() as unknown as Record<string, unknown>[] },
    { table: "boards" as const, local: boardRows() as unknown as Record<string, unknown>[] },
  ];

  const drifts: ContentDrift[] = [];
  for (const { table, local } of tables) {
    const result = await admin.from(table).select(CONTENT_COLUMNS[table].join(", "));
    if (result.error) throw new Error(`Lettura di \`${table}\`: ${result.error.message}`);
    drifts.push(
      compareContentRows(table, local, (result.data ?? []) as unknown as Record<string, unknown>[]),
    );
  }
  return drifts;
}

/** Le stanze con quanti posti hanno. */
async function roomsWithSeats(admin: SupabaseClient): Promise<{ code: string; seats: number }[]> {
  const rooms = await admin.from("rooms").select("id, code");
  if (rooms.error) throw new Error(`Lettura delle stanze: ${rooms.error.message}`);
  const players = await admin.from("players").select("room_id");
  if (players.error) throw new Error(`Lettura dei posti: ${players.error.message}`);

  const seatsByRoom = new Map<string, number>();
  for (const row of (players.data ?? []) as { room_id: string }[]) {
    seatsByRoom.set(row.room_id, (seatsByRoom.get(row.room_id) ?? 0) + 1);
  }
  return ((rooms.data ?? []) as { id: string; code: string }[]).map((room) => ({
    code: room.code,
    seats: seatsByRoom.get(room.id) ?? 0,
  }));
}

/** Le tre prove della RLS, con una sessione anonima vera (che non deve poter far niente). */
async function probeRls(anon: SupabaseClient): Promise<RlsOutcome> {
  const read = await anon.from("rooms").select("id").limit(1);
  const rooms: RlsOutcome["rooms"] = !read.error && (read.data ?? []).length > 0 ? "visible" : "empty";

  // La chiave esterna su `question_id` fa sì che questa riga **non possa** essere scritta: se la RLS
  // non la ferma, la ferma il database — e il codice dell'errore dice chi delle due è stato.
  const write = await anon
    .from("sheet_answers")
    .insert({ player_id: randomUUID(), question_id: "prova-del-doctor", answer: "prova" });
  const writeOutcome: RlsOutcome["write"] = !write.error
    ? "allowed"
    : write.error.code === "42501"
      ? "denied"
      : "other";

  const action = await anon.rpc("apply_game_action", {
    p_game_id: randomUUID(),
    p_expected_version: -1,
    p_new_state: {},
    p_events: [],
  });
  const actionOutcome: RlsOutcome["action"] = !action.error
    ? "allowed"
    : action.error.code === "42501" || /permission denied/i.test(action.error.message)
      ? "denied"
      : isMissingFunction(action.error)
        ? "missing"
        : "other";

  const detail = write.error?.message ?? action.error?.message ?? "";
  return { rooms, write: writeOutcome, action: actionOutcome, detail };
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishable || !secret) {
    console.error(
      `Variabili Supabase mancanti: servono NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY (${envPath} o ambiente).`,
    );
    console.error("Copia .env.example in .env.local e incolla i valori stampati da `pnpm db:start`.");
    process.exit(2);
  }

  const lines: CheckLine[] = [];
  console.log(`Controllo dell'ambiente: ${url}\n`);

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    lines.push(...migrationLines(await probeMigrations(admin)));

    const anon = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
    const session = await anon.auth.signInAnonymously();
    const anonymousOk = !session.error && session.data.user !== null;
    lines.push(
      anonymousLine(
        anonymousOk,
        anonymousOk
          ? `sessione anonima creata (${session.data.user?.id ?? "?"})`
          : (session.error?.message ?? "nessuna sessione"),
      ),
    );

    lines.push(...contentLines(await contentDrifts(admin)));
    lines.push(...roomLines(await roomsWithSeats(admin)));

    if (anonymousOk) {
      lines.push(...rlsLines(await probeRls(anon)));
      await anon.auth.signOut().catch(() => null);
      await anon.auth.admin.deleteUser(session.data.user?.id ?? "").catch(() => null);
    } else {
      lines.push({
        label: "RLS",
        status: "manual",
        detail: "senza una sessione anonima le tre prove della RLS non si possono fare",
      });
    }

    lines.push(...manualLines());
  } catch (error) {
    lines.push({
      label: "controllo",
      status: "fail",
      detail: error instanceof Error ? error.message : String(error),
      fix: "il database risponde? (in locale `pnpm db:start`; sul remoto controlla le variabili)",
    });
  }

  console.log(renderLines(lines));
  console.log("");
  console.log(summarize(lines));
  process.exit(exitCodeFor(lines));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
