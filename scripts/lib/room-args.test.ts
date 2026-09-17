import { describe, expect, it } from "vitest";

import { buildRoomRecords, parseRoomArgs } from "./room-args";

const BASE = ["--code", "coppia42", "--name1", "Nicolò", "--name2", "Marta"];

describe("argomenti di room:create (F0-03)", () => {
  it("legge codice e nomi e mette il codice in maiuscolo", () => {
    const result = parseRoomArgs(BASE);
    expect(result.ok).toBe(true);
    if (!result.ok || result.help) throw new Error("atteso un risultato valido");
    expect(result.value.code).toBe("COPPIA42");
    expect(result.value.name1).toBe("Nicolò");
    expect(result.value.name2).toBe("Marta");
  });

  it("usa pedine e colori di default, diversi fra i due posti", () => {
    const result = parseRoomArgs(BASE);
    if (!result.ok || result.help) throw new Error("atteso un risultato valido");
    expect(result.value.pawn1).not.toBe(result.value.pawn2);
    expect(result.value.color1).not.toBe(result.value.color2);
  });

  it("accetta --chiave=valore e le pedine scelte", () => {
    const result = parseRoomArgs([...BASE, "--pawn1=owl", "--pawn2=cat", "--color1=green", "--color2=ochre"]);
    if (!result.ok || result.help) throw new Error("atteso un risultato valido");
    expect(result.value).toMatchObject({ pawn1: "owl", pawn2: "cat", color1: "green", color2: "ochre" });
  });

  it("mostra l'aiuto con --help, senza pretendere argomenti", () => {
    expect(parseRoomArgs(["--help"])).toEqual({ ok: true, help: true });
  });

  it("rifiuta un codice fuori formato", () => {
    for (const code of ["abc", "troppo-lungo-per-la-stanza", "con spazi", "coppia!"]) {
      const result = parseRoomArgs(["--code", code, "--name1", "A", "--name2", "B"]);
      expect(result.ok).toBe(false);
    }
  });

  it("pretende codice e nomi", () => {
    expect(parseRoomArgs([])).toEqual({ ok: false, error: "Mancano: --code, --name1, --name2." });
    expect(parseRoomArgs(["--code", "COPPIA42"])).toEqual({ ok: false, error: "Mancano: --name1, --name2." });
  });

  it("rifiuta argomenti sconosciuti e valori mancanti", () => {
    expect(parseRoomArgs([...BASE, "--colore", "rosso"])).toEqual({
      ok: false,
      error: "Argomento sconosciuto: --colore",
    });
    expect(parseRoomArgs(["--code"])).toEqual({ ok: false, error: "Manca il valore di --code." });
    expect(parseRoomArgs(["COPPIA42"])).toEqual({ ok: false, error: "Argomento inatteso: COPPIA42" });
  });

  it("rifiuta pedine o colori uguali (i due posti devono distinguersi)", () => {
    expect(parseRoomArgs([...BASE, "--pawn1", "fox", "--pawn2", "fox"]).ok).toBe(false);
    expect(parseRoomArgs([...BASE, "--color1", "red", "--color2", "red"]).ok).toBe(false);
    expect(parseRoomArgs([...BASE, "--pawn1", "delfino"]).ok).toBe(false);
    expect(parseRoomArgs([...BASE, "--color1", "viola"]).ok).toBe(false);
  });

  it("costruisce le righe da scrivere: una stanza e due posti", () => {
    const result = parseRoomArgs(BASE);
    if (!result.ok || result.help) throw new Error("atteso un risultato valido");
    const records = buildRoomRecords(result.value, "scrypt$16384$8$1$sale$hash");
    expect(records.room).toEqual({ code: "COPPIA42", password_hash: "scrypt$16384$8$1$sale$hash" });
    expect(records.players).toHaveLength(2);
    expect(records.players.map((player) => player.seat)).toEqual([1, 2]);
    expect(records.players[0]).toMatchObject({ display_name: "Nicolò", pawn: "fox", color: "red" });
  });
});
