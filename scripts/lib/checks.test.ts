import { describe, expect, it } from "vitest";

import { countByStatus, exitCodeFor, renderLines, summarize, worstStatus, type CheckLine } from "./checks";

const line = (status: CheckLine["status"], label = "prova"): CheckLine => ({ label, status });

describe("le righe di esito", () => {
  it("l'uscita è 1 solo se c'è un KO: un avviso non fa fallire il comando", () => {
    expect(exitCodeFor([line("ok"), line("warn"), line("manual")])).toBe(0);
    expect(exitCodeFor([line("ok"), line("fail")])).toBe(1);
    expect(exitCodeFor([])).toBe(0);
  });

  it("la specie peggiore è quella che conta", () => {
    expect(worstStatus([line("ok")])).toBe("ok");
    expect(worstStatus([line("manual"), line("ok")])).toBe("manual");
    expect(worstStatus([line("warn"), line("manual")])).toBe("warn");
    expect(worstStatus([line("fail"), line("warn")])).toBe("fail");
  });

  it("stampa l'etichetta, il dettaglio e il rimedio sotto la riga", () => {
    const rendered = renderLines([
      { label: "accesso anonimo", status: "ok", detail: "attivo" },
      { label: "migrazioni", status: "fail", detail: "manca la terza", fix: "lancia `pnpm db:reset`" },
    ]);
    const rows = rendered.split("\n");
    expect(rows[0]).toBe("[ok] accesso anonimo  attivo");
    expect(rows[1]).toBe("[KO] migrazioni       manca la terza");
    expect(rows[2]).toBe("      → lancia `pnpm db:reset`");
  });

  it("le etichette restano incolonnate anche se una è più lunga", () => {
    const rendered = renderLines([
      { label: "breve", status: "ok", detail: "uno" },
      { label: "molto più lunga di così", status: "ok", detail: "due" },
    ]);
    const [first, second] = rendered.split("\n");
    // Il dettaglio comincia nella stessa colonna su tutte le righe.
    expect(first?.indexOf("uno")).toBe(second?.indexOf("due"));
    expect(first).toContain("[ok] breve");
    expect(second).toContain("[ok] molto più lunga di così");
    // Senza dettaglio non restano spazi in coda.
    expect(renderLines([{ label: "breve", status: "ok" }])).toBe("[ok] breve");
  });
});

describe("il riepilogo", () => {
  it("conta le righe e tace le specie che non ci sono", () => {
    expect(summarize([line("ok"), line("ok"), line("fail")])).toBe("2 ok · 1 KO");
    expect(summarize([line("ok"), line("warn"), line("manual")])).toBe(
      "1 ok · 1 da sapere · 1 da controllare a mano",
    );
    expect(summarize([])).toBe("0 ok");
  });

  it("conta e riporta ogni specie", () => {
    const lines: CheckLine[] = [line("ok"), line("fail"), line("fail"), line("manual")];
    expect(countByStatus(lines, "fail")).toBe(2);
    expect(summarize(lines)).toBe("1 ok · 2 KO · 1 da controllare a mano");
  });
});
