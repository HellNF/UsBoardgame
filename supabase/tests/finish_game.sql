-- Verifica dell'archivio delle partite (F1, D-61). Da eseguire nel SQL editor di Supabase Studio
-- (http://127.0.0.1:54323) dopo `pnpm db:reset`: la stanza e la serata se le crea qui dentro e alla
-- fine fa ROLLBACK (non lascia righe). Come `supabase/tests/lobby.sql`, non serve nessuna finestra
-- aperta: è il controllo veloce della regola, mentre la prova a occhio è la voce F1 del Registro.
--
-- Cosa controlla, in breve:
--   * un'azione normale non tocca `status` né `finished_at`;
--   * l'azione che porta lo stato a `phase = "finished"` scrive `finished` e `finished_at` nella
--     stessa transazione, e l'evento `GAME_FINISHED` c'è;
--   * con la versione sbagliata non si conclude niente (la funzione ritorna null);
--   * conclusa la serata, la stanza può cominciarne una nuova (una sola aperta per stanza);
--   * l'update condizionato di «Nuova partita» non abbandona una serata conclusa;
--   * la riparazione della migrazione archivia le righe rimaste `playing` con la partita finita.
--
-- Come si legge il risultato: ogni NOTICE che comincia con "ok:" è un controllo passato; un
-- ERROR dice quale controllo è fallito.

begin;

do $$
declare
  v_room uuid;
  v_game uuid;
  v_old uuid;
  v_row public.games;
  v_events integer;
begin
  insert into public.rooms (code, password_hash)
    values ('FINISH61', 'scrypt$16384$8$1$finto$finto')
    returning id into v_room;

  insert into public.players (room_id, seat, display_name, pawn, color)
    values (v_room, 1, 'Leo', 'fox', 'red'), (v_room, 2, 'Marta', 'rabbit', 'blue');

  insert into public.games (room_id, status, settings, state, version)
    values (v_room, 'playing', '{}'::jsonb, '{"phase": "resolving", "round": 3}'::jsonb, 7)
    returning id into v_game;

  -- Un'azione che non conclude la serata: `status` e `finished_at` non si toccano.
  v_row := public.apply_game_action(
    v_game, 7,
    '{"phase": "pre_roll", "round": 3}'::jsonb,
    '[{"type": "ROLLED", "seat": 1}]'::jsonb
  );
  if v_row.status <> 'playing' or v_row.finished_at is not null or v_row.version <> 8 then
    raise exception 'azione normale: atteso playing senza data, versione 8; trovato % / % / %',
      v_row.status, v_row.finished_at, v_row.version;
  end if;
  raise notice 'ok: un''azione normale non tocca lo stato della serata (versione %)', v_row.version;

  -- Con la versione sbagliata non si conclude niente: la funzione ritorna null.
  v_row := public.apply_game_action(v_game, 7, '{"phase": "finished"}'::jsonb, '[]'::jsonb);
  if v_row.id is not null then
    raise exception 'con la versione sbagliata la funzione ha aggiornato la riga: %', v_row.status;
  end if;
  select * into v_row from public.games where id = v_game;
  if v_row.status <> 'playing' then
    raise exception 'con la versione sbagliata la serata si è conclusa lo stesso: %', v_row.status;
  end if;
  raise notice 'ok: con la versione sbagliata la serata non si conclude (riga null)';

  -- L'azione che conclude la serata: `finished` e `finished_at` nella stessa transazione.
  v_row := public.apply_game_action(
    v_game, 8,
    '{"phase": "finished", "winner": 1, "round": 4}'::jsonb,
    '[{"type": "GAME_FINISHED", "seat": null, "winner": 1, "reason": "finish"}]'::jsonb
  );
  if v_row.status <> 'finished' then
    raise exception 'la serata conclusa doveva essere finished, invece è %', v_row.status;
  end if;
  if v_row.finished_at is null then
    raise exception 'la serata conclusa non ha finished_at: l''archivio non avrebbe la data';
  end if;
  if v_row.version <> 9 then
    raise exception 'versione attesa 9, trovata %', v_row.version;
  end if;
  select count(*) into v_events
    from public.game_events
   where game_id = v_game and type = 'GAME_FINISHED';
  if v_events <> 1 then
    raise exception 'l''evento della serata conclusa manca o è doppio: %', v_events;
  end if;
  raise notice 'ok: la serata conclusa è finished con la data, in una sola transazione (versione %)',
    v_row.version;

  -- Conclusa la serata, la stanza può cominciarne una nuova: l'indice univoco parziale è libero.
  insert into public.games (room_id, status, settings, version)
    values (v_room, 'lobby', '{}'::jsonb, 0)
    returning id into v_old;

  -- L'update condizionato dell'azione `new`: una serata già conclusa **non** diventa `abandoned`.
  update public.games set status = 'abandoned' where id = v_game and status = 'playing';
  select * into v_row from public.games where id = v_game;
  if v_row.status <> 'finished' then
    raise exception 'una serata conclusa è stata abbandonata: %', v_row.status;
  end if;
  raise notice 'ok: «Nuova partita» non abbandona una serata conclusa (resta nell''archivio)';

  -- E una serata ancora in corso sì: è il comportamento di prima, che resta giusto.
  update public.games set status = 'abandoned' where id = v_old and status = 'playing';
  select * into v_row from public.games where id = v_old;
  if v_row.status <> 'lobby' then
    raise exception 'una serata in lobby è stata abbandonata: %', v_row.status;
  end if;
  update public.games set status = 'playing', version = 3 where id = v_old;
  update public.games set status = 'abandoned' where id = v_old and status = 'playing';
  select * into v_row from public.games where id = v_old;
  if v_row.status <> 'abandoned' then
    raise exception 'una serata in corso doveva diventare abandoned, invece è %', v_row.status;
  end if;
  raise notice 'ok: «Nuova partita» abbandona solo una serata non conclusa';

  -- La riparazione della migrazione: una riga rimasta `playing` con la partita già finita.
  update public.games
     set status = 'playing', finished_at = null, state = '{"phase": "finished", "winner": 2}'::jsonb
   where id = v_old;
  update public.games
     set status = 'finished',
         finished_at = coalesce(finished_at, now())
   where status = 'playing'
     and state ->> 'phase' = 'finished';
  select * into v_row from public.games where id = v_old;
  if v_row.status <> 'finished' or v_row.finished_at is null then
    raise exception 'la riparazione non ha archiviato la serata già giocata: % / %',
      v_row.status, v_row.finished_at;
  end if;
  raise notice 'ok: la riparazione della migrazione archivia le serate già giocate (F1)';

  raise notice 'Fatto: l''archivio delle partite passa tutti i controlli.';
end;
$$;

rollback;
