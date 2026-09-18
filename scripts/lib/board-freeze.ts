import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { illustrationsByCategory } from "../../src/art/illustrations";
import {
  assertValidBoard,
  generateBoard,
  type BoardLayout,
  type Cell,
  type IllustrationPool,
} from "../../src/engine";

/**
 * Congelare una disposizione: dal seme al file di contenuto (F7-03, pacchetto I).
 *
 * Una disposizione che piace si **congela**: si genera una volta dal seme e si scrive accanto alla
 * `classic` come **dati**, non come una chiamata al generatore. Da quel momento non si muove più —
 * se un giorno il generatore cambia, la disposizione già scelta resta quella che il proprietario ha
 * guardato. È la differenza fra «il seme 12» (che vale finché il generatore sta fermo) e «la
 * disposizione *Serata d'estate*» (che vale per sempre).
 *
 * I **nomi** e i **semi** li sceglie il proprietario: qui non ce n'è nessuno, e nessuna disposizione
 * è congelata nel repository. Lo script `scripts/board-freeze.ts` è l'unico che chiama
 * `generateBoard`; il resto (la pagina di sviluppo, i test) legge solo i file.
 *
 * Una disposizione congelata **non entra in partita da sola**: `boards` in `src/content/boards/index.ts`
 * resta la `classic`, e quale tabellone usi una serata è la decisione di prodotto di F7-03 (con la
 * conseguenza sui dati scritta nel log del pacchetto I: il tabellone va salvato sulla riga della
 * partita, altrimenti il diario di una serata passata non si può più ridisegnare).
 */

/** La cartella delle disposizioni, e il file che le raccoglie per chi le legge. */
export const BOARDS_DIRECTORY = resolve(import.meta.dirname, "../../src/content/boards");
export const FROZEN_BARREL_FILE = "frozen.ts";
/** Nomi che non possono diventare una disposizione: sono file che esistono già o non sono dati. */
const RESERVED_SLUGS = new Set(["classic", "index", "frozen"]);

/** Lo slug di un nome: minuscole, accenti tolti, spazi in trattini. */
export function boardSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "disposizione" : slug;
}

/** Il nome dell'esportazione del file: `serata-d-estate` → `serataDEstate`. */
export function boardIdentifier(slug: string): string {
  const camel = slug
    .split("-")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("");
  // Un identificatore non può cominciare con una cifra (`pnpm board:freeze 7 "42 serpenti"`).
  return /^[a-z]/.test(camel) ? camel : `disposizione${camel[0].toUpperCase()}${camel.slice(1)}`;
}

/** Il nome del file di una disposizione: `<slug>.ts`. */
export function frozenFileName(slug: string): string {
  return `${slug}.ts`;
}

/** Vero se lo slug può diventare una disposizione nuova. */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/** Una casella in forma di dato, come la scrive la `classic`. */
function cellLiteral(cell: Cell): string {
  const parts = [`n: ${cell.n}`, `kind: ${JSON.stringify(cell.kind)}`];
  if (cell.kind === "coins") parts.push(`sign: ${JSON.stringify(cell.sign)}`);
  if (cell.kind === "question") parts.push(`category: ${JSON.stringify(cell.category)}`);
  if (cell.kind === "question" || cell.kind === "star") {
    parts.push(`illustration: ${JSON.stringify(cell.illustration)}`);
  }
  return `    { ${parts.join(", ")} },`;
}

/** Il contenuto del file di una disposizione congelata. */
export function frozenSource(
  layout: BoardLayout,
  seed: number,
  identifier = boardIdentifier(layout.id),
): string {
  const cells = layout.cells.map(cellLiteral).join("\n");
  const ladders = layout.ladders.map(({ from, to }) => `    { from: ${from}, to: ${to} },`).join("\n");
  const snakes = layout.snakes.map(({ from, to }) => `    { from: ${from}, to: ${to} },`).join("\n");
  const decorations = layout.decorations
    .map(
      ({ shape, cells: covered }) =>
        `    { shape: ${JSON.stringify(shape)}, cells: [${covered.join(", ")}] },`,
    )
    .join("\n");

  return `/**
 * Disposizione «${layout.name}»: congelata dal seme ${seed} con \`pnpm board:freeze ${seed} "${layout.name}"\`.
 *
 * **File generato: non modificare a mano.** Quello che segue è il contenuto della disposizione,
 * scritto come dato: non si rigenera dal seme, quindi non si muove se un giorno cambia il
 * generatore (è tutto il punto del congelamento). Per una variante si congela un seme nuovo.
 *
 * Non entra in partita da sola: la \`classic\` resta la disposizione offerta finché il proprietario
 * non sceglie quali disposizioni entrano (F7-03).
 */
import type { BoardLayout } from "@/engine/types";

export const ${identifier}: BoardLayout = {
  id: ${JSON.stringify(layout.id)},
  name: ${JSON.stringify(layout.name)},
  cells: [
${cells}
  ],
  ladders: [
${ladders}
  ],
  snakes: [
${snakes}
  ],
  decorations: [
${decorations}
  ],
};
`;
}

