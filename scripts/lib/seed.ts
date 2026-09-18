import { boards } from "../../src/content/boards";
import { challenges } from "../../src/content/challenges";
import { questions } from "../../src/content/questions";

/**
 * Il contenuto di `supabase/seed.sql`, come stringa (K4).
 *
 * Sta qui e non dentro `scripts/content-seed.ts` perché **due** cose devono usare questa funzione:
 * lo script che scrive il file (`pnpm content:seed`) e il test che controlla che il file su disco
 * sia ancora quello che `src/content` produrrebbe. Il guard di J2 ha trovato un `seed.sql` vecchio
 * per caso (una disallineatura vera fra file e database locale): con questo test una disallineatura
 * del genere fa fallire `pnpm check` invece di aspettare il prossimo push.
 */

const lit = (value: string | null | undefined) =>
  value == null ? "null" : `'${value.replaceAll("'", "''")}'`;

const json = (value: unknown) => (value == null ? "null" : `${lit(JSON.stringify(value))}::jsonb`);

/** Id ripetuti fra domande, sfide e tabelloni: il seed non si scrive nemmeno. */
function assertUniqueIds(): void {
  const ids = new Set<string>();
  for (const { id } of [...questions, ...challenges, ...boards]) {
    if (ids.has(id)) throw new Error(`Id duplicato nei contenuti: ${id}`);
    ids.add(id);
  }
}

/** Il file generato, riga per riga. Puro: legge i contenuti, non tocca il disco. */
export function seedSource(): string {
  assertUniqueIds();

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

  return lines.join("\n");
}

/** Quante righe scrive il seed, per il messaggio dello script. */
export function seedCounts(): { questions: number; challenges: number; boards: number } {
  return { questions: questions.length, challenges: challenges.length, boards: boards.length };
}
