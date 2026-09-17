import "server-only";

/**
 * Ritardo sui tentativi di accesso falliti (F0-04).
 *
 * La parte pura (`backoffDelay`) dice quanto aspettare; `FailedAttempts` tiene il conto in
 * memoria per chiave (codice della stanza) e dimentica le chiavi vecchie.
 *
 * **Limite noto:** la memoria è quella del processo. Con più istanze della funzione (Vercel)
 * ogni istanza conta per sé, quindi il ritardo è un ostacolo, non una difesa: la password
 * della stanza resta il vero controllo. Va bene per due giocatori, non per un sito pubblico.
 */

export const BACKOFF = {
  /** Ritardo del primo tentativo fallito. */
  baseMs: 400,
  /** Tetto del ritardo: oltre non serve a nulla e sembra un guasto. */
  maxMs: 8_000,
  /** Dopo questo tempo senza tentativi, la chiave si dimentica. */
  forgetAfterMs: 15 * 60 * 1000,
  /** Chiavi tenute in memoria: oltre, si buttano le più vecchie. */
  maxKeys: 5_000,
} as const;

/** Millisecondi da aspettare dopo `failures` tentativi falliti di fila (funzione pura). */
export function backoffDelay(failures: number): number {
  if (failures <= 0) return 0;
  return Math.min(BACKOFF.baseMs * 2 ** (failures - 1), BACKOFF.maxMs);
}

type Entry = { failures: number; lastAt: number };

export class FailedAttempts {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly now: () => number = Date.now) {}

  /** Registra un fallimento e ritorna quanto aspettare prima di rispondere. */
  register(key: string): number {
    const at = this.now();
    this.forgetOld(at);
    const previous = this.entries.get(key);
    const failures = (previous?.failures ?? 0) + 1;
    this.entries.set(key, { failures, lastAt: at });
    return backoffDelay(failures);
  }

  /** Accesso riuscito: il conto riparte da zero. */
  clear(key: string): void {
    this.entries.delete(key);
  }

  failures(key: string): number {
    return this.entries.get(key)?.failures ?? 0;
  }

  /** Quante chiavi sono in memoria (per i test). */
  get size(): number {
    return this.entries.size;
  }

  private forgetOld(at: number): void {
    for (const [key, entry] of this.entries) {
      if (at - entry.lastAt > BACKOFF.forgetAfterMs) this.entries.delete(key);
    }
    while (this.entries.size >= BACKOFF.maxKeys) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) return;
      this.entries.delete(oldest);
    }
  }
}

/** Contatore condiviso dalla route di accesso. */
export const failedJoins = new FailedAttempts();

/** Aspetta davvero: la route risponde dopo il ritardo, non lo finge. */
export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
