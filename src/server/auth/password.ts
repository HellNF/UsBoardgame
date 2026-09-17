import "server-only";

/**
 * Password della stanza, lato applicazione (F0-02).
 * Il calcolo sta in `password-core.ts` (lo usano anche gli script da terminale); questo
 * modulo esiste perché chi importa da `src/server` dall'applicazione passi dal marcatore
 * `server-only`.
 */
export {
  HASH_PREFIX,
  MIN_PASSWORD_LENGTH,
  SCRYPT_PARAMS,
  hashPassword,
  parseHash,
  verifyPassword,
  type ParsedHash,
} from "./password-core";
