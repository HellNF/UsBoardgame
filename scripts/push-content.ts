import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { boards } from "../src/content/boards";
import { challenges } from "../src/content/challenges";
import { questions } from "../src/content/questions";
import { loadEnvFile } from "./lib/env-file";

/**
 * Pubblica i contenuti versionati nel database (task F3-05): `pnpm content:push`.
 *
 * In locale i contenuti arrivano da `supabase/seed.sql` con `pnpm db:reset`; questo script
 * serve per **produzione**, dove il seed non parte da solo (docs/content.md § Pubblicare i
 * contenuti). Fa upsert sulle stesse tabelle, con gli stessi id stabili: ripubblicare i
 * contenuti non duplica nulla e non tocca schede, domande usate né partite.
 *
 * Le variabili si leggono da `.env.local` come per `pnpm room:create`; in produzione si
 * passano dall'ambiente (`SUPABASE_PUBLISHABLE_URL` + `SUPABASE_SECRET_KEY` del progetto).
 */

const envPath = resolve(import.meta.dirname, "../.env.local");
loadEnvFile(envPath);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error(
    `Variabili Supabase mancanti: servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY in ${envPath}.`,
  );
  process.exit(2);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

async function main(): Promise<void> {
  const questionsResult = await supabase.from("questions").upsert(
    questions.map((question) => ({
      id: question.id,
      category: question.category,
      level: question.level,
      kind: question.kind,
      text: question.text,
      sheet_text: question.sheetText ?? null,
      options: question.options ?? null,
      active: true,
    })),
    { onConflict: "id" },
  );
  if (questionsResult.error) throw new Error(`Domande: ${questionsResult.error.message}`);

  const challengesResult = await supabase.from("challenges").upsert(
    challenges.map((challenge) => ({ id: challenge.id, data: challenge, active: true })),
    { onConflict: "id" },
  );
  if (challengesResult.error) throw new Error(`Sfide: ${challengesResult.error.message}`);

  const boardsResult = await supabase.from("boards").upsert(
    boards.map((board) => ({ id: board.id, name: board.name, layout: board })),
    { onConflict: "id" },
  );
  if (boardsResult.error) throw new Error(`Tabelloni: ${boardsResult.error.message}`);

  console.log(
    `Pubblicati: ${questions.length} domande, ${challenges.length} sfide, ${boards.length} tabelloni in ${url}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
