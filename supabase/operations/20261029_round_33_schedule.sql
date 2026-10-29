-- Executar no SQL Editor do projeto já importado.
-- Idempotente: repetir não duplica a auditoria.
begin;

do $$
declare
  game_id text;
  previous_date timestamptz;
  admin_id uuid;
  corrected_date timestamptz := '2026-10-29 20:00:00-03'::timestamptz;
begin
  select id, data into strict game_id, previous_date
  from public.games
  where season_id = 2026 and rodada = 33
    and time_casa = 'Vasco da Gama' and time_fora = 'Flamengo'
  for update;

  if previous_date is distinct from corrected_date then
    select user_id into strict admin_id from public.admins;
    update public.games set data = corrected_date
    where season_id = 2026 and id = game_id;

    insert into public.audit_events (admin_id, season_id, action, details)
    values (admin_id, 2026, 'game.rescheduled', jsonb_build_object(
      'gameId', game_id,
      'before', jsonb_build_object('data', previous_date),
      'after', jsonb_build_object('data', corrected_date),
      'reason', 'Rodada 33: horário corrigido pelo organizador para 29/10/2026 às 20h de Brasília.'
    ));
  end if;
end $$;

commit;

select rodada, time_casa, time_fora,
  data at time zone 'America/Sao_Paulo' as horario_brasilia
from public.games
where season_id = 2026 and rodada = 33
  and time_casa = 'Vasco da Gama' and time_fora = 'Flamengo';
