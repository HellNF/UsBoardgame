-- Verifica delle policy RLS (F0-04, F2-01). Da eseguire nel SQL editor di Supabase Studio
-- (http://127.0.0.1:54323) dopo `pnpm db:reset` e dopo aver creato la stanza con
-- `pnpm room:create` e aperto le due finestre: impersona i due posti della stanza vera e
-- controlla cosa vedono.
--
-- Come si legge il risultato:
--   * ogni NOTICE che comincia con "ok:" è un controllo passato;
--   * un ERROR interrompe tutto e dice quale controllo è fallito: c'è una policy (o un
--     privilegio) da correggere. Non lascia nulla dietro di sé: lo script chiude con
--     ROLLBACK.
--
-- Cosa deve risultare, in breve:
--   * `rooms` non è leggibile da nessun posto (la password_hash non esce mai dal server);
--   * `sheet_answers` si vede solo la propria scheda, mai quella dell'altro;
--   * `players`, `used_questions`, `games` e `game_events` solo della propria stanza;
--   * `questions`, `challenges` e `boards` leggibili dai client, ma solo le righe attive;
--   * nessuna scrittura dal browser: ogni insert/update deve fallire.

begin;

do $$
declare
  seat_row record;
  seen integer;
  expected integer;
  active_questions integer;
  active_challenges integer;
  all_boards integer;
  other_game_ids uuid[];
