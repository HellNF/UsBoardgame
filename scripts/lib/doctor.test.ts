import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { classic } from "@/content/boards/classic";
import { compareContentRows, CONTENT_COLUMNS } from "./content-publish";
import { migrationLines, migrationsWithoutProbe, MIGRATION_PROBES, roomLines, rlsLines } from "./doctor";

const MIGRATIONS_DIR = resolve(import.meta.dirname, "../../supabase/migrations");
const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();

describe("la tabella dei controlli delle migrazioni", () => {
  it("ogni migrazione sul disco ha la sua voce: chi ne aggiunge una senza, lo scopre qui", () => {
    expect(migrationsWithoutProbe(migrationFiles)).toEqual([]);
  });

  it("le voci parlano di file che esistono", () => {
    for (const probe of MIGRATION_PROBES) expect(migrationFiles).toContain(probe.file);
  });

  it("una voce ha o gli oggetti da controllare o il motivo per cui non si controlla", () => {
    for (const probe of MIGRATION_PROBES) {
      expect(Boolean(probe.objects && probe.objects.length > 0) || Boolean(probe.manual)).toBe(true);
    }
  });
});

describe("migrationLines", () => {
  it("tutte applicate: una riga ok per migrazione", () => {
    const lines = migrationLines(MIGRATION_PROBES.map((probe) => ({ file: probe.file, missing: [] })));
    const ok = lines.filter((line) => line.status === "ok");
    expect(ok).toHaveLength(MIGRATION_PROBES.filter((probe) => probe.objects).length);
  });

  it("un oggetto che non c'è: riga rossa con il nome e il rimedio", () => {
    const lines = migrationLines([
      { file: "20260917000000_init.sql", missing: ["apply_game_action (funzione)"] },
    ]);
    const failed = lines.find((line) => line.status === "fail");
    expect(failed?.detail).toContain("apply_game_action");
    expect(failed?.fix).toContain("supabase db push");
  });

  it("le migrazioni non controllabili dall'API finiscono fra quelle a mano, non fra i rossi", () => {
    const lines = migrationLines(MIGRATION_PROBES.map((probe) => ({ file: probe.file, missing: [] })));
    const manual = lines.filter((line) => line.status === "manual");
    expect(manual).toHaveLength(MIGRATION_PROBES.filter((probe) => probe.manual).length);
    expect(manual.map((line) => line.detail).join(" ")).toContain("realtime.messages");
  });
});

describe("roomLines", () => {
  it("una stanza con due posti è quello che serve per giocare", () => {
    const line = roomLines([{ code: "COPPIA42", seats: 2 }])[0];
    expect(line?.status).toBe("ok");
    expect(line?.detail).toContain("COPPIA42");
  });

  it("nessuna stanza: rosso, con il comando per crearne una", () => {
    const line = roomLines([])[0];
    expect(line?.status).toBe("fail");
    expect(line?.fix).toContain("room:create");
  });

  it("una stanza con un posto solo non basta e lo dice", () => {
    const line = roomLines([{ code: "MEZZA", seats: 1 }])[0];
    expect(line?.status).toBe("fail");
    expect(line?.detail).toContain("1 posto");
  });
});

describe("rlsLines", () => {
  const safe = { rooms: "empty", write: "denied", action: "denied" } as const;

  it("quando RLS regge, tre righe ok", () => {
    const lines = rlsLines(safe);
    expect(lines.map((line) => line.status)).toEqual(["ok", "ok", "ok"]);
  });

  it("se le stanze si leggono, è rosso", () => {
    const line = rlsLines({ ...safe, rooms: "visible" }).find((entry) => entry.label.includes("rooms"));
    expect(line?.status).toBe("fail");
  });

  it("se un client scrive direttamente, è rosso", () => {
    const line = rlsLines({ ...safe, write: "allowed" }).find((entry) =>
      entry.label.includes("non scrivono"),
    );
    expect(line?.status).toBe("fail");
    expect(line?.fix).toContain("RLS");
  });

  it("se un client chiama l'azione, è rosso", () => {
    const line = rlsLines({ ...safe, action: "allowed" }).find((entry) => entry.label.includes("azione"));
    expect(line?.status).toBe("fail");
  });
});

describe("compareContentRows", () => {
  const published = { id: classic.id, name: classic.name, layout: classic, active: true };

  it("stesse righe in ordine di chiavi diverso: nessuna disallineatura", () => {
    const shuffled = { layout: classic, name: classic.name, id: classic.id };
    const drift = compareContentRows("boards", [published], [shuffled]);
    expect(drift).toEqual({ table: "boards", missing: [], extra: [], different: [] });
  });

  it("una riga che in database non c'è: va pubblicata", () => {
    const drift = compareContentRows("boards", [published], []);
    expect(drift.missing).toEqual([classic.id]);
  });

  it("una riga cambiata in database: diversa", () => {
    const drift = compareContentRows("boards", [published], [{ ...published, name: "Altra" }]);
    expect(drift.different).toEqual([classic.id]);
  });

  it("una riga in database che non è più nei file: di troppo (e non si cancella da sé)", () => {
    const drift = compareContentRows("boards", [published], [published, { id: "vecchia", name: "Vecchia" }]);
    expect(drift.extra).toEqual(["vecchia"]);
  });

  it("confronta solo le colonne che content:push scrive: `active` non conta", () => {
    const drift = compareContentRows(
      "questions",
      [{ id: "q1", text: "Ciao", active: false }],
      [{ id: "q1", text: "Ciao", active: true }],
    );
    expect(drift.different).toEqual([]);
    expect(CONTENT_COLUMNS.questions).not.toContain("active");
  });

  it("una colonna assente di qua e di là conta come null, non come differenza", () => {
    const drift = compareContentRows(
      "questions",
      [{ id: "q1", text: "Ciao" }],
      [{ id: "q1", text: "Ciao", options: null }],
    );
    expect(drift.different).toEqual([]);
  });
});
