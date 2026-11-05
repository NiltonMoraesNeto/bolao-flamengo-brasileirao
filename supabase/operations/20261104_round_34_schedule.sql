-- Executar no SQL Editor do projeto já importado.
-- Idempotente: repetir não duplica a auditoria.
begin;

do $$
declare
  target_game_id text;
  previous_date timestamptz;
  admin_id uuid;
  corrected_date timestamptz := '2026-11-04 19:30:00-03'::timestamptz;
begin
  select id, data into strict target_game_id, previous_date
  from public.games
  where season_id = 2026 and rodada = 34
    and time_casa = 'Flamengo' and time_fora = 'Grêmio'
  for update;

  if exists (
    select 1 from public.results r
    where r.season_id = 2026 and r.game_id = target_game_id
  ) then
    raise exception 'Jogo com resultado final não pode ser reagendado';
  end if;

  if previous_date is distinct from corrected_date then
    select user_id into strict admin_id from public.admins;
    update public.games set data = corrected_date
    where season_id = 2026 and id = target_game_id;

    insert into public.audit_events (admin_id, season_id, action, details)
    values (admin_id, 2026, 'game.rescheduled', jsonb_build_object(
      'gameId', target_game_id,
      'before', jsonb_build_object('data', previous_date),
      'after', jsonb_build_object('data', corrected_date),
      'reason', 'Rodada 34: horário corrigido pelo organizador para 04/11/2026 às 19h30 de Brasília.'
    ));
  end if;
end $$;

commit;

select rodada, time_casa, time_fora,
  data at time zone 'America/Sao_Paulo' as horario_brasilia
from public.games
where season_id = 2026 and rodada = 34
  and time_casa = 'Flamengo' and time_fora = 'Grêmio';
