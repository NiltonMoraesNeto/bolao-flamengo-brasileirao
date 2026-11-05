-- Permite cadastrar palpites faltantes mesmo depois do resultado.
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
    select id into participant from public.participants where season_id = p_season and nome = item->>'usuario';
    if not found then raise exception 'Unknown participant'; end if;
    select to_jsonb(p) into previous from public.predictions p
      where p.season_id = p_season and p.game_id = game.id and p.participant_id = participant;
    if previous is not null and (
      game.data <= clock_timestamp() or exists (
        select 1 from public.results where season_id = p_season and game_id = game.id
      )
    ) then
      if (previous->>'gols_casa')::integer = (item->>'golsCasa')::integer
        and (previous->>'gols_fora')::integer = (item->>'golsFora')::integer then
        output := output || jsonb_build_array(previous);
        continue;
      end if;
      raise exception 'Predictions are closed';
    end if;
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

commit;
