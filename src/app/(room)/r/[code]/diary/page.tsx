import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DiaryView } from "@/features/diary/diary-view";
import { readDiary } from "@/server/diary/read-diary";
import { currentRoom } from "@/server/room/current";

/**
 * Diario (F5-06): i momenti della serata si costruiscono dal registro `game_events`, l'archivio
 * dalle partite concluse. Le risposte della scheda non ci sono: negli eventi c'è solo la risposta
 * **data** dal giocatore (regola 4 di AGENTS.md).
 *
 * La vista è quella provata in `/dev/ui` (`DiaryView`): componenti di presentazione, qui i dati veri.
 */

export default async function DiaryPage({ params }: PageProps<"/r/[code]/diary">) {
  const { code } = await params;
  const room = await currentRoom(code);

  const { entries, archive } = await readDiary(createSupabaseAdminClient(), [room.game, ...room.finished]).catch(
    () => ({ entries: [], archive: [] }),
  );

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 pt-6 font-sans text-sm">
        <span className="border border-ink px-3 py-1 tracking-[0.15em] uppercase">Stanza {room.code}</span>
        <a className="underline" href={`/r/${room.code}/game`}>
          Partita
        </a>
        <a className="underline" href={`/r/${room.code}/lobby`}>
          Lobby
        </a>
      </div>

      <DiaryView names={room.names} entries={entries} archive={archive} />
    </main>
  );
}
