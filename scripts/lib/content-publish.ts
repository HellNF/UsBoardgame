import { boards } from "../../src/content/boards";
import { challenges } from "../../src/content/challenges";
import { questions } from "../../src/content/questions";
import {
  compareBoards,
  canonicalJson,
  type BoardChange,
  type BoardPublication,
  type PublishedBoard,
} from "./board-publish";

/**
 * La pubblicazione dei contenuti, in una funzione pura di database ma non di rete (J2).
 *
 * `pnpm content:push` è il guscio: variabili d'ambiente, stampa, codice di uscita. Qui c'è la
 * sequenza, che si può provare senza Supabase con un client finto — e la parte che conta è
 * l'**ordine**: il confronto dei tabelloni viene **prima** della prima scrittura, così quando lo
 * script si ferma non ha già pubblicato mezzo contenuto.
 */

/** Quello che serve del client Supabase: leggere i tabelloni e fare upsert. */
export type PublishClient = {
  from(table: string): {
    select(columns: string): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
    upsert(
      rows: unknown[],
      options: { onConflict: string },
    ): PromiseLike<{ error: { message: string } | null }>;
  };
};

export type PublishOutcome =
  { ok: true; publication: BoardPublication } | { ok: false; changed: BoardChange[] };

/**
 * Le colonne che `content:push` scrive davvero, tabella per tabella (K3).
 *
 * `active` sta fuori di proposito: in database una domanda si può spegnere a mano, e non è una
 * disallineatura dai file. Il controllo dei contenuti del `doctor` confronta **queste** colonne.
 */
export const CONTENT_COLUMNS = {
  questions: ["id", "category", "level", "kind", "text", "sheet_text", "options"],
  challenges: ["id", "data"],
  boards: ["id", "name", "layout"],
} as const;

export type ContentTable = keyof typeof CONTENT_COLUMNS;

/** Le righe che vanno in `public.questions`. */
export function questionRows() {
  return questions.map((question) => ({
    id: question.id,
    category: question.category,
    level: question.level,
    kind: question.kind,
    text: question.text,
    sheet_text: question.sheetText ?? null,
    options: question.options ?? null,
    active: true,
  }));
}

/** Le righe che vanno in `public.challenges` (`data` è la sfida intera). */
export function challengeRows() {
  return challenges.map((challenge) => ({ id: challenge.id, data: challenge, active: true }));
}

/** Le righe che vanno in `public.boards` (il `layout` è la disposizione intera). */
export function boardRows() {
  return boards.map((board) => ({ id: board.id, name: board.name, layout: board }));
}

/** Quello che c'è da sapere su una tabella: righe mancanti, righe di troppo, righe diverse. */
export type ContentDrift = {
  table: ContentTable;
  missing: string[];
  extra: string[];
  different: string[];
};

/**
 * Confronta i contenuti locali con quelli pubblicati, sulle sole colonne di `CONTENT_COLUMNS`.
 * Stessa idea di `compareBoards` (J2): JSON canonico, perché `jsonb` non conserva l'ordine delle
 * chiavi e un confronto testuale direbbe «diverso» a ogni pubblicazione identica.
 */
export function compareContentRows(
  table: ContentTable,
  local: Record<string, unknown>[],
  published: Record<string, unknown>[],
): ContentDrift {
  const columns = CONTENT_COLUMNS[table];
  const project = (row: Record<string, unknown>) =>
    canonicalJson(Object.fromEntries(columns.map((column) => [column, row[column] ?? null])));

  const localById = new Map(local.map((row) => [String(row.id), project(row)]));
  const publishedById = new Map(published.map((row) => [String(row.id), project(row)]));

  const missing: string[] = [];
  const different: string[] = [];
  for (const [id, localJson] of localById) {
    const publishedJson = publishedById.get(id);
    if (publishedJson === undefined) missing.push(id);
    else if (publishedJson !== localJson) different.push(id);
  }
  const extra = [...publishedById.keys()].filter((id) => !localById.has(id));

  return { table, missing, extra, different };
}

/** Pubblica domande, sfide e tabelloni. Si ferma (senza scrivere niente) se un tabellone è cambiato. */
export async function publishContent(
  client: PublishClient,
  options: { force?: boolean } = {},
): Promise<PublishOutcome> {
  const published = await client.from("boards").select("id, name, layout");
  if (published.error) throw new Error(`Lettura dei tabelloni pubblicati: ${published.error.message}`);

  const publication = compareBoards(boards, (published.data ?? []) as PublishedBoard[]);
  if (publication.changed.length > 0 && !options.force) return { ok: false, changed: publication.changed };

  const questionsResult = await client.from("questions").upsert(questionRows(), { onConflict: "id" });
  if (questionsResult.error) throw new Error(`Domande: ${questionsResult.error.message}`);

  const challengesResult = await client.from("challenges").upsert(challengeRows(), { onConflict: "id" });
  if (challengesResult.error) throw new Error(`Sfide: ${challengesResult.error.message}`);

  const boardsResult = await client.from("boards").upsert(boardRows(), { onConflict: "id" });
  if (boardsResult.error) throw new Error(`Tabelloni: ${boardsResult.error.message}`);

  return { ok: true, publication };
}
