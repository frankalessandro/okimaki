-- Reversa de 0005_codigo_publico_corto: vuelve al código público consecutivo + clave (OKIMAKI-000007-K3QX9P).
-- Las claves de 8 caracteres ya emitidas se conservan y siguen funcionando dentro del formato largo; solo las nuevas vuelven a tener 6.
create or replace function public.reserva_por_codigo(p_codigo text) returns uuid
language sql stable security definer set search_path = '' as $$
  select r.id from public.reservations r
  where r.code || '-' || r.access_key = upper(btrim(coalesce(p_codigo, '')))
$$;
revoke execute on function public.reserva_por_codigo(text) from public, anon, authenticated;

create or replace function public.codigo_publico(r public.reservations) returns text
language sql immutable set search_path = '' as $$
  select r.code || '-' || r.access_key
$$;

drop index public.reservations_access_key_key;

create or replace function public.clave_acceso() returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (get_byte(b, i) % 31) + 1, 1), '' order by i)
  from (select decode(replace(gen_random_uuid()::text, '-', ''), 'hex') as b) x, generate_series(0, 5) i
$$;
