import { redirect } from "next/navigation";

import { OnlineTable } from "@/features/game/online-table";
import { currentRoom } from "@/server/room/current";

/**
 * Partita (F1-05, F2-01, F2-03): il tabellone con i dati veri.
 *
 * Qui il motore **non** gira nel browser (regola 1 di AGENTS.md): lo stato arriva dal server e
 * ogni mossa parte da `POST /api/games/[gameId]/actions`. Se la serata non è ancora cominciata
 * la pagina rimanda alla schermata giusta; se la partita è finita il diario raccoglie la serata.
 */

export default async function GamePage({ params }: PageProps<"/r/[code]/game">) {
  const { code } = await params;
  const room = await currentRoom(code);

  if (room.game.status === "lobby") redirect(`/r/${room.code}/lobby`);
  if (room.game.status === "sheets") redirect(`/r/${room.code}/sheet`);
  if (room.game.status === "finished") redirect(`/r/${room.code}/diary`);

  if (!room.state || !room.board) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="border-2 border-ink px-4 py-3">
          La partita non è ancora cominciata: torna nella{" "}
          <a className="underline" href={`/r/${room.code}/lobby`}>
            lobby
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-4 p-4 lg:h-dvh lg:gap-5 lg:p-6">
      <OnlineTable
        code={room.code}
        roomId={room.roomId}
        gameId={room.game.id}
        seat={room.seat}
        version={room.game.version}
        state={room.state}
        board={room.board}
        names={room.names}
        colors={room.colors}
        settings={room.settings}
      />
    </main>
  );
}
