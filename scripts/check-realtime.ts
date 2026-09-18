/**
 * La prova a due sessioni sul canale Realtime (K1, F2-03/F2-04, D-79).
 *
 *   pnpm check:realtime
 *
 * Perché è uno script e non un test Vitest: vuole un **database vivo** (locale o remoto, le
 * variabili si leggono da `.env.local` come `content:push`, e l'ambiente vince sul file).
 *
 * Cosa fa, per intero, e poi pulisce:
 *
 *  1. crea una **stanza usa e getta** (codice e password generati qui: nessun terminale, nessuna
 *     password negli argomenti) con i suoi due posti;
 *  2. apre due **sessioni anonime**, una per posto, le fa entrare nella stanza (`joinRoom`, la stessa
 *     funzione della route) e le iscrive al canale **privato** `room:<id>`;
 *  3. fa giocare una **mossa vera** dal posto di turno (`applyAction`, la pipeline di
 *     `POST /api/games/[gameId]/actions`) e aspetta che l'**altra** sessione la riceva dal canale —
 *     con un tempo massimo, non un `sleep` a caso;
 *  4. controlla la **presenza** (i due posti si vedono) e che una **terza** sessione, senza posto in
 *     quella stanza, resti fuori: dal canale privato (deve essere rifiutata) e da un canale
 *     **pubblico** con lo stesso topic (non deve vedere nessuno — è la metà che dipende
 *     dall'interruttore «Allow public access» del progetto);
 *  5. **pulisce** la stanza e tutto quello che ha creato, anche se la prova fallisce;
 *  6. stampa un esito leggibile e esce con un codice diverso da zero se qualcosa non torna.
 *
 * La diagnosi distingue i due casi che contano (Registro di J3): **mosse ferme** = la policy su
 * `realtime.messages` è troppo stretta (mosse ed eventi viaggiano sulla stessa sottoscrizione della
 * presenza); **mosse arrivate e presenza spenta** = è la presenza. Le funzioni che decidono cosa
 * scrivere stanno in `scripts/lib/realtime-check.ts`, con i loro test: qui c'è solo il giro vero.
 *
 * Va rilanciata ogni volta che si tocca la RLS o il canale. Il task resta [L]: RLS e Realtime non si
 * provano in CI, si provano così.
 */
import { randomInt } from "node:crypto";
import { resolve } from "node:path";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

import type { Seat } from "@/engine/types";
import { hashPassword } from "@/server/auth/password-core";
import { applyAction } from "@/server/game/apply-action";
import { loadGameById, parseGameState } from "@/server/game/context";
import { DEFAULT_SETTINGS, createLobbyGame, initialStateFor, startLobbyGame } from "@/server/room/lobby";
import { joinRoom } from "@/server/room/join";
import { exitCodeFor, renderLines, summarize, type CheckLine } from "./lib/checks";
import { loadEnvFile } from "./lib/env-file";
import { deferred, diagnose, waitFor, withTimeout, type RealtimeRun } from "./lib/realtime-check";
import { buildRoomRecords } from "./lib/room-args";

const SUBSCRIBE_TIMEOUT_MS = 15_000;
const PRESENCE_TIMEOUT_MS = 15_000;
const MOVE_TIMEOUT_MS = 15_000;
const PUBLIC_PROBE_SETTLE_MS = 1_000;

const envPath = resolve(import.meta.dirname, "../.env.local");
loadEnvFile(envPath);

type Provisioned = {
  code: string;
  password: string;
  roomId: string;
  gameId: string;
  playerIds: string[];
  version: number;
  turn: Seat;
};

/** Codice di stanza casuale, nella forma accettata da `room:create` (4-12 caratteri A-Z0-9). */
function randomCode(): string {
  return `PROVA${randomInt(0, 100_000).toString().padStart(5, "0")}`;
}

/** Password della stanza di prova: generata qui, mai stampata, mai passata da un terminale. */
function randomPassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let index = 0; index < 16; index++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

