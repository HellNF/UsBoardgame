import { describe, expect, it } from "vitest";

import { HASH_PREFIX, MIN_PASSWORD_LENGTH, hashPassword, parseHash, verifyPassword } from "./password";

const PASSWORD = "prova-locale-2026";

describe("hash della password della stanza (F0-02)", () => {
  it("scrive l'hash nel formato documentato, con i parametri in chiaro", async () => {
    const stored = await hashPassword(PASSWORD);
    const parts = stored.split("$");
    expect(parts).toHaveLength(6);
    expect(parts[0]).toBe(HASH_PREFIX);
    expect(parts.slice(1, 4).map(Number)).toEqual([16384, 8, 1]);
  });

  it("usa un salt diverso ogni volta: due hash della stessa password non coincidono", async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);
    expect(first).not.toBe(second);
  });

  it("riconosce la password giusta", async () => {
    const stored = await hashPassword(PASSWORD);
    await expect(verifyPassword(PASSWORD, stored)).resolves.toBe(true);
  });

  it("rifiuta la password sbagliata, anche di un solo carattere", async () => {
    const stored = await hashPassword(PASSWORD);
    await expect(verifyPassword("prova-locale-2027", stored)).resolves.toBe(false);
    await expect(verifyPassword(`${PASSWORD} `, stored)).resolves.toBe(false);
    await expect(verifyPassword("", stored)).resolves.toBe(false);
  });

  it("rifiuta una password più corta del minimo, senza calcolare l'hash", async () => {
    await expect(hashPassword("corta")).rejects.toThrow(/almeno/);
    expect("corta".length).toBeLessThan(MIN_PASSWORD_LENGTH);
  });

  it("su un hash illeggibile risponde 'sbagliata' invece di esplodere", async () => {
    const broken = [
      "",
      "non-un-hash",
      "scrypt$16384$8$1$solo-sale",
      "bcrypt$16384$8$1$c2FsdA==$aGFzaA==",
      "scrypt$0$8$1$c2FsdA==$aGFzaA==",
      "scrypt$16384$8$1$!!$!!",
    ];
    for (const stored of broken) {
      expect(parseHash(stored)).toBeNull();
      await expect(verifyPassword(PASSWORD, stored)).resolves.toBe(false);
    }
  });

  it("legge i parametri dall'hash salvato: un hash con parametri diversi non verifica", async () => {
    const stored = await hashPassword(PASSWORD);
    const weaker = stored.replace("scrypt$16384$8$1$", "scrypt$1024$8$1$");
    await expect(verifyPassword(PASSWORD, weaker)).resolves.toBe(false);
  });
});
