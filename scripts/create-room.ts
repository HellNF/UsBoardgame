import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/server/auth/password-core";
import { loadEnvFile } from "./lib/env-file";
import { buildRoomRecords, parseRoomArgs, USAGE } from "./lib/room-args";

/**
 * Crea la stanza della coppia (task F0-03): una stanza (codice + password) e i suoi due
 * posti fissi, con nome, pedina e colore. La stanza si crea **una volta sola**.
 *
 *   pnpm room:create --code COPPIA42 --name1 Nicolò --name2 Marta
 *
 * Senza `--` prima delle opzioni: con pnpm 11 il separatore arriva allo script e lo fa
 * fallire con «Argomento inatteso: COPPIA42» (F0-03, Registro di docs/local-testing.md).
 *
 * La password si chiede a terminale, due volte, e non compare mai negli argomenti né
 * nella cronologia della shell. Le variabili di Supabase arrivano da `.env.local`
 * (`cp .env.example .env.local`, valori stampati da `pnpm db:start`).
 *
 * Il client si crea qui e non con `createSupabaseAdminClient()` di `src/lib/supabase/admin.ts`
 * perché quel modulo comincia con `import "server-only"`, che fuori da Next.js (script
 * `tsx`) solleva subito un errore. Le opzioni sono le stesse: secret key, nessuna sessione.
 */

const envPath = resolve(import.meta.dirname, "../.env.local");
loadEnvFile(envPath);

const parsed = parseRoomArgs(process.argv.slice(2));
if (!parsed.ok) {
  console.error(parsed.error);
  console.error("");
  console.error(USAGE);
  process.exit(2);
}
if (parsed.help) {
  console.log(USAGE);
  process.exit(0);
}

const input = parsed.value;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error(
    `Variabili Supabase mancanti: servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY in ${envPath}.`,
  );
  console.error("Copia .env.example in .env.local e incolla i valori stampati da `pnpm db:start`.");
  process.exit(2);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

/** Password chiesta a terminale, mai stampata: l'eco del readline viene silenziata. */
async function askPassword(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const hidden = rl as unknown as { _writeToOutput: (text: string) => void };
  hidden._writeToOutput = (text: string) => {
    if (text.includes("\n")) process.stdout.write("\n");
  };

  const first = await rl.question("Password della stanza: ");
  const second = await rl.question("Ripeti la password: ");
  rl.close();
  process.stdout.write("\n");

  if (first !== second) throw new Error("Le due password non coincidono.");
  if (first.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.`);
  }
  return first;
}

async function main(): Promise<void> {
  const existing = await supabase.from("rooms").select("id").eq("code", input.code).maybeSingle();
  if (existing.error) throw new Error(`Lettura delle stanze fallita: ${existing.error.message}`);
  if (existing.data) {
    throw new Error(`La stanza ${input.code} esiste già: cambia codice, oppure cancella la riga e riprova.`);
  }

  const password = await askPassword();
  const records = buildRoomRecords(input, await hashPassword(password));

  const room = await supabase.from("rooms").insert(records.room).select("id").single();
  if (room.error) throw new Error(`Creazione della stanza fallita: ${room.error.message}`);

  const players = records.players.map((player) => ({ ...player, room_id: room.data.id }));
  const inserted = await supabase.from("players").insert(players).select("id, seat, display_name");
  if (inserted.error) {
    // Una stanza senza i suoi due posti non serve a nulla: si toglie di mezzo.
    await supabase.from("rooms").delete().eq("id", room.data.id);
    throw new Error(`Creazione dei posti fallita: ${inserted.error.message}`);
  }

  console.log(`Stanza ${records.room.code} creata (id ${room.data.id}).`);
  for (const player of inserted.data ?? []) {
    console.log(`  posto ${player.seat}: ${player.display_name} (${player.id})`);
  }
  console.log("");
  console.log("Ora apri l'applicazione, inserisci codice e password e scegli il posto.");
  console.log("Per giocare in due: una finestra normale e una in incognito.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
