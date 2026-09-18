-- Canali Realtime privati (J3).
--
-- Fino a qui chi conosceva l'id di una stanza poteva iscriversi al canale `room:<id>` e **vedere la
-- presenza** (i dati di gioco no: li filtra la RLS delle tabelle). Con il canale privato e queste
-- policy si iscrive solo chi ha una sessione in quella stanza.
--
-- Attenzione a cosa passa dal canale: oltre alla presenza ci passano i `postgres_changes` di
-- `games` e `game_events`, cioè le mosse e gli eventi della partita a distanza. Il client non
-- ricalcola mai l'esito di una mossa — aspetta lo stato nuovo dal canale — quindi una policy troppo
-- stretta non toglie la presenza, toglie la partita: due schermate che restano ferme.
--
-- `realtime.messages` ha già la RLS attiva (Supabase Realtime Authorization: non serve un
-- `alter table ... enable row level security`). Il topic del canale è `room:<id>` — lo stesso che
-- costruisce `src/features/presence/use-room-realtime.ts` — e `public.current_room_id()` (helper
-- RLS, `security definer`, già concesso ad `authenticated`) dice in che stanza sta chi chiede.
-- Sono le due cose che la policy confronta: nessun dato che il client non abbia (l'id del
-- giocatore non serve, `auth.uid()` lo legge il database).
--
-- Per tornare indietro: `drop policy "realtime: la propria stanza (ascolto)" on realtime.messages;`
-- e `drop policy "realtime: la propria stanza (invio)" on realtime.messages;`, più `private: false`
-- nel client. Su un progetto ospitato serve anche che sia spento l'interruttore «Allow public
-- access» di Realtime Settings (impostazione del dashboard, non una migrazione: come l'accesso
-- anonimo, docs/local-testing.md).

create policy "realtime: la propria stanza (ascolto)"
  on realtime.messages
  for select to authenticated
  using ((select realtime.topic()) = 'room:' || public.current_room_id()::text);

-- L'invio serve alla presenza (`channel.track`). Si lasciano passare anche i messaggi `broadcast`:
-- il client oggi non ne manda, e riceverne uno non cambia niente (la UI non ha nessun gestore
-- `broadcast`, i dati di gioco arrivano dai `postgres_changes` filtrati dalla RLS delle tabelle).
-- Se un giorno servisse più stretto, la riga da togliere è `'broadcast'`.
create policy "realtime: la propria stanza (invio)"
  on realtime.messages
  for insert to authenticated
  with check (
    (select realtime.topic()) = 'room:' || public.current_room_id()::text
    and realtime.messages.extension in ('presence', 'broadcast')
  );
