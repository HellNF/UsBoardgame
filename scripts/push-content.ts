import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { boards } from "../src/content/boards";
import { challenges } from "../src/content/challenges";
import { questions } from "../src/content/questions";
import { boardChangeWarning, isForceFlag } from "./lib/board-publish";
import { publishContent } from "./lib/content-publish";
import { loadEnvFile } from "./lib/env-file";

/**
 * Pubblica i contenuti versionati nel database (task F3-05): `pnpm content:push`.
 *
 * In locale i contenuti arrivano da `supabase/seed.sql` con `pnpm db:reset`; questo script
 * serve per **produzione**, dove il seed non parte da solo (docs/content.md § Pubblicare i
 * contenuti). Fa upsert sulle stesse tabelle, con gli stessi id stabili: ripubblicare i
 * contenuti non duplica nulla e non tocca schede, domande usate né partite.
 *
 * **I tabelloni però non si riscrivono** (J2): prima di toccare qualsiasi cosa, lo script confronta
 * il layout locale di ogni tabellone con quello già pubblicato e, se è diverso, **si ferma**
 * dicendo quale id è cambiato. Un tabellone pubblicato è immutabile: la riga della partita porta il
 * suo id e il diario di una serata passata lo ridisegna leggendolo dal database (AGENTS.md regola 7).
 * Le due uscite sono un id nuovo per il tabellone nuovo, oppure la scappatoia esplicita
 * `pnpm content:push -- --force` (il `--` serve: pnpm si tiene i flag e non li passa allo script).
 *
 * Le variabili si leggono da `.env.local` come per `pnpm room:create`; in produzione si
 * passano dall'ambiente (`SUPABASE_PUBLISHABLE_URL` + `SUPABASE_SECRET_KEY` del progetto).
 *
 * La sequenza sta in `scripts/lib/content-publish.ts` (con i suoi test): qui c'è solo il guscio —
 * variabili, client, stampa, codici di uscita (2 variabili mancanti, 3 tabellone cambiato).
 */

const force = isForceFlag(process.argv.slice(2));

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
  // La sequenza (confronto dei tabelloni **prima** di ogni scrittura) sta in scripts/lib/content-publish.ts.
  const outcome = await publishContent(supabase, { force });

  if (!outcome.ok) {
    console.error(boardChangeWarning(outcome.changed));
    process.exit(3);
  }

  const { publication } = outcome;
  if (publication.changed.length > 0) {
    console.warn(
      `Riscritto con \`--force\`: ${publication.changed.map(({ id }) => id).join(", ")} — una serata passata che li usa ridisegnerebbe un altro tabellone.`,
    );
  }

  console.log(
    `Pubblicati: ${questions.length} domande, ${challenges.length} sfide, ${boards.length} tabelloni in ${url}.`,
  );
  const summary = [
    `${publication.unchanged.length} già identici`,
    publication.added.length > 0
      ? `${publication.added.length} nuovi (${publication.added.join(", ")})`
      : "nessun tabellone nuovo",
    publication.changed.length > 0
      ? `${publication.changed.length} riscritti (${publication.changed.map(({ id }) => id).join(", ")})`
      : "nessuno riscritto",
  ];
  console.log(`Tabelloni: ${summary.join(" · ")}.`);
  if (publication.onlyPublished.length > 0) {
    console.log(
      `Tabelloni pubblicati che non sono più fra i contenuti locali (non li tocco): ${publication.onlyPublished.join(", ")}.`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
