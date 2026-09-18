import { describe, expect, it } from "vitest";

import { illustrationsByCategory } from "@/art/illustrations";
import { generateBoard, validateBoard } from "@/engine";
import {
  barrelFromDirectory,
  barrelSource,
  boardIdentifier,
  boardSlug,
  currentBarrel,
  freezeBoard,
  frozenFileName,
  frozenSlugsInDirectory,
  isReservedSlug,
} from "./board-freeze";

/**
 * Congelare una disposizione (F7-03, pacchetto I).
 *
 * Il congelamento è un file di **dati**: la prova che conta è che il file scritto non dipenda dal
 * generatore (niente chiamate, solo numeri) e che due congelamenti dello stesso seme diano lo stesso
 * testo. I nomi e i semi li sceglie il proprietario: qui non se ne congela nessuno.
 */

const name = "Serata d'estate";
const frozen = () => freezeBoard({ seed: 12, name });

describe("boardSlug e boardIdentifier", () => {
  it("fa uno slug dal nome: minuscole, accenti tolti, spazi in trattini", () => {
    expect(boardSlug(name)).toBe("serata-d-estate");
    expect(boardSlug("Il tavolo di Niccolò")).toBe("il-tavolo-di-niccolo");
    expect(boardSlug("  Due   serpenti  ")).toBe("due-serpenti");
  });

  it("un nome senza lettere né cifre diventa `disposizione`", () => {
    expect(boardSlug("!!!")).toBe("disposizione");
  });

  it("il nome dell'esportazione è camelCase, e non comincia con una cifra", () => {
    expect(boardIdentifier("serata-d-estate")).toBe("serataDEstate");
    expect(boardIdentifier("42-serpenti")).toBe("disposizione42Serpenti");
    expect(boardIdentifier("disposizione")).toBe("disposizione");
  });

  it("i file che esistono già non si possono usare come nome", () => {
    for (const reserved of ["classic", "index", "frozen"]) expect(isReservedSlug(reserved)).toBe(true);
    expect(isReservedSlug("serata-d-estate")).toBe(false);
    expect(() => freezeBoard({ seed: 1, name: "Classic" })).toThrow(/file già esistente/);
  });

  it("il nome del file è lo slug con l'estensione", () => {
    expect(frozenFileName("serata-d-estate")).toBe("serata-d-estate.ts");
  });
});

describe("freezeBoard: la disposizione diventa dati", () => {
  it("il seme è lo stesso del generatore, ma il file non lo chiama", () => {
    const board = freezeBoard({ seed: 12, name });
    const generated = generateBoard({
      seed: 12,
      id: "serata-d-estate",
      name,
      illustrations: illustrationsByCategory(),
    });
    expect(board.layout).toEqual(generated);
  });

  it("la disposizione congelata è valida per lo schema", () => {
    expect(validateBoard(frozen().layout)).toEqual({ ok: true });
  });

  it("nel file ci sono i numeri, non una chiamata al generatore", () => {
    const { source, layout } = frozen();
    expect(source).not.toMatch(/generateBoard|illustrationsByCategory|Math\.|seed/);
    expect(source).toContain("export const serataDEstate: BoardLayout = {");
    // Le cento caselle, una per riga, e tutti gli estremi.
    expect(source.split("\n").filter((line) => /^\s+\{ n: \d+, kind: "/.test(line))).toHaveLength(100);
    for (const { from, to } of layout.ladders) expect(source).toContain(`{ from: ${from}, to: ${to} }`);
    for (const { from, to } of layout.snakes) expect(source).toContain(`{ from: ${from}, to: ${to} }`);
    for (const decoration of layout.decorations) {
      expect(source).toContain(`{ shape: "${decoration.shape}", cells: [${decoration.cells.join(", ")}] }`);
    }
  });

  it("congelare due volte lo stesso seme dà lo stesso testo: la disposizione non si muove", () => {
    expect(frozen().source).toBe(frozen().source);
  });

  it("il nome non entra nel caso: cambia l'etichetta, non le scale", () => {
    const a = freezeBoard({ seed: 12, name: "Prima" });
    const b = freezeBoard({ seed: 12, name: "Seconda" });
    expect(a.layout.cells).toEqual(b.layout.cells);
    expect(a.layout.ladders).toEqual(b.layout.ladders);
    expect(a.layout.snakes).toEqual(b.layout.snakes);
    expect(a.layout.name).toBe("Prima");
    expect(b.layout.name).toBe("Seconda");
  });
});

describe("il barrel delle disposizioni congelate", () => {
  it("senza disposizioni congelate l'elenco è vuoto e lo dice", () => {
    const barrel = barrelSource([]);
    expect(barrel).toContain("export const frozenBoards: BoardLayout[] = [];");
    expect(barrel).toContain("nessuna");
  });

  it("con disposizioni congelate importa ogni file, in ordine di nome", () => {
    const barrel = barrelSource(["serata-d-estate", "due-serpenti"]);
    expect(barrel).toContain('import { dueSerpenti } from "./due-serpenti";');
    expect(barrel).toContain('import { serataDEstate } from "./serata-d-estate";');
    expect(barrel).toContain("export const frozenBoards: BoardLayout[] = [dueSerpenti, serataDEstate];");
    expect(barrel).not.toContain("nessuna");
  });

  it("con una sola disposizione l'elenco sta su una riga (com'è formattato)", () => {
    expect(barrelSource(["serata-d-estate"])).toContain(
      "export const frozenBoards: BoardLayout[] = [serataDEstate];",
    );
  });

  it("con tante disposizioni l'elenco va a capo, e non resta su una riga lunghissima", () => {
    const slugs = Array.from({ length: 12 }, (_, index) => `disposizione-numero-${index}`);
    const barrel = barrelSource(slugs);
    expect(barrel).toContain("export const frozenBoards: BoardLayout[] = [\n  disposizioneNumero0,");
  });

  it("il barrel committato è quello che lo script scriverebbe: niente elenchi stantii", () => {
    expect(currentBarrel()).toBe(barrelFromDirectory());
  });

  it("la cartella non conta come disposizioni `classic`, `index`, il barrel e i test", () => {
    const slugs = frozenSlugsInDirectory();
    for (const reserved of ["classic", "index", "frozen"]) expect(slugs).not.toContain(reserved);
    expect(slugs.some((slug) => slug.endsWith(".test"))).toBe(false);
  });

  it("ogni file nella cartella finisce nel barrel: congelare non si dimentica", () => {
    const barrel = barrelFromDirectory();
    const exportLine = barrel.split("\n").find((line) => line.startsWith("export const frozenBoards")) ?? "";
    expect(exportLine).not.toBe("");
    for (const slug of frozenSlugsInDirectory()) {
      expect(barrel).toContain(`from "./${slug}";`);
      expect(exportLine).toContain(boardIdentifier(slug));
    }
  });
});
