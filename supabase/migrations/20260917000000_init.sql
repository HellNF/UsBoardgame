-- Schema iniziale. Documentazione: docs/data-model.md
--
-- Modello di sicurezza:
--  * i client leggono solo tramite RLS (sessione anonima Supabase legata a un posto);
--  * i client NON scrivono mai direttamente: ogni scrittura passa dalle API route
--    Next.js, che usano la secret key (bypassa RLS) dopo aver validato l'azione;
--  * le risposte della scheda sono leggibili solo dal proprietario.
--
-- Migrazione mai applicata su un database: si può ancora correggere (HERMES.md § 1).
-- Contiene anche le funzioni delle transazioni (F0-01): `apply_game_action` è l'unico
-- modo in cui lo stato di gioco viene scritto.

-- ---------------------------------------------------------------------------
-- Stanze e giocatori
-- ---------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{4,12}$'),
  -- Hash scrypt calcolato lato server (src/server/auth/password.ts), mai la password in chiaro.
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  seat smallint not null check (seat in (1, 2)),
  display_name text not null,
  pawn text not null default 'fox',
  color text not null default 'red',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, seat)
);

-- Sessioni anonime Supabase autorizzate per un posto (una per browser/dispositivo).
-- Più dispositivi possono essere legati allo stesso posto (auth_user_id diversi).
create table public.player_sessions (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index player_sessions_player_idx on public.player_sessions (player_id);

-- ---------------------------------------------------------------------------
-- Contenuti (generati da src/content con `pnpm content:seed`)
-- ---------------------------------------------------------------------------

create table public.questions (
  id text primary key,
  category text not null check (category in ('tastes', 'memories', 'future', 'deep', 'funny')),
  level smallint not null check (level between 1 and 3),
  kind text not null check (kind in ('multiple', 'short', 'open')),
  text text not null,
  sheet_text text,
  options jsonb,
  active boolean not null default true
);

create table public.challenges (
  id text primary key,
  data jsonb not null,
  active boolean not null default true
);

create table public.boards (
  id text primary key,
  name text not null,
  layout jsonb not null
);

-- ---------------------------------------------------------------------------
-- Schede (private) e domande usate
-- ---------------------------------------------------------------------------

create table public.sheet_answers (
  player_id uuid not null references public.players (id) on delete cascade,
  question_id text not null references public.questions (id),
  answer text not null,
  updated_at timestamptz not null default now(),
  primary key (player_id, question_id)
);

create table public.used_questions (
  room_id uuid not null references public.rooms (id) on delete cascade,
  question_id text not null references public.questions (id),
  -- Chi ha ricevuto la domanda: le "quanto mi conosci" sono per posto, le aperte per coppia (null).
  seat smallint check (seat in (1, 2)),
  used_at timestamptz not null default now()
);
create index used_questions_room_idx on public.used_questions (room_id, question_id);
-- Il registro si rilegge per la coppia stanza + posto (o stanza + aperte, seat null).
create index used_questions_room_seat_idx on public.used_questions (room_id, seat);

-- ---------------------------------------------------------------------------
-- Partite ed eventi
-- ---------------------------------------------------------------------------

create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'sheets', 'playing', 'finished', 'abandoned')),
  settings jsonb not null default '{}'::jsonb,
  -- GameState (src/engine/types.ts). Null finché la partita non inizia.
  state jsonb,
  -- Concorrenza ottimistica: ogni azione aggiorna con `where version = <atteso>`.
  version integer not null default 0,
  ready jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
-- Al massimo una partita non conclusa per stanza.
create unique index games_one_open_per_room on public.games (room_id)
  where status in ('lobby', 'sheets', 'playing');

