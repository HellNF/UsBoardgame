import "server-only";

/**
 * Hash della password della stanza (scrypt di node:crypto, con salt).
 * TODO(F0-02): implementare hashPassword / verifyPassword con confronto a tempo costante.
 */
export async function hashPassword(_password: string): Promise<string> {
  throw new Error("Non implementato (F0-02)");
}

export async function verifyPassword(_password: string, _hash: string): Promise<boolean> {
  throw new Error("Non implementato (F0-02)");
}
