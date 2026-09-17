import { redirect } from "next/navigation";

import { boards } from "@/content/boards";
import { LobbyContainer } from "@/features/lobby/lobby-container";
import { currentRoom } from "@/server/room/current";

/**
 * Lobby (F0-05, F2-02): impostazioni della serata, pronto dei due posti, avvio.
 *
 * La serata aperta la garantisce `currentRoom` (se non c'è la crea); quando la partita è
 * cominciata questa pagina rimanda alla schermata giusta: è anche la riconnessione di F2-03,
 * perché vale al caricamento di qualsiasi pagina della stanza.
 */

/** Nomi italiani delle categorie di sfida (docs/specs.md § Sfide). */
const CHALLENGE_CATEGORY_LABELS: Record<string, string> = {
  builtin: "Integrati",
  videocall: "Videochiamata",
  external: "Siti esterni",
  emulator: "Emulatore",
};

/** Ordine stabile delle categorie in lobby. */
const CHALLENGE_CATEGORY_ORDER = ["builtin", "videocall", "external", "emulator"];

export default async function LobbyPage({ params }: PageProps<"/r/[code]/lobby">) {
  const { code } = await params;
  const room = await currentRoom(code);

  if (room.game.status === "playing") redirect(`/r/${room.code}/game`);

  return (
    <main className="flex flex-1 flex-col pb-10">
      <LobbyContainer
        code={room.code}
        roomId={room.roomId}
        gameId={room.game.id}
        seat={room.seat}
        status={room.game.status}
        names={room.names}
        colors={room.colors}
        pawns={room.pawns}
        boardNames={boards.map((board) => ({ id: board.id, name: board.name }))}
        settings={room.settings}
        ready={(room.game.ready ?? {}) as Record<string, boolean>}
        categoryOptions={CHALLENGE_CATEGORY_ORDER.map((id) => ({
          id,
          label: CHALLENGE_CATEGORY_LABELS[id],
        }))}
      />
    </main>
  );
}