create table public.game_events (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games (id) on delete cascade,
  version integer not null,
  seat smallint check (seat in (1, 2)),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index game_events_game_idx on public.game_events (game_id, id);

-- ---------------------------------------------------------------------------
-- Helper RLS
-- ---------------------------------------------------------------------------

create function public.current_player_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select player_id from public.player_sessions where auth_user_id = auth.uid()
$$;

create function public.current_room_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.room_id from public.players p
  join public.player_sessions s on s.player_id = p.id
  where s.auth_user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- RLS: solo lettura per i membri della stanza, nessuna scrittura dai client
-- ---------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.player_sessions enable row level security;
alter table public.questions enable row level security;
alter table public.challenges enable row level security;
alter table public.boards enable row level security;
alter table public.sheet_answers enable row level security;
alter table public.used_questions enable row level security;
alter table public.games enable row level security;
alter table public.game_events enable row level security;

-- rooms: nessuna policy di select (password_hash non deve mai arrivare al client).

create policy "players: membri della stanza" on public.players
  for select to authenticated using (room_id = public.current_room_id());

create policy "player_sessions: la propria" on public.player_sessions
  for select to authenticated using (auth_user_id = auth.uid());

-- Le domande ritirate (`active = false`) spariscono dal catalogo: lo schema Zod prevede
-- il campo e il seed lo imposta a true, ma la colonna è già qui per non doverla migrare.
create policy "questions: lettura" on public.questions
  for select to authenticated using (active);

create policy "challenges: lettura" on public.challenges
  for select to authenticated using (active);

create policy "boards: lettura" on public.boards
  for select to authenticated using (true);

create policy "sheet_answers: solo il proprietario" on public.sheet_answers
  for select to authenticated using (player_id = public.current_player_id());

create policy "used_questions: membri della stanza" on public.used_questions
  for select to authenticated using (room_id = public.current_room_id());

create policy "games: membri della stanza" on public.games
  for select to authenticated using (room_id = public.current_room_id());

create policy "game_events: membri della stanza" on public.game_events
  for select to authenticated using (
    game_id in (select id from public.games where room_id = public.current_room_id())
  );

-- ---------------------------------------------------------------------------
-- Permessi: le policy non bastano, i client non ricevono nemmeno il privilegio
-- ---------------------------------------------------------------------------

revoke all on public.rooms from anon, authenticated;

revoke all on
  public.players,
  public.player_sessions,
  public.questions,
  public.challenges,
  public.boards,
  public.sheet_answers,
  public.used_questions,
  public.games,
  public.game_events
from anon, authenticated;

-- Il minimo che serve a giocare: leggere. `rooms` non compare: il client non la legge mai.
grant select on
  public.players,
  public.player_sessions,
  public.questions,
  public.challenges,
  public.boards,
  public.sheet_answers,
  public.used_questions,
  public.games,
  public.game_events
to authenticated;

-- Le funzioni helper servono alle policy (girano come `authenticated`), quelle delle
-- transazioni no: le chiama solo il server con la secret key.
revoke all on function public.current_player_id() from public, anon;
revoke all on function public.current_room_id() from public, anon;
grant execute on function public.current_player_id() to authenticated, service_role;
grant execute on function public.current_room_id() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Funzioni delle transazioni (F0-01)
-- ---------------------------------------------------------------------------

-- Applica un'azione di gioco in una sola transazione: aggiorna lo stato solo se la
-- versione attesa combacia, scrive gli eventi e registra le domande uscite.
-- Ritorna la riga aggiornata, oppure `null` se qualcuno è arrivato prima
-- (conflitto di versione: la route risponde 409 e il client si riallinea, D-23).
--
-- p_used: `[{ "questionId": "tastes-004", "seat": 1 }, …]`, `seat` null per le domande aperte.
-- p_reset_seats: sottoinsiemi a mazzo esaurito da azzerare (D-29): 1, 2, oppure 0 per le aperte.
create function public.apply_game_action(
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
begin
  update public.games
     set state = p_new_state,
         version = version + 1
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

-- ---------------------------------------------------------------------------
-- Realtime: i client ascoltano i cambi di partite ed eventi (filtrati da RLS)
-- ---------------------------------------------------------------------------

-- `replica identity full`: Realtime valuta le policy RLS sulla riga vecchia come sulla
-- nuova, altrimenti gli aggiornamenti di `games` possono arrivare anche a chi non è
-- della stanza (e il payload non conterrebbe i valori precedenti).
alter table public.games replica identity full;
alter table public.game_events replica identity full;
alter table public.players replica identity full;

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.game_events;
alter publication supabase_realtime add table public.players;
