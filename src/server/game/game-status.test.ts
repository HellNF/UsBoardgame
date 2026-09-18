import { describe, expect, it } from "vitest";

import {
  OPEN_GAME_STATUSES,
  isConcludedGame,
  isOpenGame,
  phaseOf,
  statusAfterAction,
  statusOnNewGame,
  type GameStatus,
} from "./game-status";

describe("games: lo stato della serata dopo un'azione del motore (F1)", () => {
  it("un'azione che porta il motore a `finished` conclude la serata", () => {
    // È la regola che `apply_game_action` esegue in una sola transazione (D-52).
    expect(statusAfterAction("playing", "finished")).toBe("finished");
  });

  it("in ogni altra fase lo stato della riga non si tocca", () => {
    expect(statusAfterAction("playing", "pre_roll")).toBe("playing");
    expect(statusAfterAction("playing", "resolving")).toBe("playing");
    expect(statusAfterAction("lobby", "pre_roll")).toBe("lobby");
    expect(statusAfterAction("sheets", "resolving")).toBe("sheets");
  });
});

describe("games: «Nuova partita» abbandona solo una serata non conclusa (F1)", () => {
  it("una partita in corso diventa `abandoned`", () => {
    expect(statusOnNewGame("playing", "resolving")).toBe("abandoned");
    expect(statusOnNewGame("lobby", null)).toBe("abandoned");
    expect(statusOnNewGame("sheets", "pre_roll")).toBe("abandoned");
  });

  it("una partita conclusa resta `finished`: è nell'archivio del diario", () => {
    expect(statusOnNewGame("finished", "finished")).toBe("finished");
    expect(statusOnNewGame("finished", null)).toBe("finished");
    // Riga scritta prima della migrazione: la partita è finita ma `status` era rimasto `playing`.
    // Si archivia, non si abbandona: se restasse aperta non si potrebbe nemmeno cominciare
    // una serata nuova (una sola partita aperta per stanza).
    expect(statusOnNewGame("playing", "finished")).toBe("finished");
  });

  it("una serata già abbandonata non cambia stato", () => {
    expect(statusOnNewGame("abandoned", null)).toBe("abandoned");
  });

  it("`isConcludedGame` guarda lo stato della riga e la fase dello stato di gioco", () => {
    expect(isConcludedGame("finished", null)).toBe(true);
    expect(isConcludedGame("playing", "finished")).toBe(true);
    expect(isConcludedGame("playing", "resolving")).toBe(false);
    expect(isConcludedGame("lobby", null)).toBe(false);
  });
});

describe("games: stati aperti e lettura della fase", () => {
  it("una sola serata aperta per stanza: lobby, sheets, playing", () => {
    expect(OPEN_GAME_STATUSES).toEqual(["lobby", "sheets", "playing"]);
    expect(isOpenGame("playing")).toBe(true);
    expect(isOpenGame("finished")).toBe(false);
    expect(isOpenGame("abandoned")).toBe(false);
  });

  it("la fase si legge solo da uno stato di gioco leggibile", () => {
    expect(phaseOf({ phase: "resolving" })).toBe("resolving");
    expect(phaseOf({ phase: "finished" })).toBe("finished");
    expect(phaseOf({ phase: "altro" })).toBe(null);
    expect(phaseOf(null)).toBe(null);
    expect(phaseOf("phase")).toBe(null);
    expect(phaseOf(undefined)).toBe(null);
  });
});

describe("games: gli stati del database sono quelli che il codice conosce", () => {
  // Il vincolo `check (status in …)` della migrazione iniziale: se ne aggiungesse uno, il
  // codice lo tratterebbe come sconosciuto senza accorgersene.
  const COLUMN_STATUSES: GameStatus[] = ["lobby", "sheets", "playing", "finished", "abandoned"];

  it("ogni stato della colonna ha una risposta in `isOpenGame`", () => {
    const open = COLUMN_STATUSES.filter(isOpenGame);
    expect(open).toEqual([...OPEN_GAME_STATUSES]);
    expect(COLUMN_STATUSES.filter((status) => !isOpenGame(status))).toEqual(["finished", "abandoned"]);
  });
});
