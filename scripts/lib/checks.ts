/**
 * Righe di esito per i controlli da terminale (`pnpm check:realtime`, `pnpm doctor` — K1, K3).
 *
 * Un controllo che vive di un database vivo non può essere un test Vitest, ma il **modo in cui si
 * racconta** sì: qui stanno il tipo di riga, come si stampa e da cosa nasce l'uscita del comando.
 * Così i due script dicono le stesse cose nello stesso modo, e le loro parti pure si provano.
 *
 * Le quattro specie di riga sono quelle che servono davvero:
 *  - `ok`     tutto a posto;
 *  - `fail`   qualcosa non va, e c'è un rimedio da suggerire;
 *  - `warn`   funziona, ma c'è qualcosa da sapere (una mezza misura, un'impostazione da guardare);
 *  - `manual` quello che **non si può sapere da qui** (un interruttore nel dashboard): si elenca, non
 *             si finge di averlo controllato.
 */

export type CheckStatus = "ok" | "fail" | "warn" | "manual";

export type CheckLine = {
  /** Cosa si è controllato, in una riga (minuscolo, senza punto finale). */
  label: string;
  status: CheckStatus;
  /** Cosa si è visto: valori, id, tempi. Vuoto per `manual`. */
  detail?: string;
  /** Cosa fare se è rosso. Si stampa solo quando c'è. */
  fix?: string;
};

/** I simboli: due caratteri larghi, così le colonne restano allineate. */
export const STATUS_MARKS: Record<CheckStatus, string> = {
  ok: "ok",
  fail: "KO",
  warn: "!!",
  manual: "--",
};

/** Quante righe per specie. */
export function countByStatus(lines: readonly CheckLine[], status: CheckStatus): number {
  return lines.filter((line) => line.status === status).length;
}

/** La specie peggiore fra quelle presenti: serve per l'uscita del comando. */
export function worstStatus(lines: readonly CheckLine[]): CheckStatus {
  if (countByStatus(lines, "fail") > 0) return "fail";
  if (countByStatus(lines, "warn") > 0) return "warn";
  if (countByStatus(lines, "manual") > 0) return "manual";
  return "ok";
}

/** `0` se non c'è niente di rosso, `1` se c'è almeno un `fail`. */
export function exitCodeFor(lines: readonly CheckLine[]): number {
  return countByStatus(lines, "fail") > 0 ? 1 : 0;
}

/** Il resoconto da stampare: una riga per controllo, il rimedio indentato sotto quella rossa. */
export function renderLines(lines: readonly CheckLine[]): string {
  const width = Math.max(0, ...lines.map((line) => line.label.length));
  const rendered = lines.map((line) => {
    const head = `[${STATUS_MARKS[line.status]}] ${line.label.padEnd(width)}  ${line.detail ?? ""}`.trimEnd();
    return line.fix ? `${head}\n      → ${line.fix}` : head;
  });
  return rendered.join("\n");
}

/** Riga di riepilogo: `3 ok · 1 KO · 2 da controllare a mano`. */
export function summarize(lines: readonly CheckLine[]): string {
  const parts = [
    `${countByStatus(lines, "ok")} ok`,
    ...(countByStatus(lines, "fail") > 0 ? [`${countByStatus(lines, "fail")} KO`] : []),
    ...(countByStatus(lines, "warn") > 0 ? [`${countByStatus(lines, "warn")} da sapere`] : []),
    ...(countByStatus(lines, "manual") > 0
      ? [`${countByStatus(lines, "manual")} da controllare a mano`]
      : []),
  ];
  return parts.join(" · ");
}
