import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createElement } from "react";

import type { PawnId } from "@/engine";
import { CHARACTERS, characterIds, MOODS_BY_NUMBER } from "./index";
import type { CharacterMood, CharacterProps } from "./types";

/**
 * I sei personaggi si disegnano davvero, e ogni umore cambia davvero qualcosa.
 *
 * La seconda parte non è una formalità: la civetta non ha bocca, e nella prima versione la sua
 * faccia felice usciva **identica** a quella neutra — l'unico segno era la pupilla, che per
 * «felice» non cambia. Un umore che non cambia niente è un umore che non c'è, e da qui in poi
 * lo dice una prova invece dei miei occhi.
 */
const draw = (id: PawnId, props: CharacterProps = {}) =>
  renderToStaticMarkup(createElement(CHARACTERS[id].Draw, props));

const ALL_IDS: PawnId[] = ["fox", "rabbit", "cat", "bear", "frog", "owl"];

describe("registro dei personaggi", () => {
  it("c'è un personaggio per ogni pedina, e l'elenco ordinato li copre tutti", () => {
    expect(Object.keys(CHARACTERS).sort()).toEqual([...ALL_IDS].sort());
    expect([...characterIds].sort()).toEqual([...ALL_IDS].sort());
  });

  it("i nomi in italiano sono tutti diversi e nessuno è vuoto", () => {
    const names = characterIds.map((id) => CHARACTERS[id].name);
    expect(names.every((name) => name.length > 0)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  // Il contratto di `mascots.riv`: l'ingresso `mood` è un numero, e questo è l'ordine
  // (docs/design.md § Animazioni Rive). Cambiarlo qui cambia il significato di un file `.riv`
  // già disegnato, quindi la prova sta a guardia dell'ordine, non solo del numero.
  it("gli umori sono cinque, nell'ordine del contratto Rive", () => {
    expect(MOODS_BY_NUMBER).toEqual(["neutro", "felice", "sorpreso", "triste", "esultante"]);
  });
});

describe("disegno", () => {
  it.each(characterIds)("`%s` si disegna: una sagoma e una faccia", (id) => {
    const markup = draw(id);
    expect(markup).toContain('data-parte="sagoma"');
    expect(markup).toContain('data-parte="faccia"');
    expect(markup).toContain("<svg");
  });

  it.each(characterIds)("`%s` porta l'alone di carta, cioè il disegno due volte", (id) => {
    const markup = draw(id);
    expect(markup).toContain("stroke-paper");
    // La sagoma compare due volte: una nell'alone, una nel disegno.
    expect(markup.split('data-parte="sagoma"').length - 1).toBe(2);
  });

  it.each(characterIds)("`%s` con la pedana scrive il numero del posto una volta sola", (id) => {
    const markup = draw(id, { base: "red", seat: 2 });
    expect(markup).toContain("--color-player-red");
    // La pedana sta **fuori** dall'alone: se ci finisse dentro, il numero sarebbe scritto due
    // volte e il tratto chiaro dell'alone morderebbe il colore del giocatore.
    expect(markup.split('data-parte="pedana"').length - 1).toBe(1);
  });

  it.each(characterIds)("`%s` ha cinque facce diverse, una per umore", (id) => {
    const drawings = new Map<CharacterMood, string>(
      MOODS_BY_NUMBER.map((mood) => [mood, draw(id, { mood })]),
    );
    expect(new Set(drawings.values()).size).toBe(MOODS_BY_NUMBER.length);
  });

  // D-82 corretta: le reference (`docs/reference/mascots/`) sono solo inchiostro e carta, e i
  // personaggi seguono quelle. Il colore nel gioco vuol dire «di chi è la pedina», quindi in un
  // personaggio non ci può essere: se ce ne fosse, un animale sarebbe rosso o blu per sempre.
  it.each(characterIds)("`%s` non usa nessuna tinta delle illustrazioni", (id) => {
    expect(draw(id, { mood: "felice" })).not.toContain("--color-art-");
  });

  it.each(characterIds)("`%s` porta il colore del giocatore solo nella pedana", (id) => {
    expect(draw(id)).not.toContain("--color-player-");
    expect(draw(id, { base: "blue" })).toContain("--color-player-blue");
  });
});
