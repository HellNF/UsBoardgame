-- Lobby atomica (F2-02). Documentazione: docs/data-model.md, docs/decisions.md (D-53).
--
-- Il passaggio "pronto → si parte" non passava da nessuna transazione: la route leggeva
-- `games.ready`, lo modificava in memoria e lo riscriveva, e l'avvio chiudeva con `.single()`.
-- Con due clic quasi simultanei (uno per posto) il secondo poteva riscrivere un `ready`
-- vecchio — serata ferma in lobby con entrambi pronti — oppure ricevere un 500 perché la
-- riga non c'era più da aggiornare.
--
-- Qui il pronto è una sola istruzione SQL: legge e riscrive `ready` nella stessa riga, quindi
-- il pronto dei due posti non si perde, e l'avvio avviene nella stessa transazione del pronto
-- che rende entrambi pronti. La seconda chiamata di avvio ("Gioca lo stesso") non è un errore:
-- se la serata è già partita ritorna la riga com'è.
--
-- Come `apply_game_action` (D-52): quando la funzione non applica niente ritorna `null`, che
-- PostgREST consegna come riga composita con tutti i campi a null. Il chiamante riconosce il
-- caso da `id`/`version` nulli e rilegge lo stato, senza trattarlo come un guasto.

-- Pronto di un posto. Se con questo pronto sono pronti tutti e due, la serata parte nella
-- stessa transazione: `status` diventa `sheets` (una scheda è incompleta, D-28) o `playing`,
-- e lo stato iniziale è `p_new_state` (calcolato dalla route, che sorteggia chi comincia).
create function public.set_lobby_ready(
  p_game_id uuid,
  p_seat smallint,
  p_ready boolean,
  p_sheets_incomplete boolean,
  p_new_state jsonb
) returns public.games
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated public.games;
  both_ready boolean;
begin
  update public.games
     set ready = jsonb_set(coalesce(ready, '{}'::jsonb), array[p_seat::text], to_jsonb(p_ready), true)
   where id = p_game_id
     and status = 'lobby'
  returning * into updated;

  if updated.id is null then
    return null;
  end if;

  both_ready := coalesce((updated.ready ->> '1')::boolean, false)
            and coalesce((updated.ready ->> '2')::boolean, false);
  if not both_ready then
    return updated;
  end if;

  update public.games
     set status = case when p_sheets_incomplete then 'sheets' else 'playing' end,
         state = coalesce(p_new_state, state),
         version = 1
   where id = p_game_id
  returning * into updated;

  return updated;
end;
$$;

-- "Gioca lo stesso" e ripresa di una serata in `sheets`: porta la partita a `playing`.
-- Idempotente: se è già partita ritorna la riga com'è, senza errore (prima `.single()`
-- faceva fallire la seconda chiamata con un 500).
create function public.start_lobby_game(
  p_game_id uuid,
  p_new_state jsonb
) returns public.games
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated public.games;
begin
  update public.games
     set status = 'playing',
         state = coalesce(p_new_state, state),
         version = 1
   where id = p_game_id
     and status in ('lobby', 'sheets')
  returning * into updated;

  if updated.id is null then
    select * into updated from public.games where id = p_game_id;
  end if;

  return updated;
end;
$$;

revoke all on function public.set_lobby_ready(uuid, smallint, boolean, boolean, jsonb)
  from public, anon, authenticated;
grant execute on function public.set_lobby_ready(uuid, smallint, boolean, boolean, jsonb)
  to service_role;

revoke all on function public.start_lobby_game(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.start_lobby_game(uuid, jsonb)
  to service_role;
