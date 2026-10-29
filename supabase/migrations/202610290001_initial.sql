begin;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check (singleton)
);
create table public.seasons (
  id integer primary key check (id between 2000 and 2100),
  scoring_version text not null default 'legacy-v1' check (scoring_version = 'legacy-v1')
);
create table public.participants (
  season_id integer not null references public.seasons(id), id text not null, nome text not null,
  primary key (season_id, id), unique (season_id, nome)
);
create table public.games (
  season_id integer not null references public.seasons(id), id text not null,
  rodada integer not null check (rodada > 0), data timestamptz not null,
  time_casa text not null, time_fora text not null,
  primary key (season_id, id)
);
create table public.results (
  season_id integer not null, game_id text not null,
  gols_casa integer not null check (gols_casa between 0 and 99),
  gols_fora integer not null check (gols_fora between 0 and 99),
  primary key (season_id, game_id),
  foreign key (season_id, game_id) references public.games(season_id, id)
);
create table public.predictions (
  id text primary key default gen_random_uuid()::text,
  season_id integer not null, game_id text not null, participant_id text not null,
  gols_casa integer not null check (gols_casa between 0 and 99),
  gols_fora integer not null check (gols_fora between 0 and 99),
  unique (season_id, game_id, participant_id),
  foreign key (season_id, game_id) references public.games(season_id, id),
  foreign key (season_id, participant_id) references public.participants(season_id, id)
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users(id), season_id integer not null references public.seasons(id),
  action text not null, details jsonb not null, created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
alter table public.seasons enable row level security;
alter table public.participants enable row level security;
alter table public.games enable row level security;
alter table public.results enable row level security;
alter table public.predictions enable row level security;
alter table public.audit_events enable row level security;

create policy own_admin on public.admins for select to authenticated using (user_id = (select auth.uid()));
create function public.is_bolao_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
create policy admin_read on public.seasons for select to authenticated using ((select public.is_bolao_admin()));
create policy admin_read on public.participants for select to authenticated using ((select public.is_bolao_admin()));
create policy admin_read on public.games for select to authenticated using ((select public.is_bolao_admin()));
create policy admin_read on public.results for select to authenticated using ((select public.is_bolao_admin()));
create policy admin_read on public.predictions for select to authenticated using ((select public.is_bolao_admin()));
create policy admin_read on public.audit_events for select to authenticated using ((select public.is_bolao_admin()));

-- Invoker preserva RLS também quando a leitura ocorre por uma view.
create view public.games_view with (security_invoker = true) as
select g.season_id, g.id, g.rodada, g.data, g.time_casa as "timeCasa", g.time_fora as "timeFora",
  case when r.game_id is null then null else r.gols_casa || 'x' || r.gols_fora end as placar,
  case when r.game_id is null then null
    when r.gols_casa = r.gols_fora then 'E'
    when (g.time_casa = 'Flamengo' and r.gols_casa > r.gols_fora)
      or (g.time_fora = 'Flamengo' and r.gols_fora > r.gols_casa) then 'V'
    else 'D' end as resultado
from public.games g left join public.results r on r.season_id = g.season_id and r.game_id = g.id;
create view public.predictions_view with (security_invoker = true) as
select p.id, p.season_id, p.game_id as "jogoId", u.nome as usuario,
  p.gols_casa as "golsCasa", p.gols_fora as "golsFora"
from public.predictions p join public.participants u on u.season_id = p.season_id and u.id = p.participant_id;
create view public.results_view with (security_invoker = true) as
select season_id, game_id as id, gols_casa as "golsCasa", gols_fora as "golsFora" from public.results;

create function public.save_predictions(p_season integer, p_rows jsonb, p_reason text default null)
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
    if game.data <= now() and p_reason is null then raise exception 'Correction reason required after kickoff'; end if;
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

create function public.save_result(p_season integer, p_game text, p_home integer, p_away integer, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare previous jsonb; kickoff timestamptz;
begin
  if not public.is_bolao_admin() then raise insufficient_privilege; end if;
  if p_reason is not null and length(trim(p_reason)) not between 8 and 500 then raise exception 'Invalid correction reason'; end if;
  if p_home is null or p_away is null or p_home not between 0 and 99 or p_away not between 0 and 99 then raise exception 'Invalid score'; end if;
  select data into kickoff from public.games where season_id = p_season and id = p_game for update;
  if not found then raise exception 'Unknown game'; end if;
  if kickoff > now() then raise exception 'Game has not started'; end if;
  select to_jsonb(r) into previous from public.results r where r.season_id = p_season and r.game_id = p_game;
  if previous is not null and p_reason is null then raise exception 'Correction reason required'; end if;
  insert into public.results (season_id, game_id, gols_casa, gols_fora) values (p_season, p_game, p_home, p_away)
    on conflict (season_id, game_id) do update set gols_casa = excluded.gols_casa, gols_fora = excluded.gols_fora;
  insert into public.audit_events (admin_id, season_id, action, details) values
    (auth.uid(), p_season, 'result.saved', jsonb_build_object('gameId', p_game, 'before', previous,
      'after', jsonb_build_object('golsCasa', p_home, 'golsFora', p_away), 'reason', p_reason));
end $$;

create function public.delete_prediction(p_season integer, p_id text, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare previous public.predictions; kickoff timestamptz;
begin
  if not public.is_bolao_admin() then raise insufficient_privilege; end if;
  if p_reason is not null and length(trim(p_reason)) not between 8 and 500 then raise exception 'Invalid correction reason'; end if;
  select * into previous from public.predictions where season_id = p_season and id = p_id for update;
  if not found then raise exception 'Unknown prediction'; end if;
  select data into kickoff from public.games where season_id = p_season and id = previous.game_id for update;
  if kickoff <= now() and p_reason is null then raise exception 'Correction reason required'; end if;
  delete from public.predictions where id = p_id;
  insert into public.audit_events (admin_id, season_id, action, details) values
    (auth.uid(), p_season, 'prediction.deleted', jsonb_build_object('before', to_jsonb(previous), 'reason', p_reason));
end $$;

-- A Data API não pode contornar validações fazendo escritas diretas.
revoke all on public.admins, public.seasons, public.participants, public.games, public.results,
  public.predictions, public.audit_events, public.games_view, public.predictions_view, public.results_view from anon, authenticated;
grant select on public.admins, public.seasons, public.participants, public.games, public.results,
  public.predictions, public.audit_events, public.games_view, public.predictions_view, public.results_view to authenticated;
revoke all on function public.is_bolao_admin(), public.save_predictions(integer, jsonb, text),
  public.save_result(integer, text, integer, integer, text), public.delete_prediction(integer, text, text) from public, anon;
grant execute on function public.is_bolao_admin(), public.save_predictions(integer, jsonb, text),
  public.save_result(integer, text, integer, integer, text), public.delete_prediction(integer, text, text) to authenticated;

commit;
