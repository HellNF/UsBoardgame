import { describe, expect, it } from "vitest";

import { classic } from "@/content/boards/classic";
import { publishContent, type PublishClient } from "./content-publish";

/**
 * La sequenza di pubblicazione (J2).
 *
 * Il client è finto: quello che si prova qui è che il confronto dei tabelloni venga **prima** di
 * ogni scrittura — quando lo script si ferma non deve aver già pubblicato domande e sfide — e che
 * la scappatoia `--force` riscriva invece di fermarsi.
 */

type Call = { table: string; action: "select" | "upsert"; rows?: unknown[] };

function fakeClient(publishedBoards: { id: string; name: string; layout: unknown }[]): {
  client: PublishClient;
  calls: Call[];
} {
  const calls: Call[] = [];
  const client: PublishClient = {
    from(table: string) {
      return {
        select: (columns: string) => {
          calls.push({ table, action: "select" });
          expect(columns).toBe("id, name, layout");
          return Promise.resolve({ data: publishedBoards, error: null });
        },
        upsert: (rows: unknown[], options: { onConflict: string }) => {
          calls.push({ table, action: "upsert", rows });
          expect(options).toEqual({ onConflict: "id" });
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { client, calls };
}

const publishedClassic = { id: classic.id, name: classic.name, layout: JSON.parse(JSON.stringify(classic)) };

describe("publishContent", () => {
  it("pubblica tutto quando i tabelloni pubblicati sono identici al locale", async () => {
    const { client, calls } = fakeClient([publishedClassic]);
    const outcome = await publishContent(client);
    expect(outcome.ok).toBe(true);
    expect(calls.map((call) => `${call.table}:${call.action}`)).toEqual([
      "boards:select",
      "questions:upsert",
      "challenges:upsert",
      "boards:upsert",
    ]);
  });

  it("se un tabellone è cambiato si ferma **prima** di scrivere qualsiasi cosa", async () => {
    const changed = { ...publishedClassic, layout: { ...classic, decorations: [] } };
    const { client, calls } = fakeClient([changed]);
    const outcome = await publishContent(client);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("atteso uno stop");
    expect(outcome.changed).toEqual([{ id: classic.id, name: classic.name }]);
    // Nessun upsert: mezzo contenuto pubblicato sarebbe peggio di niente.
    expect(calls.map((call) => call.action)).toEqual(["select"]);
  });

  it("con `force` riscrive e va fino in fondo", async () => {
    const changed = { ...publishedClassic, layout: { ...classic, decorations: [] } };
    const { client, calls } = fakeClient([changed]);
    const outcome = await publishContent(client, { force: true });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("atteso un esito positivo");
    expect(outcome.publication.changed).toHaveLength(1);
    expect(calls.filter((call) => call.action === "upsert")).toHaveLength(3);
  });

  it("un tabellone mai pubblicato non ferma niente: è nuovo, si scrive", async () => {
    const { client, calls } = fakeClient([]);
    const outcome = await publishContent(client);
    expect(outcome.ok).toBe(true);
    expect(calls.filter((call) => call.action === "upsert")).toHaveLength(3);
  });

  it("se la lettura dei tabelloni fallisce, lancia e non scrive", async () => {
    const client: PublishClient = {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: "connection refused" } }),
        upsert: () => {
          throw new Error("non doveva scrivere");
        },
      }),
    };
    await expect(publishContent(client)).rejects.toThrow(
      /Lettura dei tabelloni pubblicati: connection refused/,
    );
  });

  it("le domande pubblicate hanno i campi della tabella (la scheda fuori, le opzioni dentro)", async () => {
    const { client, calls } = fakeClient([publishedClassic]);
    await publishContent(client);
    const rows = calls.find((call) => call.table === "questions")?.rows ?? [];
    expect(rows.length).toBeGreaterThan(100);
    for (const row of rows as Record<string, unknown>[]) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.text).toBe("string");
      expect(row.active).toBe(true);
    }
  });
});
