import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { seedCounts, seedSource } from "./seed";

/**
 * K4: `supabase/seed.sql` deve essere quello che `src/content` produce **adesso**.
 *
 * Il guard di J2 (`content:push` che si ferma su un tabellone cambiato) ha trovato un `seed.sql`
 * vecchio per caso: il file era rimasto indietro rispetto a `classic.ts` da quando le decorazioni
 * erano state spostate, e il database locale — che nasce dal seed — era disallineato dai contenuti.
 * La stessa idea, spostata prima: invece di aspettare il prossimo push, `pnpm check` diventa rosso.
 */

const SEED_PATH = resolve(import.meta.dirname, "../../supabase/seed.sql");

describe("supabase/seed.sql", () => {
  it("è esattamente quello che generano i contenuti in src/content", () => {
    const onDisk = readFileSync(SEED_PATH, "utf8");
    expect(
      onDisk,
      "supabase/seed.sql non corrisponde a src/content: lancia `pnpm content:seed` e committa il file.",
    ).toBe(seedSource());
  });

  it("comincia con l'intestazione da file generato", () => {
    expect(readFileSync(SEED_PATH, "utf8").split("\n")[0]).toBe(
      "-- File generato da scripts/content-seed.ts: non modificare a mano.",
    );
  });

  it("conta le stesse righe dei contenuti", () => {
    const source = readFileSync(SEED_PATH, "utf8");
    const counts = seedCounts();
    expect(counts.questions).toBeGreaterThan(0);
    expect(counts.challenges).toBeGreaterThan(0);
    expect(counts.boards).toBeGreaterThan(0);
    // Una riga per contenuto, più le righe vuote fra le sezioni.
    expect(source.match(/insert into public\.questions/g)).toHaveLength(counts.questions);
    expect(source.match(/insert into public\.challenges/g)).toHaveLength(counts.challenges);
    expect(source.match(/insert into public\.boards/g)).toHaveLength(counts.boards);
  });
});
