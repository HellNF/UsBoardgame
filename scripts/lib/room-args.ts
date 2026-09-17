import type { PawnId, PlayerColor } from "@/engine/types";

/**
 * Argomenti di `pnpm room:create` (task F0-03): funzioni pure, così si possono provare
 * senza database e senza terminale. La password **non** è un argomento: si chiede a
 * terminale, altrimenti finirebbe nella cronologia della shell.
 */

export const USAGE = `Uso: pnpm room:create -- --code <CODICE> --name1 <nome> --name2 <nome>
                      [--pawn1 fox|rabbit|cat|bear|frog|owl] [--pawn2 …]
                      [--color1 red|blue|green|ochre] [--color2 …]

  --code    codice della stanza, 4-12 caratteri fra A-Z e 0-9; si scrive in maiuscolo (es. COPPIA42)
  --name1   nome del posto 1        --name2   nome del posto 2
  --pawn1   pedina del posto 1      --pawn2   pedina del posto 2
  --color1  colore del posto 1      --color2  colore del posto 2

  La password viene chiesta a terminale (due volte), mai negli argomenti.
  Le variabili di Supabase si leggono da .env.local (vedi .env.example).`;

const PAWNS: readonly PawnId[] = ["fox", "rabbit", "cat", "bear", "frog", "owl"];
const COLORS: readonly PlayerColor[] = ["red", "blue", "green", "ochre"];

const CODE_PATTERN = /^[A-Z0-9]{4,12}$/;

export type RoomCreateInput = {
  code: string;
  name1: string;
  name2: string;
  pawn1: PawnId;
  pawn2: PawnId;
  color1: PlayerColor;
  color2: PlayerColor;
};

export type RoomCreateArgResult =
  { ok: true; help: true } | { ok: true; help: false; value: RoomCreateInput } | { ok: false; error: string };

/** Riga da inserire in `rooms` (senza l'id: lo genera il database). */
export type RoomRecord = { code: string; password_hash: string };

/** Riga da inserire in `players`. */
export type PlayerRecord = {
  seat: 1 | 2;
  display_name: string;
  pawn: PawnId;
  color: PlayerColor;
};

/** Legge gli argomenti di `room:create`. Non tocca né il terminale né il database. */
export function parseRoomArgs(argv: readonly string[]): RoomCreateArgResult {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--help" || token === "-h") return { ok: true, help: true };
    if (!token.startsWith("--")) return { ok: false, error: `Argomento inatteso: ${token}` };
    const [name, inline] = token.split("=");
    const value = inline ?? argv[++index];
    if (value === undefined) return { ok: false, error: `Manca il valore di ${name}.` };
    flags.set(name.replace(/^--/, ""), value);
  }

  const known = ["code", "name1", "name2", "pawn1", "pawn2", "color1", "color2"];
  const unknown = [...flags.keys()].filter((flag) => !known.includes(flag));
  if (unknown.length > 0) {
    return { ok: false, error: `Argomento sconosciuto: --${unknown.join(", --")}` };
  }

  const missing = ["code", "name1", "name2"].filter((flag) => !flags.get(flag));
  if (missing.length > 0) {
    return { ok: false, error: `Mancano: ${missing.map((flag) => `--${flag}`).join(", ")}.` };
  }

  const code = (flags.get("code") ?? "").toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    return { ok: false, error: "Il codice deve avere 4-12 caratteri fra A-Z e 0-9 (es. COPPIA42)." };
  }

  const pawn1 = (flags.get("pawn1") ?? "fox") as PawnId;
  const pawn2 = (flags.get("pawn2") ?? "rabbit") as PawnId;
  for (const pawn of [pawn1, pawn2]) {
    if (!PAWNS.includes(pawn)) {
      return { ok: false, error: `Pedina sconosciuta: ${pawn}. Ammesse: ${PAWNS.join(", ")}.` };
    }
  }

  const color1 = (flags.get("color1") ?? "red") as PlayerColor;
  const color2 = (flags.get("color2") ?? "blue") as PlayerColor;
  for (const color of [color1, color2]) {
    if (!COLORS.includes(color)) {
      return { ok: false, error: `Colore sconosciuto: ${color}. Ammessi: ${COLORS.join(", ")}.` };
    }
  }

  if (pawn1 === pawn2) {
    return { ok: false, error: "Le due pedine devono essere diverse." };
  }
  if (color1 === color2) {
    return { ok: false, error: "I due colori devono essere diversi." };
  }

  return {
    ok: true,
    help: false,
    value: {
      code,
      name1: flags.get("name1") ?? "",
      name2: flags.get("name2") ?? "",
      pawn1,
      pawn2,
      color1,
      color2,
    },
  };
}

/** Righe da scrivere: stanza e i due posti. L'hash arriva da `hashPassword` (F0-02). */
export function buildRoomRecords(
  input: RoomCreateInput,
  passwordHash: string,
): { room: RoomRecord; players: PlayerRecord[] } {
  return {
    room: { code: input.code, password_hash: passwordHash },
    players: [
      { seat: 1, display_name: input.name1, pawn: input.pawn1, color: input.color1 },
      { seat: 2, display_name: input.name2, pawn: input.pawn2, color: input.color2 },
    ],
  };
}
