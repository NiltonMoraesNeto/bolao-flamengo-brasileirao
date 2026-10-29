begin;

create table public.login_rate_limits (
  bucket text primary key check (bucket ~ '^[a-f0-9]{64}$'),
  attempts integer not null check (attempts between 1 and 11),
  expires_at timestamptz not null
);
create index login_rate_limits_expiry on public.login_rate_limits (expires_at);
alter table public.login_rate_limits enable row level security;
revoke all on public.login_rate_limits from public, anon, authenticated;

-- Única operação pública: consumir uma tentativa. Não permite ler, apagar,
-- reiniciar ou escolher os limites. Hashes vencidos são removidos automaticamente.
create function public.consume_login_attempt(p_key text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_time timestamptz := clock_timestamp();
  attempt_count integer;
  expiry timestamptz;
begin
  if p_key is null or p_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid login bucket' using errcode = '22023';
  end if;

  delete from public.login_rate_limits where expires_at <= attempt_time;
  insert into public.login_rate_limits (bucket, attempts, expires_at)
    values (p_key, 1, attempt_time + interval '15 minutes')
    on conflict (bucket) do update
      set attempts = least(public.login_rate_limits.attempts + 1, 11)
    returning attempts, expires_at into attempt_count, expiry;

  if attempt_count > 10 then
    return greatest(1, ceil(extract(epoch from (expiry - attempt_time)))::integer);
  end if;
  return 0;
end;
$$;
revoke all on function public.consume_login_attempt(text) from public;
grant execute on function public.consume_login_attempt(text) to anon, authenticated;

commit;
