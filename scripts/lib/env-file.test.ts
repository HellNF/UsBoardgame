import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadEnvFile, parseEnvFile } from "./env-file";

describe("lettura di .env.local per gli script (F0-03)", () => {
  it("legge coppie chiave=valore, salta commenti e righe vuote", () => {
    const values = parseEnvFile(
      [
        "# commento",
        "",
        "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321",
        'SUPABASE_SECRET_KEY="sb_secret_finto"',
        "ALTRA='con apice'",
        "VALORE_CON_UGUALE=a=b",
        "riga-senza-uguale",
      ].join("\n"),
    );
    expect(values).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SECRET_KEY: "sb_secret_finto",
      ALTRA: "con apice",
      VALORE_CON_UGUALE: "a=b",
    });
  });

  it("non sovrascrive una variabile già presente nell'ambiente", () => {
    const dir = mkdtempSync(join(tmpdir(), "env-file-"));
    const path = join(dir, ".env.local");
    writeFileSync(path, "PROVA_ROOM_CREATE=dalfile\nALTRA_CHIAVE=valore\n");

    process.env.PROVA_ROOM_CREATE = "dallambiente";
    const keys = loadEnvFile(path);

    expect(process.env.PROVA_ROOM_CREATE).toBe("dallambiente");
    expect(process.env.ALTRA_CHIAVE).toBe("valore");
    expect(keys).toEqual(["PROVA_ROOM_CREATE", "ALTRA_CHIAVE"]);

    delete process.env.PROVA_ROOM_CREATE;
    delete process.env.ALTRA_CHIAVE;
  });

  it("su un file che non esiste non fa nulla e non solleva errori", () => {
    expect(loadEnvFile("/percorso/che/non/esiste/.env.local")).toEqual([]);
  });
});
