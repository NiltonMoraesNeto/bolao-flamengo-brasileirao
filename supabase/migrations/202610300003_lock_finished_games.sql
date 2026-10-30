-- Regra de 30/10/2026: palpites somente antes do início; resultado final definitivo.
-- Justificativas antigas não destravam jogos. Não altera registros existentes.
begin;

create or replace function public.save_predictions(p_season integer, p_rows jsonb, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  item jsonb; participant text; game public.games; previous jsonb; saved public.predictions;
  output jsonb := '[]'::jsonb; seen text[] := '{}'; item_key text;
begin
  if not public.is_bolao_admin() then raise insufficient_privilege; end if;
  if p_reason is not null and length(trim(p_reason)) not between 8 and 500 then
    raise exception 'Invalid correction reason';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) not between 1 and 200 then
    raise exception 'Invalid batch';
  end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    if not (item ?& array['usuario', 'jogoId', 'golsCasa', 'golsFora'])
      or jsonb_typeof(item->'golsCasa') <> 'number' or jsonb_typeof(item->'golsFora') <> 'number'
      or (item->>'golsCasa') !~ '^[0-9]{1,2}$' or (item->>'golsFora') !~ '^[0-9]{1,2}$' then
      raise exception 'Invalid score';
    end if;
    item_key := jsonb_build_array(item->>'jogoId', item->>'usuario')::text;
    if item_key = any(seen) then raise exception 'Duplicate prediction in batch'; end if;
    seen := array_append(seen, item_key);
    select * into game from public.games where season_id = p_season and id = item->>'jogoId' for update;
    if not found then raise exception 'Unknown game'; end if;
    if game.data <= clock_timestamp() or exists (select 1 from public.results where season_id = p_season and game_id = game.id) then raise exception 'Predictions are closed'; end if;
    select id into participant from public.participants where season_id = p_season and nome = item->>'usuario';
    if not found then raise exception 'Unknown participant'; end if;
    select to_jsonb(p) into previous from public.predictions p
      where p.season_id = p_season and p.game_id = game.id and p.participant_id = participant;
    insert into public.predictions (season_id, game_id, participant_id, gols_casa, gols_fora)
      values (p_season, game.id, participant, (item->>'golsCasa')::integer, (item->>'golsFora')::integer)
      on conflict (season_id, game_id, participant_id) do update
      set gols_casa = excluded.gols_casa, gols_fora = excluded.gols_fora returning * into saved;
    insert into public.audit_events (admin_id, season_id, action, details)
      values (auth.uid(), p_season, 'prediction.saved', jsonb_build_object('before', previous, 'after', to_jsonb(saved), 'reason', p_reason));
    output := output || jsonb_build_array(to_jsonb(saved));
  end loop;
  return output;
end $$;

create or replace function public.save_result(p_season integer, p_game text, p_home integer, p_away integer, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare previous jsonb; kickoff timestamptz;
begin
  if not public.is_bolao_admin() then raise insufficient_privilege; end if;
  if p_reason is not null and length(trim(p_reason)) not between 8 and 500 then raise exception 'Invalid correction reason'; end if;
  if p_home is null or p_away is null or p_home not between 0 and 99 or p_away not between 0 and 99 then raise exception 'Invalid score'; end if;
  select data into kickoff from public.games where season_id = p_season and id = p_game for update;
  if not found then raise exception 'Unknown game'; end if;
  if kickoff > clock_timestamp() then raise exception 'Game has not started'; end if;
  select to_jsonb(r) into previous from public.results r where r.season_id = p_season and r.game_id = p_game;
  if previous is not null then raise exception 'Final result is immutable'; end if;
  insert into public.results (season_id, game_id, gols_casa, gols_fora) values (p_season, p_game, p_home, p_away);
  insert into public.audit_events (admin_id, season_id, action, details) values
    (auth.uid(), p_season, 'result.saved', jsonb_build_object('gameId', p_game, 'before', previous,
      'after', jsonb_build_object('golsCasa', p_home, 'golsFora', p_away), 'reason', p_reason));
end $$;

create or replace function public.delete_prediction(p_season integer, p_id text, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare previous public.predictions; kickoff timestamptz;
begin
  if not public.is_bolao_admin() then raise insufficient_privilege; end if;
  if p_reason is not null and length(trim(p_reason)) not between 8 and 500 then raise exception 'Invalid correction reason'; end if;
  select * into previous from public.predictions where season_id = p_season and id = p_id;
  if not found then raise exception 'Unknown prediction'; end if;
  select data into kickoff from public.games where season_id = p_season and id = previous.game_id for update;
  if kickoff <= clock_timestamp() or exists (select 1 from public.results where season_id = p_season and game_id = previous.game_id) then raise exception 'Predictions are closed'; end if;
  -- Mesma ordem de locks das outras RPCs: jogo antes de palpite.
  select * into previous from public.predictions where season_id = p_season and id = p_id for update;
  if not found then raise exception 'Unknown prediction'; end if;
  delete from public.predictions where id = p_id;
  insert into public.audit_events (admin_id, season_id, action, details) values
    (auth.uid(), p_season, 'prediction.deleted', jsonb_build_object('before', to_jsonb(previous), 'reason', p_reason));
end $$;

revoke all on function public.save_predictions(integer, jsonb, text), public.save_result(integer, text, integer, integer, text), public.delete_prediction(integer, text, text) from public, anon;
grant execute on function public.save_predictions(integer, jsonb, text), public.save_result(integer, text, integer, integer, text), public.delete_prediction(integer, text, text) to authenticated;

commit;
