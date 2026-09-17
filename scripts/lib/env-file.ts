import { readFileSync } from "node:fs";

/**
 * Lettura di un file `.env` per gli script da terminale (`pnpm room:create`, `content:push`).
 * Next.js legge `.env.local` da solo, uno script `tsx` no: senza questo, le variabili di
 * Supabase non arrivano.
 *
 * Regole: le righe `#` e quelle vuote si saltano, si accettano `CHIAVE=valore`,
 * `CHIAVE="valore"` e `CHIAVE='valore'`, e le variabili già presenti nell'ambiente
 * **vincono** sul file (è quello che ci si aspetta lanciando lo script con una variabile
 * impostata a mano).
 */
export function parseEnvFile(content: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (key === "") continue;
    let value = line.slice(separator + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

/** Legge il file e riempie `process.env` con quello che manca. Ritorna le chiavi lette. */
export function loadEnvFile(path: string): string[] {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  const values = parseEnvFile(content);
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return Object.keys(values);
}
