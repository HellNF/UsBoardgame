import type { BoardLayout } from "@/engine";

/**
 * Pubblicare i contenuti senza riscrivere un tabellone già in gioco (F7-03, pacchetto J).
 *
 * `pnpm content:push` fa upsert con `onConflict: "id"`: per domande e sfide è voluto (i testi si
 * correggono), per i **tabelloni** no. Un tabellone pubblicato è **immutabile**: la riga della
 * partita porta il suo id, e il diario di una serata passata lo ridisegna leggendolo dal database —
 * se quel layout cambia sotto, il diario di una partita già giocata mostra un altro tabellone.
 * È la regola 7 di AGENTS.md («id dei contenuti stabili») estesa ai tabelloni: se un tabellone deve
 * cambiare, prende un **id nuovo** (`classic-2`), e il vecchio resta dov'è.
 *
 * Qui c'è solo il confronto fra il layout locale e quello pubblicato: quale decisione prendere
 * (fermarsi, o ripubblicare con la scappatoia) la prende lo script.
 */

/** Una riga di `public.boards` letta dal database. */
export type PublishedBoard = { id: string; name: string; layout: unknown };

export type BoardChange = { id: string; name: string };

export type BoardPublication = {
  /** Mai pubblicati: si scrivono senza toccare niente di esistente. */
  added: string[];
  /** Già pubblicati e identici al locale: niente da fare. */
  unchanged: string[];
  /** Già pubblicati e **diversi**: un upsert riscriverebbe un tabellone in gioco. */
  changed: BoardChange[];
  /** Pubblicati che non sono più fra i contenuti locali: non si toccano (e si fanno notare). */
  onlyPublished: string[];
};

/**
 * JSON **canonico**: chiavi in ordine alfabetico e `undefined` fuori, così il confronto non dipende
 * dall'ordine dei campi. Serve perché `jsonb` non conserva l'ordine delle chiavi — una riga letta
 * dal database è «uguale» al file locale ma non lo è come testo.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}

/** Vero se il tabellone locale e la riga pubblicata sono lo stesso tabellone. */
function sameBoard(board: BoardLayout, published: PublishedBoard): boolean {
  return board.name === published.name && canonicalJson(board) === canonicalJson(published.layout);
}

/** Confronta i tabelloni locali con quelli pubblicati: chi si aggiunge, chi è uguale, chi è cambiato. */
export function compareBoards(local: BoardLayout[], published: PublishedBoard[]): BoardPublication {
  const byId = new Map(published.map((row) => [row.id, row]));

  const added: string[] = [];
  const unchanged: string[] = [];
  const changed: BoardChange[] = [];
  for (const board of local) {
    const row = byId.get(board.id);
    if (!row) added.push(board.id);
    else if (sameBoard(board, row)) unchanged.push(board.id);
    else changed.push({ id: board.id, name: board.name });
  }

  const localIds = new Set(local.map((board) => board.id));
  const onlyPublished = published
    .filter((row) => !localIds.has(row.id))
    .map((row) => row.id)
    .sort();

  return { added, unchanged, changed, onlyPublished };
}

/**
 * Vero se fra gli argomenti c'è la scappatoia `--force`.
 *
 * Attenzione al `--`: `pnpm content:push --force` **non** funziona, perché pnpm si tiene i flag e non
 * li passa allo script; con il separatore, `pnpm content:push -- --force`, gli argomenti arrivano
 * (compreso il `--` letterale, che qui si ignora). Provato a mano: `pnpm board:freeze --force` non
 * arriva allo script, `pnpm board:freeze -- --force` sì.
 */
export function isForceFlag(args: readonly string[]): boolean {
  return args.some((argument) => argument === "--force");
}

/** Il messaggio da stampare quando il push si ferma: quale id è cambiato e cosa si può fare. */
export function boardChangeWarning(changed: BoardChange[]): string {
  const list = changed.map(({ id, name }) => `  • ${id} (${name})`).join("\n");
  return [
    `Tabelloni già pubblicati con un layout diverso da quello locale:\n${list}`,
    "",
    "Un tabellone pubblicato è **immutabile**: una serata già archiviata lo ridisegna leggendolo dal",
    "database, e riscriverlo cambierebbe il diario di una partita già giocata (AGENTS.md regola 7,",
    "estesa ai tabelloni). Domande e sfide no: i loro testi si correggono, e restano come sono.",
    "",
    "Due strade:",
    "  1. il tabellone nuovo prende un **id nuovo** (cambia `id` nel file di contenuto: `classic-2`) e si",
    "     pubblica: il vecchio resta dov'è, per le serate che l'hanno usato;",
    "  2. lo si ripubblica **sopra** quello esistente, sapendo cosa si riscrive:",
    "     `pnpm content:push -- --force`.",
  ].join("\n");
}
