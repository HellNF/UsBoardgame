-- Verifica della lobby atomica (F2-02, D-53). Da eseguire nel SQL editor di Supabase Studio
-- (http://127.0.0.1:54323) dopo `pnpm db:reset`: non serve nessuna finestra aperta, la stanza e
-- la serata se le crea qui dentro e alla fine fa ROLLBACK (non lascia righe).
--
-- Cosa controlla, in breve:
--   * il pronto del primo posto lascia la serata in `lobby`;
--   * il pronto del secondo la fa partire **nella stessa transazione**, con lo stato iniziale;
--   * un secondo pronto su una serata già partita non è un errore: non cambia niente;
--   * `start_lobby_game` è idempotente: chiamata due volte ritorna la riga com'è.
--
-- Come si legge il risultato: ogni NOTICE che comincia con "ok:" è un controllo passato; un
-- ERROR dice quale controllo è fallito.

begin;

do $$
declare
  v_room uuid;
  v_game uuid;
  v_row public.games;
  v_state jsonb := '{"version": 0, "turn": 1, "phase": "pre_roll"}'::jsonb;
begin
  insert into public.rooms (code, password_hash)
    values ('LOBBY53T', 'scrypt$16384$8$1$finto$finto')
    returning id into v_room;

  insert into public.players (room_id, seat, display_name, pawn, color)
    values (v_room, 1, 'Leo', 'fox', 'red'), (v_room, 2, 'Marta', 'rabbit', 'blue');

  insert into public.games (room_id, status, settings, ready, version)
    values (v_room, 'lobby', '{}'::jsonb, '{}'::jsonb, 0)
    returning id into v_game;

  -- Primo pronto: la serata resta in lobby (manca il pronto dell'altro posto).
  v_row := public.set_lobby_ready(v_game, 1::smallint, true, false, v_state);
  if v_row.status <> 'lobby' or v_row.state is not null then
    raise exception 'il pronto del posto 1 ha fatto partire la serata: %', v_row.status;
  end if;
  if (v_row.ready ->> '1')::boolean is not true then
    raise exception 'il pronto del posto 1 non è stato scritto: %', v_row.ready;
  end if;
  raise notice 'ok: il primo pronto lascia la serata in lobby (ready = %)', v_row.ready;

  -- Secondo pronto: parte adesso, nella stessa transazione, con lo stato iniziale.
  v_row := public.set_lobby_ready(v_game, 2::smallint, true, false, v_state);
  if v_row.status <> 'playing' then
    raise exception 'con entrambi pronti la serata è rimasta in %', v_row.status;
  end if;
  if v_row.state is null or v_row.version <> 1 then
    raise exception 'serata avviata senza stato iniziale (version %)', v_row.version;
  end if;
  raise notice 'ok: il secondo pronto fa partire la serata (status %, version %)', v_row.status, v_row.version;

  -- Con la scheda incompleta si passa da `sheets` (D-28).
  update public.games set status = 'lobby', state = null, version = 0, ready = '{}'::jsonb
   where id = v_game;
  v_row := public.set_lobby_ready(v_game, 1::smallint, true, true, v_state);
  v_row := public.set_lobby_ready(v_game, 2::smallint, true, true, v_state);
  if v_row.status <> 'sheets' then
    raise exception 'con una scheda incompleta lo stato è % invece di sheets', v_row.status;
  end if;
  raise notice 'ok: con una scheda incompleta entrambi pronti portano a sheets (D-28)';

  -- Serata già partita: un altro pronto non cambia niente e non solleva errori.
  v_row := public.set_lobby_ready(v_game, 1::smallint, false, false, v_state);
  if v_row.id is not null then
    raise exception 'un pronto su una serata avviata ha aggiornato la riga: %', v_row.status;
  end if;
  raise notice 'ok: un pronto su una serata già partita non tocca niente (riga null)';

  -- La seconda chiamata di avvio ("Gioca lo stesso", o la corsa fra i due posti) non è un errore.
  update public.games set status = 'sheets', state = null, version = 0, ready = '{}'::jsonb
   where id = v_game;
  v_row := public.start_lobby_game(v_game, v_state);
  if v_row.status <> 'playing' then
    raise exception 'start_lobby_game non ha avviato la serata: %', v_row.status;
  end if;
  v_row := public.start_lobby_game(v_game, v_state);
  if v_row.status <> 'playing' or v_row.version <> 1 then
    raise exception 'la seconda chiamata di avvio ha rovinato la riga (status %, version %)',
      v_row.status, v_row.version;
  end if;
  raise notice 'ok: start_lobby_game è idempotente (la seconda chiamata ritrova la riga com''è)';

  raise notice 'Fatto: la lobby atomica passa tutti i controlli.';
end;
$$;

rollback;
