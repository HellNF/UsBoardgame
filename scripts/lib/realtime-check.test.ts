import { describe, expect, it, vi } from "vitest";

import { deferred, diagnose, waitFor, withTimeout, type RealtimeRun } from "./realtime-check";

/** Una prova riuscita: serve come base, poi ogni test ne rompe un pezzo solo. */
const okRun = (): RealtimeRun => ({
  topic: "room:00000000-0000-0000-0000-000000000000",
  action: "applied",
  actionDetail: "ROLL del posto 1, versione 1",
  movesMs: 240,
  moveTimeoutMs: 15_000,
  presenceSeen: true,
  closed: true,
  closedDetail: "rifiutata (CHANNEL_ERROR)",
  publicSeatsSeen: 0,
  cleanedUp: true,
});

const find = (run: RealtimeRun, label: string) => {
  const line = diagnose(run).find((entry) => entry.label.startsWith(label));
  if (!line) throw new Error(`riga mancante: ${label}`);
  return line;
};

describe("diagnose: cosa dice la prova a due sessioni", () => {
  it("quando tutto va bene sono tutte righe ok, e dice i tempi", () => {
    const lines = diagnose(okRun());
    expect(lines.every((line) => line.status === "ok")).toBe(true);
    expect(find(okRun(), "le mosse arrivano").detail).toBe("ricevute in 240 ms dal posto che non ha giocato");
  });

  it("mosse ferme: la colpa non è della presenza, ed è scritto", () => {
    const run = { ...okRun(), movesMs: null };
    const moves = find(run, "le mosse arrivano");
    expect(moves.status).toBe("fail");
    expect(moves.detail).toBe("niente entro 15 s");
    expect(moves.fix).toContain("troppo stretta");
    expect(moves.fix).toContain("non è la presenza");
    // La presenza resta la sua riga: la diagnosi non le confonde.
    expect(find(run, "presenza").status).toBe("ok");
  });

  it("mosse arrivate e presenza spenta: la colpa è della presenza, ed è scritto", () => {
    const run = { ...okRun(), presenceSeen: false };
    expect(find(run, "le mosse arrivano").status).toBe("ok");
    const presence = find(run, "presenza");
    expect(presence.status).toBe("fail");
    expect(presence.fix).toContain("'presence'");
  });

  it("la terza sessione entra: il canale non è chiuso", () => {
    const run = { ...okRun(), closed: false, closedDetail: "iscritta al canale" };
    const closed = find(run, "canale chiuso");
    expect(closed.status).toBe("fail");
    expect(closed.fix).toContain("private: true");
  });

  it("canale pubblico con lo stesso topic: la presenza è visibile lo stesso", () => {
    const run = { ...okRun(), publicSeatsSeen: 2 };
    const leak = find(run, "canale pubblico");
    expect(leak.status).toBe("fail");
    expect(leak.detail).toContain("2 posti");
    expect(leak.fix).toContain("Allow public access");
  });

  it("con le mosse ferme anche la riga della presenza manda prima alla policy di lettura", () => {
    const run = { ...okRun(), movesMs: null, presenceSeen: false };
    const presence = find(run, "presenza");
    expect(presence.fix).toContain("stesso canale delle mosse");
    expect(presence.fix).not.toContain("channel.track");
  });

  it("se l'azione non passa, le altre righe non si inventano un esito", () => {
    const run: RealtimeRun = { ...okRun(), action: "refused", actionDetail: "422: non si può tirare adesso" };
    const lines = diagnose(run);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.status).toBe("fail");
    expect(lines[0]?.detail).toContain("422");
  });

  it("se la pulizia non è riuscita la prova fallisce", () => {
    // Una stanza di prova rimasta nel database non è un dettaglio: su un progetto ospitato
    // sporca lo stesso database delle serate vere e nessuno se ne accorgerebbe.
    const cleanup = find({ ...okRun(), cleanedUp: false }, "pulizia");
    expect(cleanup.status).toBe("fail");
    expect(cleanup.fix).toContain("cancella a mano");
  });
});

describe("withTimeout", () => {
  it("lascia passare il valore se arriva in tempo", async () => {
    await expect(withTimeout(Promise.resolve("tardi no"), 200, "scaduto")).resolves.toBe("tardi no");
  });

  it("scade con il messaggio che gli si dà", async () => {
    const never = new Promise<string>(() => {});
    await expect(withTimeout(never, 20, "niente entro 20 ms")).rejects.toThrow("niente entro 20 ms");
  });

  it("propaga l'errore vero, non quello del tempo massimo", async () => {
    const failed = Promise.reject(new Error("il canale ha risposto CHANNEL_ERROR"));
    await expect(withTimeout(failed, 200, "scaduto")).rejects.toThrow("CHANNEL_ERROR");
  });

  it("non lascia timer appesi quando la promessa arriva", async () => {
    vi.useFakeTimers();
    const pending = withTimeout(Promise.resolve(1), 5_000, "scaduto");
    await vi.advanceTimersByTimeAsync(0);
    await expect(pending).resolves.toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});

describe("deferred", () => {
  it("si risolve quando lo decide chi aspetta l'evento", async () => {
    const gate = deferred<string>();
    expect(gate.settled()).toBe(false);
    gate.resolve("arrivato");
    await expect(gate.promise).resolves.toBe("arrivato");
    expect(gate.settled()).toBe(true);
  });
});

describe("waitFor", () => {
  it("torna appena la condizione è vera, senza aspettare il tempo massimo", async () => {
    let ready = false;
    setTimeout(() => {
      ready = true;
    }, 10);
    await expect(waitFor(() => ready, 2_000, 5)).resolves.toBe(true);
  });

  it("torna falso quando il tempo massimo passa, e non resta appeso", async () => {
    const started = Date.now();
    await expect(waitFor(() => false, 50, 10)).resolves.toBe(false);
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it("vera al primo controllo non aspetta niente", async () => {
    await expect(waitFor(() => true, 1_000)).resolves.toBe(true);
  });
});
