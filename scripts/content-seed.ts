/**
 * Genera supabase/seed.sql dai contenuti versionati in src/content.
 * Uso: `pnpm content:seed`, poi `pnpm db:reset` in locale.
 * In produzione il seed non parte da solo: vedi docs/content.md § Pubblicare i contenuti.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { seedCounts, seedSource } from "./lib/seed";

const out = resolve(import.meta.dirname, "../supabase/seed.sql");
writeFileSync(out, seedSource());

const { questions, challenges, boards } = seedCounts();
console.log(`seed.sql: ${questions} domande, ${challenges} sfide, ${boards} tabelloni`);
