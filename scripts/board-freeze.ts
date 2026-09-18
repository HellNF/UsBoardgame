/**
 * Congela una disposizione generata da un seme (F7-03, pacchetto I).
 *
 * Uso: `pnpm board:freeze <seme> <nome>` — il nome può avere spazi (`pnpm board:freeze 12 "Serata d'estate"`).
 * Senza `--` prima degli argomenti: con pnpm 11 il separatore arriva allo script e lo fa fallire
 * (docs/local-testing.md).
 *
 * Scrive **due** file, entrambi generati:
 *
 * 1. `src/content/boards/<slug>.ts` — la disposizione come **dato** (caselle, scale, serpenti,
 *    decorazioni). Da qui in poi non si rigenera: se cambia il generatore, questa non si muove.
 * 2. `src/content/boards/frozen.ts` — l'elenco delle disposizioni congelate, riscritto per intero
 *    dalla cartella (così non si dimentica nessuno).
 *
 * Non tocca né il database né la lobby: la disposizione di una serata resta la `classic` finché il
 * proprietario non sceglie quali entrano in gioco (F7-03). Dopo il congelamento: `pnpm check` (i test
 * validano ogni disposizione) e, quando servirà, `pnpm content:seed`.
 */
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  BOARDS_DIRECTORY,
  FROZEN_BARREL_FILE,
  barrelFromDirectory,
  freezeBoard,
  isReservedSlug,
} from "./lib/board-freeze";

const USAGE = 'Uso: pnpm board:freeze <seme> <nome> — esempio: pnpm board:freeze 12 "Serata d\'estate"';

function fail(message: string): never {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
}

const [seedArgument, ...nameArguments] = process.argv.slice(2);
if (seedArgument === undefined || nameArguments.length === 0) fail("Servono un seme e un nome.");

const seed = Number(seedArgument);
if (!Number.isInteger(seed) || seed < 1) {
  fail(`Il seme dev'essere un intero positivo, non «${seedArgument}».`);
}

const name = nameArguments.join(" ").trim();
if (name === "") fail("Il nome è vuoto.");

let frozen;
try {
  frozen = freezeBoard({ seed, name });
} catch (error) {
  // Il generatore dice perché non riesce (budget di leggibilità) e `assertValidBoard` quali vincoli
  // non tornano: il messaggio è già quello giusto, qui si aggiunge solo che non si è scritto niente.
  fail(`Non ho congelato niente: ${(error as Error).message}`);
}

if (isReservedSlug(frozen.slug)) fail(`«${name}» diventerebbe \`${frozen.slug}\`, che è un file già esistente.`);

const target = resolve(BOARDS_DIRECTORY, frozen.fileName);
if (existsSync(target)) {
  fail(
    `\`${frozen.fileName}\` esiste già: una disposizione congelata non si sovrascrive (è il punto del congelamento). ` +
      `Scegli un altro nome, o cancella il file a mano se è un errore.`,
  );
}

writeFileSync(target, frozen.source);
writeFileSync(resolve(BOARDS_DIRECTORY, FROZEN_BARREL_FILE), barrelFromDirectory());

const { ladders, snakes, decorations } = frozen.layout;
console.log(`Congelata «${name}» dal seme ${seed}:`);
console.log(`  ${resolve(BOARDS_DIRECTORY, frozen.fileName)}`);
console.log(
  `  ${ladders.length} scale, ${snakes.length} serpenti, ${decorations.length} decorazioni · esporta \`${frozen.identifier}\``,
);
console.log(`  ${resolve(BOARDS_DIRECTORY, FROZEN_BARREL_FILE)} riscritto (${frozen.slug} aggiunta)`);
console.log("\nPoi: `pnpm check`, e guardala in /dev/disposizioni (sezione «Disposizioni congelate»).");
console.log(
  "Non entra in partita da sola: la lobby offre la `classic` finché non scegli tu quali disposizioni entrano (F7-03).",
);
