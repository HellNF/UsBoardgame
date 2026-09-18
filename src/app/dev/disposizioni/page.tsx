import { notFound } from "next/navigation";

import { illustrationsByCategory } from "@/art/illustrations";
import { frozenBoards } from "@/content/boards";
import { classic } from "@/content/boards/classic";
import { Board } from "@/features/board/board";
import { HOTSEAT_SETTINGS } from "@/features/game/dev-context";
import {
  READABILITY_BUDGET,
  createInitialState,
  describeBudget,
  fitsBudget,
  generateBoard,
  measureReadability,
  type BoardLayout,
} from "@/engine";

/**
 * Disposizioni generate da un seme (task F7-02) e disposizioni congelate (F7-03).
 *
 * Il generatore è `generateBoard(seed)` in `src/engine`: puro, senza `Math.random`, con i
 * vincoli di docs/rules.md § Tabellone, la regola delle decorazioni di D-65 e il budget di
 * leggibilità del piazzamento (I2). Questa pagina è il **modo per guardarlo**: quattro semi fissi,
 * più quello che si scrive nel campo (così si confrontano due tabelloni senza toccare il codice), e
 * in testa le disposizioni **congelate** — i semi che il proprietario ha scelto di tenere. I
 * tabelloni sono disegnati dal componente vero della partita, non da una copia.
 *
 * Pagina **di sviluppo**: in produzione risponde 404 come `/dev/hotseat` e `/dev/art` (D-43).
 * Non cambia niente della partita: la disposizione di una serata resta `classic`, e quale
 * tabellone usi una serata nuova è una decisione di prodotto (F7-02, F7-03).
 */
const FIXED_SEEDS = [1, 2, 3, 4];

const seedFrom = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  const seed = Number(raw);
  return Number.isInteger(seed) && seed > 0 ? seed : null;
};

/** Riga di riepilogo: cosa ha scelto il generatore, in numeri. */
function Summary({ board }: { board: BoardLayout }) {
  const ladders = board.ladders.map(({ from, to }) => `${from}→${to}`).join(" ");
  const snakes = board.snakes.map(({ from, to }) => `${from}→${to}`).join(" ");
  const decorations = board.decorations.map(({ shape, cells }) => `${shape} ${cells.join("+")}`).join(" · ");
  const readability = measureReadability(board);
  const within = fitsBudget(readability, READABILITY_BUDGET);

  return (
    <dl className="flex flex-col gap-1 font-sans text-xs text-ink/80">
      <div>
        <dt className="inline font-semibold">Scale </dt>
        <dd className="inline">{ladders}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Serpenti </dt>
        <dd className="inline">{snakes}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Decorazioni </dt>
        <dd className="inline">{decorations}</dd>
      </div>
      {/* Il budget di leggibilità (I2), misurato con lo stesso conto del generatore: due linee
          sulla stessa casella si sovrappongono e lì il numero della casella sparisce. */}
      <div>
        <dt className="inline font-semibold">Leggibilità </dt>
        <dd className="inline">
          {readability.crossings} caselle con più di una linea, al massimo {readability.linesPerCell}{" "}
          {readability.linesPerCell === 1 ? "linea" : "linee"} su una casella — il tetto è{" "}
          {describeBudget(READABILITY_BUDGET)} {within ? "✓" : "✗"}
        </dd>
      </div>
    </dl>
  );
}

/** Un tabellone con il suo riepilogo: lo stesso riquadro per i semi e per le disposizioni congelate. */
function BoardPreview({ heading, board }: { heading: React.ReactNode; board: BoardLayout }) {
  // Il tabellone vuole uno stato: i due posti fermi sulla partenza bastano a disegnarlo.
  const state = createInitialState({ ...HOTSEAT_SETTINGS, boardId: board.id }, 1);

  return (
    <section className="flex flex-col gap-3 border-t-2 border-ink/20 pt-4">
      <h2 className="font-display text-2xl italic">{heading}</h2>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
        <Board
          board={board}
          state={state}
          names={{ 1: "Leo", 2: "Marta" }}
          colors={{ 1: "red", 2: "blue" }}
          pawns={HOTSEAT_SETTINGS.pawns}
        />
        <Summary board={board} />
      </div>
    </section>
  );
}

