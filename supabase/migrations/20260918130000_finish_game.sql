-- La serata conclusa entra nell'archivio (F1, docs/decisions.md § Ancora aperte).
-- Documentazione: docs/data-model.md, docs/decisions.md (D-61).
--
-- Il motore arriva a `phase = 'finished'`, ma `games.status` restava `playing`: la schermata
-- finale si riapriva rientrando (comodo), però `findFinishedGames` cerca `status = 'finished'`,
-- quindi «Partite passate» nel diario non si riempiva **mai**, e l'azione `new` («Nuova
-- partita») portava la serata conclusa a `abandoned`: sparita per sempre.
--
-- Qui `apply_game_action` scrive `status = 'finished'` e `finished_at = now()` quando lo stato
-- applicato è finito: **una sola transazione**, come vuole D-52. Un secondo `update` dal lato
-- TypeScript potrebbe lasciare la riga a metà (stato salvato, archivio no) — ed è proprio il
-- motivo per cui questa funzione esiste.
--
-- La regola è scritta anche in TypeScript (`statusAfterAction` in src/server/game/game-status.ts),
-- pura e provata: qui sotto è la stessa regola eseguita dal database, una volta sola.
--
-- `create or replace` con la stessa firma: i permessi di `apply_game_action` restano quelli
-- concessi all'inizio (li riasseriamo comunque in fondo, così il file si legge da solo).

create or replace function public.apply_game_action(
  p_game_id uuid,
  p_expected_version integer,
  p_new_state jsonb,
  p_events jsonb,
  p_used jsonb default '[]'::jsonb,
  p_reset_seats jsonb default '[]'::jsonb
) returns public.games
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated public.games;
  -- Chiude la serata? Lo decide il motore: la fase dello stato applicato, non il chiamante.
  finishing boolean := coalesce(p_new_state ->> 'phase', '') = 'finished';
begin
  update public.games
     set state = p_new_state,
         version = version + 1,
         status = case when finishing then 'finished' else status end,
         -- `coalesce`: se la riga era già conclusa la data dell'archivio non si sposta.
         finished_at = case when finishing then coalesce(finished_at, now()) else finished_at end
   where id = p_game_id
     and version = p_expected_version
  returning * into updated;

  if updated.id is null then
    return null;
  end if;

  insert into public.game_events (game_id, version, seat, type, payload)
  select p_game_id,
         updated.version,
         (event ->> 'seat')::smallint,
         event ->> 'type',
         event
    from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) as event;

  -- Prima si azzerano i sottoinsiemi esauriti, poi si registra la domanda nuova:
  -- al contrario la cancellazione porterebbe via anche quella appena pescata.
  delete from public.used_questions
   where room_id = updated.room_id
     and coalesce(seat, 0) in (
       select value::smallint from jsonb_array_elements_text(coalesce(p_reset_seats, '[]'::jsonb))
     );

  insert into public.used_questions (room_id, question_id, seat)
  select updated.room_id, used ->> 'questionId', (used ->> 'seat')::smallint
    from jsonb_array_elements(coalesce(p_used, '[]'::jsonb)) as used;

  return updated;
end;
$$;

revoke all on function public.apply_game_action(uuid, integer, jsonb, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_game_action(uuid, integer, jsonb, jsonb, jsonb, jsonb)
  to service_role;

-- Serate già giocate prima di questa migrazione: la partita era finita (lo stato lo dice) ma la
-- riga era rimasta `playing`. Si archiviano qui, una volta sola: `finished_at` è l'istante in cui
-- si applica la migrazione, perché quello vero non esiste da nessuna parte.
-- Senza questo, la serata resterebbe aperta (`playing`), «Nuova partita» la troverebbe come
-- partita in corso e non potrebbe nemmeno crearne una nuova (una sola aperta per stanza).
update public.games
   set status = 'finished',
       finished_at = coalesce(finished_at, now())
 where status = 'playing'
   and state ->> 'phase' = 'finished';
