import { describe, expect, it } from "vitest";

import { BACKOFF, FailedAttempts, backoffDelay } from "./attempts";

describe("ritardo sui tentativi di accesso falliti (F0-04)", () => {
  it("non fa aspettare chi non ha sbagliato", () => {
    expect(backoffDelay(0)).toBe(0);
    expect(backoffDelay(-3)).toBe(0);
  });

  it("raddoppia il ritardo a ogni tentativo e si ferma al tetto", () => {
    expect(backoffDelay(1)).toBe(BACKOFF.baseMs);
    expect(backoffDelay(2)).toBe(BACKOFF.baseMs * 2);
    expect(backoffDelay(3)).toBe(BACKOFF.baseMs * 4);
    expect(backoffDelay(4)).toBe(BACKOFF.baseMs * 8);
    expect(backoffDelay(5)).toBe(BACKOFF.baseMs * 16);
    expect(backoffDelay(50)).toBe(BACKOFF.maxMs);
  });

  it("conta i fallimenti per codice di stanza, separatamente", () => {
    const attempts = new FailedAttempts(() => 0);
    expect(attempts.register("COPPIA42")).toBe(BACKOFF.baseMs);
    expect(attempts.register("COPPIA42")).toBe(BACKOFF.baseMs * 2);
    expect(attempts.register("ALTRANOTA")).toBe(BACKOFF.baseMs);
    expect(attempts.failures("COPPIA42")).toBe(2);
    expect(attempts.failures("ALTRANOTA")).toBe(1);
  });

  it("l'accesso riuscito azzera il conto", () => {
    const attempts = new FailedAttempts(() => 0);
    attempts.register("COPPIA42");
    attempts.register("COPPIA42");
    attempts.clear("COPPIA42");
    expect(attempts.failures("COPPIA42")).toBe(0);
    expect(attempts.register("COPPIA42")).toBe(BACKOFF.baseMs);
  });

  it("dimentica le chiavi vecchie e non cresce senza limite", () => {
    let clock = 0;
    const attempts = new FailedAttempts(() => clock);
    attempts.register("COPPIA42");
    clock += BACKOFF.forgetAfterMs + 1;
    attempts.register("ALTRANOTA");
    expect(attempts.failures("COPPIA42")).toBe(0);

    for (let index = 0; index < BACKOFF.maxKeys + 10; index++) {
      attempts.register(`STANZA${index}`);
    }
    expect(attempts.size).toBeLessThanOrEqual(BACKOFF.maxKeys);
  });
});
