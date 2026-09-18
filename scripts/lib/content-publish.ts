import { boards } from "../../src/content/boards";
import { challenges } from "../../src/content/challenges";
import { questions } from "../../src/content/questions";
import { compareBoards, type BoardChange, type BoardPublication, type PublishedBoard } from "./board-publish";

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

/** Le righe che vanno in `public.questions`. */
function questionRows() {
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

  const challengesResult = await client.from("challenges").upsert(
    challenges.map((challenge) => ({ id: challenge.id, data: challenge, active: true })),
    { onConflict: "id" },
  );
  if (challengesResult.error) throw new Error(`Sfide: ${challengesResult.error.message}`);

  const boardsResult = await client.from("boards").upsert(
    boards.map((board) => ({ id: board.id, name: board.name, layout: board })),
    { onConflict: "id" },
  );
  if (boardsResult.error) throw new Error(`Tabelloni: ${boardsResult.error.message}`);

  return { ok: true, publication };
}