/** Il contenuto del file che raccoglie le disposizioni congelate. */
export function barrelSource(slugs: readonly string[]): string {
  const sorted = [...slugs].sort();
  const imports = sorted.map((slug) => `import { ${boardIdentifier(slug)} } from "./${slug}";`).join("\n");
  const list = sorted.map((slug) => boardIdentifier(slug));
  const empty = sorted.length === 0;
  // Prettier tiene l'elenco su una riga sola finché ci sta (printWidth 110): il file generato è già
  // formattato e `pnpm format` non lo riscrive. Oltre quella misura va a capo, che è come lo terrebbe.
  const prefix = "export const frozenBoards: BoardLayout[] = ";
  const inline = `[${list.join(", ")}]`;
  const body =
    list.length === 0 || `${prefix}${inline};`.length <= 110
      ? inline
      : `[\n${list.map((id) => `  ${id},`).join("\n")}\n]`;

  return `/**
 * Le disposizioni congelate da un seme: \`pnpm board:freeze <seme> <nome>\` (scripts/board-freeze.ts).
 *
 * **File generato: non modificare a mano**, lo riscrive lo script a ogni congelamento. Una
 * disposizione congelata è un file di dati accanto alla \`classic\`, non una chiamata al generatore:
 * non si muove se un giorno il generatore cambia.
 *
 * Queste disposizioni entrano in partita appena il file esiste: \`boards\` in \`index.ts\` le mette in
 * fila dopo la \`classic\`, quindi la lobby le offre senza toccare altro. Quale usa una serata lo
 * sceglie chi gioca, e l'id finisce su \`games.settings.boardId\` (D-77). Una congelata **non si
 * muove più**: se una serata la usa, quell'id resta il tabellone che è stato giocato (D-78).
 */
import type { BoardLayout } from "@/engine/types";
${imports === "" ? "" : `\n${imports}\n`}
/** Le disposizioni congelate finora${
    empty ? ': nessuna. `pnpm board:freeze 42 "Serata d\'estate"` ne scrive una.' : ", in ordine di nome."
  } */
export const frozenBoards: BoardLayout[] = ${body};
`;
}

/** Congela una disposizione: chiama il generatore **una volta** e restituisce i file da scrivere. */
export type FrozenBoard = {
  layout: BoardLayout;
  slug: string;
  identifier: string;
  fileName: string;
  source: string;
};

export function freezeBoard(options: {
  seed: number;
  name: string;
  illustrations?: IllustrationPool;
}): FrozenBoard {
  const name = options.name.trim();
  // Un nome che comincia con `-` è quasi sempre un flag scritto male: `pnpm board:freeze 5 --pippo`
  // congelava una disposizione chiamata «--pippo» (K4). Meglio rifiutare che scrivere un file strano.
  if (name.startsWith("-")) {
    throw new Error(
      `Il nome non può cominciare con «-»: «${name}» sembra un flag scritto male. Scegli un nome, per esempio «Serata d'estate».`,
    );
  }
  if (name === "") throw new Error("Il nome è vuoto.");

  const slug = boardSlug(name);
  if (isReservedSlug(slug)) {
    throw new Error(`«${name}» diventa \`${slug}\`, che è un file già esistente: scegli un altro nome.`);
  }

  const layout = generateBoard({
    seed: options.seed,
    id: slug,
    name,
    illustrations: options.illustrations ?? illustrationsByCategory(),
  });
  assertValidBoard(layout);

  return {
    layout,
    slug,
    identifier: boardIdentifier(slug),
    fileName: frozenFileName(slug),
    source: frozenSource(layout, options.seed),
  };
}

/** Gli slug delle disposizioni congelate che stanno nella cartella (senza `classic`, `index`, barrel e test). */
export function frozenSlugsInDirectory(directory = BOARDS_DIRECTORY): string[] {
  return readdirSync(directory)
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => file.replace(/\.ts$/, ""))
    .filter((slug) => !isReservedSlug(slug));
}

/** Il barrel come dovrebbe essere, letto dalla cartella: serve allo script e al test. */
export function barrelFromDirectory(directory = BOARDS_DIRECTORY): string {
  return barrelSource(frozenSlugsInDirectory(directory));
}

/** Il barrel come è scritto adesso. */
export function currentBarrel(directory = BOARDS_DIRECTORY): string {
  return readFileSync(resolve(directory, FROZEN_BARREL_FILE), "utf8");
}