async function anonSession(
  url: string,
  publishable: string,
  label: string,
): Promise<{ client: SupabaseClient; userId: string }> {
  const client = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      `Sessione anonima «${label}» fallita: ${error?.message ?? "nessun utente"}. ` +
        "L'accesso anonimo è attivo su questo progetto? (sul remoto è spento di default)",
    );
  }
  return { client, userId: data.user.id };
}

/** I posti che questo canale vede collegati, per numero di posto. */
function presenceSeats(channel: RealtimeChannel): Set<number> {
  const seats = new Set<number>();
  for (const entries of Object.values(channel.presenceState())) {
    for (const entry of entries as { seat?: number }[]) {
      if (typeof entry.seat === "number") seats.add(entry.seat);
    }
  }
  return seats;
}

/** Aspetta il primo stato definitivo del canale: `SUBSCRIBED` o il rifiuto del server. */
async function subscribeStatus(channel: RealtimeChannel, timeoutMs: number): Promise<string> {
  return withTimeout(
    new Promise<string>((resolve) => {
      channel.subscribe((status) => {
        if (
          status === "SUBSCRIBED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          resolve(status);
        }
      });
    }),
    timeoutMs,
    `il canale ${channel.topic} non ha risposto entro ${Math.round(timeoutMs / 1000)} s`,
  );
}

async function provision(admin: SupabaseClient): Promise<Provisioned> {
  const input = {
    code: randomCode(),
    name1: "Prova uno",
    name2: "Prova due",
    pawn1: "fox" as const,
    pawn2: "rabbit" as const,
    color1: "red" as const,
    color2: "blue" as const,
  };
  const password = randomPassword();
  const records = buildRoomRecords(input, await hashPassword(password));

  const room = await admin.from("rooms").insert(records.room).select("id").single();
  if (room.error) throw new Error(`Creazione della stanza di prova fallita: ${room.error.message}`);
  const roomId = room.data.id as string;

  const inserted = await admin
    .from("players")
    .insert(records.players.map((player) => ({ ...player, room_id: roomId })))
    .select("id");
  if (inserted.error) {
    await admin.from("rooms").delete().eq("id", roomId);
    throw new Error(`Creazione dei posti di prova fallita: ${inserted.error.message}`);
  }

  const settings = { ...DEFAULT_SETTINGS };
  const game = await createLobbyGame(admin, roomId, settings);
  await startLobbyGame(admin, game.id, initialStateFor(settings));

  const started = await loadGameById(admin, game.id);
  if (!started || started.state === null) {
    throw new Error("La serata di prova non è partita: controlla le migrazioni (`pnpm db:reset`).");
  }
  const state = parseGameState(started.state);

  return {
    code: input.code,
    password,
    roomId,
    gameId: game.id,
    playerIds: (inserted.data ?? []).map((row) => row.id as string),
    version: started.version,
    turn: state.turn,
  };
}

