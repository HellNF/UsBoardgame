/**
 * POST { action, expectedVersion } → applica un'azione di gioco sul server.
 * TODO(F2-01): validare il body con Zod e chiamare src/server/game/apply-action.ts.
 */
export async function POST(_request: Request, _ctx: RouteContext<"/api/games/[gameId]/actions">) {
  return Response.json({ error: "Non implementato (F2-01)" }, { status: 501 });
}
