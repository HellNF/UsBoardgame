import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password della stanza (F0-02): scrypt di `node:crypto` con salt casuale per ogni hash.
 *
 * Formato dell'hash, tutto in un campo di testo:
 *   `scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>`
 *
 * Il confronto è a tempo costante (`timingSafeEqual`): il tempo di risposta non dice
 * quanti caratteri della password erano giusti.
 *
 * **Perché questa parte sta in un file senza `import "server-only"`:** la usano anche gli
 * script da terminale (`pnpm room:create`), che girano con `tsx` e non passano da Next.js:
 * lì il marcatore `server-only` solleva subito un errore. Il file resta comunque
 * irraggiungibile dal browser, perché ESLint vieta a `src/features` e `src/app` (codice
 * client) di importare da `@/server`. `password.ts`, il modulo che importa il resto
 * dell'applicazione, ha il marcatore.
 */

/** Parametri scrypt: ~16 MB di memoria e qualche decina di millisecondi su una macchina normale. */
export const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keyLength: 64, saltLength: 16 } as const;

/** Lunghezza minima della password della stanza (una parola lunga, non una data). */
export const MIN_PASSWORD_LENGTH = 8;

export const HASH_PREFIX = "scrypt";

/** scrypt con la callback trasformata in Promise, con firma tipizzata. */
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
) => Promise<Buffer>;

export type ParsedHash = {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
};

/** Legge un hash scritto da `hashPassword`; `null` se non è nel formato giusto. */
export function parseHash(stored: string): ParsedHash | null {
  const parts = stored.split("$");
  if (parts.length !== 6) return null;
  const [prefix, n, r, p, salt, hash] = parts;
  if (prefix !== HASH_PREFIX) return null;

  const numbers = [n, r, p].map((value) => Number.parseInt(value, 10));
  if (numbers.some((value) => !Number.isInteger(value) || value <= 0)) return null;

  const saltBuffer = Buffer.from(salt, "base64");
  const hashBuffer = Buffer.from(hash, "base64");
  if (saltBuffer.length === 0 || hashBuffer.length === 0) return null;

  return { n: numbers[0], r: numbers[1], p: numbers[2], salt: saltBuffer, hash: hashBuffer };
}

/** Memoria massima concessa a scrypt: il minimo richiesto da N e r, con un po' di margine. */
const maxmemFor = (n: number, r: number): number => Math.max(128 * n * r * 2, 32 * 1024 * 1024);

/** Calcola l'hash della password. Solleva un errore se la password è troppo corta. */
export async function hashPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.`);
  }
  const salt = randomBytes(SCRYPT_PARAMS.saltLength);
  const derived = await scrypt(password, salt, SCRYPT_PARAMS.keyLength, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: maxmemFor(SCRYPT_PARAMS.N, SCRYPT_PARAMS.r),
  });

  return [
    HASH_PREFIX,
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Verifica la password contro un hash salvato.
 * Ritorna `false` (mai un errore) se l'hash è illeggibile o i suoi parametri non sono
 * utilizzabili: una riga rovinata nel database non deve far esplodere la route di accesso.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (parsed === null) return false;

  try {
    const derived = await scrypt(password, parsed.salt, parsed.hash.length, {
      N: parsed.n,
      r: parsed.r,
      p: parsed.p,
      maxmem: maxmemFor(parsed.n, parsed.r),
    });
    if (derived.length !== parsed.hash.length) return false;
    return timingSafeEqual(derived, parsed.hash);
  } catch {
    // Parametri assurdi nell'hash (es. N enorme): si risponde "password sbagliata".
    return false;
  }
}