begin
  if (select count(*) from public.player_sessions) = 0 then
    raise notice 'Nessuna sessione in player_sessions: crea la stanza con pnpm room:create e riapri le due finestre.';
    return;
  end if;

  -- Cosa il client *deve* poter leggere dei contenuti (calcolato da postgres, senza RLS).
  select count(*) into active_questions from public.questions where active;
  select count(*) into active_challenges from public.challenges where active;
  select count(*) into all_boards from public.boards;

  for seat_row in
    select p.seat, p.id as player_id, p.room_id, s.auth_user_id
      from public.player_sessions s
      join public.players p on p.id = s.player_id
     order by p.seat
     limit 2
  loop
    -- Le attese di questo posto, lette da postgres prima di impersonarlo.
    select coalesce(array_agg(id), '{}') into other_game_ids
      from public.games where room_id <> seat_row.room_id;
    expected := (select count(*) from public.sheet_answers where player_id = seat_row.player_id);

    -- Da qui in poi la sessione è quella dell'utente anonimo del posto, come nel browser.
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', seat_row.auth_user_id::text, 'role', 'authenticated')::text,
      true
    );
    execute 'set local role authenticated';

    raise notice '--- posto % (utente %) ---', seat_row.seat, seat_row.auth_user_id;

    -- 1. La stanza: nessuna policy di select e nessun privilegio. Si accettano due esiti —
    --    "permesso negato" (il privilegio non c'è) oppure zero righe; righe visibili = policy sbagliata.
    begin
      execute 'select count(*) from public.rooms' into seen;
      if seen <> 0 then
        raise exception 'Il posto % vede % righe di rooms: la tabella non deve essere leggibile', seat_row.seat, seen;
      end if;
      raise notice 'ok: rooms non è leggibile (zero righe; meglio togliere anche il privilegio)';
    exception
      when insufficient_privilege then raise notice 'ok: rooms non è leggibile (permesso negato)';
    end;

    -- 2. La propria scheda sì, quella dell'altro mai.
    execute 'select count(*) from public.sheet_answers where player_id <> $1' into seen using seat_row.player_id;
    if seen <> 0 then
      raise exception 'Il posto % vede % risposte della scheda dell''altro', seat_row.seat, seen;
    end if;
    execute 'select count(*) from public.sheet_answers' into seen;
    if seen <> expected then
      raise exception 'Il posto % vede % risposte invece delle sue %', seat_row.seat, seen, expected;
    end if;
    raise notice 'ok: sheet_answers solo la propria scheda (% risposte)', seen;

    -- 3. La propria sessione: una riga sola, la sua.
    execute 'select count(*) from public.player_sessions' into seen;
    if seen <> 1 then
      raise exception 'Il posto % vede % righe di player_sessions invece di 1', seat_row.seat, seen;
    end if;
    raise notice 'ok: player_sessions solo la propria riga';

    -- 4. Posti, domande usate, partite ed eventi: solo la propria stanza.
    execute 'select count(*) from public.players where room_id <> $1' into seen using seat_row.room_id;
    if seen <> 0 then
      raise exception 'Il posto % vede % posti di altre stanze', seat_row.seat, seen;
    end if;
    execute 'select count(*) from public.used_questions where room_id <> $1' into seen using seat_row.room_id;
    if seen <> 0 then
      raise exception 'Il posto % vede % domande usate di altre stanze', seat_row.seat, seen;
    end if;
    execute 'select count(*) from public.games where room_id <> $1' into seen using seat_row.room_id;
    if seen <> 0 then
      raise exception 'Il posto % vede % partite di altre stanze', seat_row.seat, seen;
    end if;
    execute 'select count(*) from public.game_events where game_id = any($1)' into seen using other_game_ids;
    if seen <> 0 then
      raise exception 'Il posto % vede % eventi di altre stanze', seat_row.seat, seen;
    end if;
    execute 'select count(*) from public.players where room_id = $1' into seen using seat_row.room_id;
    if seen <> 2 then
      raise exception 'Il posto % vede % posti della propria stanza invece di 2', seat_row.seat, seen;
    end if;
    raise notice 'ok: players, used_questions, games e game_events solo della propria stanza';

    -- 5. I contenuti si leggono (servono a costruire le carte), e solo le righe attive.
    execute 'select count(*) from public.questions' into seen;
    if seen <> active_questions then
      raise exception 'Il posto % vede % domande invece delle % attive', seat_row.seat, seen, active_questions;
    end if;
    execute 'select count(*) from public.challenges' into seen;
    if seen <> active_challenges then
      raise exception 'Il posto % vede % sfide invece delle % attive', seat_row.seat, seen, active_challenges;
    end if;
    execute 'select count(*) from public.boards' into seen;
    if seen <> all_boards then
      raise exception 'Il posto % vede % tabelloni invece di %', seat_row.seat, seen, all_boards;
    end if;
    raise notice 'ok: questions, challenges e boards leggibili (solo le righe attive)';

    -- 6. Nessuna scrittura dal browser: ogni tentativo deve essere rifiutato.
    begin
      execute 'insert into public.players (room_id, seat, display_name) values ($1, 1, $2)'
        using seat_row.room_id, 'intruso';
      raise exception 'Il posto % è riuscito a scrivere in players', seat_row.seat;
    exception
      when insufficient_privilege then raise notice 'ok: insert su players rifiutato';
    end;

    begin
      execute 'update public.games set status = ''abandoned''';
      raise exception 'Il posto % è riuscito a cambiare games', seat_row.seat;
    exception
      when insufficient_privilege then raise notice 'ok: update su games rifiutato';
    end;

    begin
      execute 'insert into public.sheet_answers (player_id, question_id, answer)
               select $1, id, ''risposta intrusa'' from public.questions limit 1'
        using seat_row.player_id;
      raise exception 'Il posto % è riuscito a scrivere in sheet_answers', seat_row.seat;
    exception
      when insufficient_privilege then raise notice 'ok: insert su sheet_answers rifiutato';
    end;

    begin
      execute 'insert into public.rooms (code, password_hash) values (''INTRUSO1'', ''x'')';
      raise exception 'Il posto % è riuscito a scrivere in rooms', seat_row.seat;
    exception
      when insufficient_privilege then raise notice 'ok: insert su rooms rifiutato';
    end;

    -- Le funzioni delle transazioni non sono per i client.
    begin
      execute 'select public.apply_game_action(null, 0, ''{}''::jsonb, ''[]''::jsonb)' into seen;
      raise exception 'Il posto % può chiamare apply_game_action: revocare il permesso', seat_row.seat;
    exception
      when insufficient_privilege then raise notice 'ok: apply_game_action non è chiamabile dal client';
      when others then
        raise exception 'Il posto % ha chiamato apply_game_action (errore inatteso: %)', seat_row.seat, sqlerrm;
    end;

    execute 'reset role';
  end loop;

  if (select count(*) from public.player_sessions) < 2 then
    raise notice 'Nota: c''è una sola sessione. Apri anche l''altra finestra (in incognito) e riprova per il controllo incrociato.';
  end if;

  raise notice 'Verifica RLS finita: nessun controllo fallito.';
end;
$$;

rollback;

-- Nota: lo script chiude con ROLLBACK e non COMMIT: è una verifica, non deve lasciare nulla
-- dietro di sé (e i tentativi di scrittura del punto 6 non devono restare nel database).