function SeedBoard({ seed, board }: { seed: number; board: BoardLayout }) {
  return (
    <div id={`seme-${seed}`}>
      <BoardPreview
        board={board}
        heading={
          <>
            Seme {seed} <span className="font-sans text-sm text-ink/60 not-italic">{board.name}</span>
          </>
        }
      />
    </div>
  );
}

/**
 * Le disposizioni congelate (F7-03): un file di dati per ognuna, scritto da `pnpm board:freeze`.
 * Sono i semi che il proprietario ha scelto di tenere, con i nomi che ha scelto; non entrano in
 * partita da sole (l'elenco offerto è `boards`, che resta la `classic`).
 */
function FrozenBoards() {
  return (
    <section className="flex flex-col gap-4 border-b-2 border-ink/20 pb-4">
      <h2 className="font-display text-3xl italic">Disposizioni congelate</h2>
      {frozenBoards.length === 0 ? (
        <p className="text-sm text-ink/70">
          Nessuna per ora. Un seme si congela con{" "}
          <code className="bg-ink/5 px-1">pnpm board:freeze &lt;seme&gt; &lt;nome&gt;</code>: il file compare
          in <code className="bg-ink/5 px-1">src/content/boards/</code> e questa sezione lo disegna qui, con i
          suoi numeri. Da lì non si muove più, nemmeno se il generatore cambia.
        </p>
      ) : (
        frozenBoards.map((board) => (
          <BoardPreview
            key={board.id}
            board={board}
            heading={
              <>
                {board.name} <span className="font-sans text-sm text-ink/60 not-italic">{board.id}</span>
              </>
            }
          />
        ))
      )}
    </section>
  );
}

export default async function BoardSeedsPage({ searchParams }: PageProps<"/dev/disposizioni">) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const asked = seedFrom(params.seme);
  const seeds = asked && !FIXED_SEEDS.includes(asked) ? [asked, ...FIXED_SEEDS] : FIXED_SEEDS;

  const pool = illustrationsByCategory();
  const boards = seeds.map((seed) => ({ seed, board: generateBoard({ seed, illustrations: pool }) }));
  // La `classic` è la misura di riferimento: il tetto di leggibilità viene dal suo conto (I2).
  const classicMeasure = measureReadability(classic);

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-6 p-6 font-sans text-ink">
      <header className="flex flex-col gap-3 border-b-4 border-ink pb-3">
        <h1 className="font-display text-3xl italic">Disposizioni da seme</h1>
        <p className="text-sm text-ink/70">
          Stesso seme, stessa disposizione: {boards.length} tabelloni disegnati dal componente della partita.
          Le regole che il generatore rispetta sono in <code>docs/rules.md</code> § Tabellone, più D-65 per le
          decorazioni (si decora solo una casella libera, interna e che nulla attraversa) e il budget di
          leggibilità del piazzamento (<code>RULES.board.maxCrossings</code>,{" "}
          <code>RULES.board.maxLinesPerCell</code>). Per confronto, la <code>classic</code> — che è disegnata
          a mano — ha {classicMeasure.crossings} caselle con più di una linea e al massimo{" "}
          {classicMeasure.linesPerCell} linee su una casella. Pagina di sviluppo: in produzione risponde 404.
        </p>
        <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="seme" className="font-semibold">
            Guarda un altro seme
          </label>
          <input
            id="seme"
            name="seme"
            type="number"
            min={1}
            defaultValue={asked ?? 1}
            className="w-24 border-2 border-ink bg-paper px-2 py-1 text-center"
          />
          <button type="submit" className="rounded-full border-2 border-ink px-4 py-1">
            Guarda
          </button>
          <a className="underline" href="/dev/disposizioni">
            torna ai quattro semi fissi
          </a>
        </form>
      </header>

      <FrozenBoards />

      {boards.map(({ seed, board }) => (
        <SeedBoard key={seed} seed={seed} board={board} />
      ))}
    </main>
  );
}
