/**
 * POST { code, password, seat } → lega la sessione anonima corrente al posto scelto.
 * TODO(F0-04): implementare (docs/architecture.md § Accesso).
 */
export async function POST() {
  return Response.json({ error: "Non implementato (F0-04)" }, { status: 501 });
}
