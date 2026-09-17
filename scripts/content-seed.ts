/**
 * Genera supabase/seed.sql dai contenuti versionati in src/content.
 * Uso: `pnpm content:seed`, poi `pnpm db:reset` in locale.
 * In produzione il seed non parte da solo: vedi docs/content.md § Pubblicare i contenuti.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { boards } from "../src/content/boards";
import { challenges } from "../src/content/challenges";
import { questions } from "../src/content/questions";

const lit = (value: string | null | undefined) =>
  value == null ? "null" : `'${value.replaceAll("'", "''")}'`;
const json = (value: unknown) => (value == null ? "null" : `${lit(JSON.stringify(value))}::jsonb`);

const ids = new Set<string>();
for (const { id } of [...questions, ...challenges, ...boards]) {
  if (ids.has(id)) throw new Error(`Id duplicato nei contenuti: ${id}`);
  ids.add(id);
}

const lines = [
  "-- File generato da scripts/content-seed.ts: non modificare a mano.",
  "",
  ...questions.map(
    (q) =>
      `insert into public.questions (id, category, level, kind, text, sheet_text, options) values (${lit(q.id)}, ${lit(q.category)}, ${q.level}, ${lit(q.kind)}, ${lit(q.text)}, ${lit(q.sheetText)}, ${json(q.options)}) on conflict (id) do update set category = excluded.category, level = excluded.level, kind = excluded.kind, text = excluded.text, sheet_text = excluded.sheet_text, options = excluded.options;`,
  ),
  "",
  ...challenges.map(
    (c) =>
      `insert into public.challenges (id, data) values (${lit(c.id)}, ${json(c)}) on conflict (id) do update set data = excluded.data;`,
  ),
  "",
  ...boards.map(
    (b) =>
      `insert into public.boards (id, name, layout) values (${lit(b.id)}, ${lit(b.name)}, ${json(b)}) on conflict (id) do update set name = excluded.name, layout = excluded.layout;`,
  ),
  "",
];

const out = resolve(import.meta.dirname, "../supabase/seed.sql");
writeFileSync(out, lines.join("\n"));
console.log(`seed.sql: ${questions.length} domande, ${challenges.length} sfide, ${boards.length} tabelloni`);
