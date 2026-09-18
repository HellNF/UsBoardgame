import { redirect } from "next/navigation";

import { OnlineTable } from "@/features/game/online-table";
import { currentRoom } from "@/server/room/current";

/**
 * Partita (F1-05, F2-01, F2-03): il tabellone con i dati veri.
 *
 * Qui il motore **non** gira nel browser (regola 1 di AGENTS.md): lo stato arriva dal server e
 * ogni mossa parte da `POST /api/games/[gameId]/actions`. Se la serata non è ancora cominciata
 * la pagina rimanda alla schermata giusta; a serata **conclusa** resta qui la schermata finale
 * (D-64), che si riapre anche ricaricando: da lì si va al diario o si comincia una serata nuova.
 */

export default async function GamePage({ params }: PageProps<"/r/[code]/game">) {
  const { code } = await params;
  const room = await currentRoom(code);

  if (room.game.status === "lobby") redirect(`/r/${room.code}/lobby`);
  if (room.game.status === "sheets") redirect(`/r/${room.code}/sheet`);
  // `finished` non rimanda più al diario: la schermata finale è il finale della serata.

  // Tabellone sparito dal database: succede a una serata che punta a un id che non c'è più (un
  // contenuto mai pubblicato, o cancellato). Non è «non è ancora cominciata», e la lobby non aiuta:
  // una serata in corso il tabellone non lo cambia (D-77), quindi il messaggio dice cosa manca e
  // cosa fare, invece di rimandare a un giro a vuoto.
  if (!room.board) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="border-2 border-ink px-4 py-3">
          Il tabellone di questa serata ({room.settings.boardId}) non è nel database: la partita non si può
          ridisegnare. Il contenuto si ripubblica con <code>pnpm content:push</code>.
        </p>
      </main>
    );
  }

  if (!room.state) {
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