/** La stanza di prova e tutto quello che ha creato: anche quando la prova fallisce. */
async function cleanup(
  admin: SupabaseClient,
  provisioned: Provisioned | null,
  userIds: string[],
): Promise<{ ok: boolean; detail: string }> {
  if (!provisioned) return { ok: true, detail: "niente da pulire" };
  const failed: string[] = [];

  const deleteGame = await admin.from("games").delete().eq("id", provisioned.gameId);
  if (deleteGame.error) failed.push(`partita: ${deleteGame.error.message}`);

  if (userIds.length > 0) {
    const deleteSessions = await admin.from("player_sessions").delete().in("auth_user_id", userIds);
    if (deleteSessions.error) failed.push(`sessioni: ${deleteSessions.error.message}`);
  }

  const deletePlayers = await admin.from("players").delete().eq("room_id", provisioned.roomId);
  if (deletePlayers.error) failed.push(`posti: ${deletePlayers.error.message}`);

  const deleteRoom = await admin.from("rooms").delete().eq("id", provisioned.roomId);
  if (deleteRoom.error) failed.push(`stanza: ${deleteRoom.error.message}`);

  const stillThere = await admin.from("rooms").select("id").eq("id", provisioned.roomId).maybeSingle();
  const gone = !stillThere.data && !stillThere.error;
  if (!gone) failed.push(`la stanza ${provisioned.code} è ancora nel database`);

  return {
    ok: failed.length === 0,
    detail: failed.length === 0 ? `stanza ${provisioned.code} e righe collegate rimosse` : failed.join("; "),
  };
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

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const progress: CheckLine[] = [];
  const clients: SupabaseClient[] = [];
  const channels: RealtimeChannel[] = [];
  const userIds: string[] = [];
  let provisioned: Provisioned | null = null;
  let run: RealtimeRun | null = null;
  let failure: string | null = null;

  try {
    provisioned = await provision(admin);
    progress.push({
      label: "stanza di prova",
      status: "ok",
      detail: `${provisioned.code} · canale room:${provisioned.roomId} · partita ${provisioned.gameId}`,
    });

    const first = await anonSession(url, publishable, "posto 1");
    const second = await anonSession(url, publishable, "posto 2");
    clients.push(first.client, second.client);
    userIds.push(first.userId, second.userId);

    for (const [seat, session] of [
      [1, first],
      [2, second],
    ] as const) {
      const joined = await joinRoom({
        userId: session.userId,
        admin,
        request: { code: provisioned.code, password: provisioned.password, seat },
      });
      if (!joined.ok)
        throw new Error(`Ingresso del posto ${seat} fallito (${joined.status}): ${joined.error}`);
    }
    progress.push({ label: "sessioni anonime", status: "ok", detail: "due posti entrati nella stanza" });

    // I canali: **gli stessi** del client della partita (`use-room-realtime.ts`), compresa la
    // presenza con la chiave del posto. Se qui il canale è diverso, la prova non prova niente.
    const watchers = [first, second].map((session, index) => {
      const seat = (index + 1) as Seat;
      const channel = session.client.channel(`room:${provisioned?.roomId}`, {
        config: { private: true, presence: { key: String(seat) } },
      });
      channels.push(channel);

      const arrived = deferred<void>();
      let received = 0;
      channel
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${provisioned?.gameId}` },
          () => {
            received += 1;
            arrived.resolve();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_events",
            filter: `game_id=eq.${provisioned?.gameId}`,
          },
          () => {
            received += 1;
            arrived.resolve();
          },
        )
        .on("presence", { event: "sync" }, () => {});
      return { session, seat, channel, arrived, receivedAfterAction: () => received };
    });

    for (const watcher of watchers) {
      // Il token della sessione va dato a Realtime: senza, il canale privato non ha un `auth.uid()`.
      await watcher.session.client.realtime.setAuth();
      const status = await subscribeStatus(watcher.channel, SUBSCRIBE_TIMEOUT_MS);
      if (status !== "SUBSCRIBED") {
        throw new Error(
          `Il posto ${watcher.seat} non è entrato nel canale (${status}). Con il canale privato questo è già la diagnosi: la policy su realtime.messages non lo ammette.`,
        );
      }
      await watcher.channel.track({ seat: watcher.seat, screen: "game" });
    }
    progress.push({
      label: "canale privato",
      status: "ok",
      detail: "i due posti sono iscritti (private: true) e hanno annunciato la loro presenza",
    });

    const presenceOk = await waitFor(
      () => watchers.every((watcher) => presenceSeats(watcher.channel).size >= 2),
      PRESENCE_TIMEOUT_MS,
    );

    // L'azione: il posto di turno tira i dadi, come il primo clic di una serata vera.
    const actor = watchers.find((watcher) => watcher.seat === provisioned?.turn) ?? watchers[0]!;
    const other = watchers.find((watcher) => watcher !== actor)!;

    const startedAt = Date.now();
    const applied = await applyAction({
      admin,
      userId: actor.session.userId,
      gameId: provisioned.gameId,
      action: { type: "ROLL", seat: actor.seat },
      expectedVersion: provisioned.version,
    });

    let movesMs: number | null = null;
    if (!applied.ok) {
      run = {
        topic: `room:${provisioned.roomId}`,
        action: "refused",
        actionDetail: `il motore ha rifiutato la mossa (${applied.status}): ${applied.error}`,
        movesMs: null,
        moveTimeoutMs: MOVE_TIMEOUT_MS,
        presenceSeen: presenceOk,
        closed: true,
        closedDetail: "non provato",
        publicSeatsSeen: 0,
        cleanedUp: true,
      };
      throw new Error(`L'azione di prova non è passata: ${applied.error}`);
    }

    try {
      await withTimeout(
        other.arrived.promise,
        MOVE_TIMEOUT_MS,
        `l'altro posto non ha ricevuto niente entro ${Math.round(MOVE_TIMEOUT_MS / 1000)} s`,
      );
      movesMs = Date.now() - startedAt;
    } catch {
      movesMs = null;
    }

    // La terza sessione: anonima come le altre, ma **senza posto in questa stanza**.
    const intruder = await anonSession(url, publishable, "terza sessione");
    clients.push(intruder.client);
    userIds.push(intruder.userId);
    await intruder.client.realtime.setAuth();

    const privateChannel = intruder.client.channel(`room:${provisioned.roomId}`, {
      config: { private: true, presence: { key: "intruso" } },
    });
    channels.push(privateChannel);
    let closedDetail = "";
    let closed = false;
    try {
      const status = await subscribeStatus(privateChannel, SUBSCRIBE_TIMEOUT_MS);
      closed = status !== "SUBSCRIBED";
      closedDetail = closed ? `rifiutata (${status})` : "iscritta al canale: non è chiuso";
    } catch (error) {
      closed = true;
      closedDetail = `rifiutata (${error instanceof Error ? error.message : String(error)})`;
    }

    // E il canale **pubblico** con lo stesso topic: è quello che aprirebbe un estraneo.
    const publicChannel = intruder.client.channel(`room:${provisioned.roomId}`, {
      config: { presence: { enabled: true, key: "intruso" } },
    });
    channels.push(publicChannel);
    let publicSeatsSeen = 0;
    try {
      const status = await subscribeStatus(publicChannel, SUBSCRIBE_TIMEOUT_MS);
      if (status === "SUBSCRIBED") {
        await new Promise((resolve) => setTimeout(resolve, PUBLIC_PROBE_SETTLE_MS));
        publicSeatsSeen = presenceSeats(publicChannel).size;
      }
    } catch {
      publicSeatsSeen = 0;
    }

    run = {
      topic: `room:${provisioned.roomId}`,
      action: "applied",
      actionDetail: `ROLL del posto ${actor.seat}, versione ${applied.version}`,
      movesMs,
      moveTimeoutMs: MOVE_TIMEOUT_MS,
      presenceSeen: presenceOk,
      closed,
      closedDetail,
      publicSeatsSeen,
      cleanedUp: true,
    };
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  } finally {
    for (const channel of channels) await channel.unsubscribe().catch(() => null);
    for (const client of clients) {
      await client.removeAllChannels().catch(() => null);
      await client.realtime.disconnect().catch(() => null);
      await client.auth.signOut().catch(() => null);
    }
    for (const userId of userIds) {
      await admin.auth.admin.deleteUser(userId).catch(() => null);
    }
    const cleaned = await cleanup(admin, provisioned, userIds);
    if (run) {
      run.cleanedUp = cleaned.ok;
    } else {
      // Senza `run` non c'è diagnosi: la riga della pulizia la mettiamo qui.
      progress.push(
        cleaned.ok
          ? { label: "pulizia", status: "ok", detail: cleaned.detail }
          : {
              label: "pulizia",
              status: "fail",
              detail: cleaned.detail,
              fix: "cancella a mano quello che è rimasto (gli id sono nella riga della stanza di prova)",
            },
      );
    }
  }

  const lines = [...progress, ...(run ? diagnose(run) : [])];
  if (!run) {
    lines.push({
      label: "prova a due sessioni",
      status: "fail",
      detail: failure ?? "interrotta prima di poter provare il canale",
      fix: "leggi il messaggio: se il canale non si è aperto, la policy su realtime.messages non ammette la sessione",
    });
  }

  console.log("Prova del canale Realtime (K1)");
  console.log(renderLines(lines));
  console.log("");
  console.log(summarize(lines));
  process.exit(exitCodeFor(lines));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
