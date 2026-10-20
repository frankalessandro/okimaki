-- M5 / T1: el código que ve el cliente pasa a ser solo la clave aleatoria, ahora de 8 caracteres: K3QX9P2M.
-- Sin el consecutivo adelante es más fácil de dictar y de escribir; 31^8 ≈ 852 mil millones de combinaciones
-- siguen siendo imposibles de adivinar, así que no hace falta límite de intentos.
-- El consecutivo (reservations.code) no cambia: lo usa el antifraude (ver 0006: ya no sale en ninguna respuesta).
-- Las reservas que ya tienen clave de 6 caracteres la conservan, y su código largo anterior (OKIMAKI-000007-K3QX9P)
-- se sigue aceptando, para que los códigos guardados o compartidos no se rompan.

-- Mismo alfabeto sin 0/O/1/I/L (31 símbolos), ahora 8 posiciones (un UUID v4 trae 16 bytes aleatorios).
create or replace function public.clave_acceso() returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (get_byte(b, i) % 31) + 1, 1), '' order by i)
  from (select decode(replace(gen_random_uuid()::text, '-', ''), 'hex') as b) x, generate_series(0, 7) i
$$;

alter table public.reservations alter column access_key set default public.clave_acceso();

-- La clave ahora identifica la reserva por sí sola: tiene que ser única.
create unique index reservations_access_key_key on public.reservations (access_key);

create or replace function public.codigo_publico(r public.reservations) returns text
language sql immutable set search_path = '' as $$
  select r.access_key
$$;

-- Acepta minúsculas, espacios y guiones, y el formato anterior (consecutivo + clave) quitando el consecutivo.
create or replace function public.reserva_por_codigo(p_codigo text) returns uuid
language sql stable security definer set search_path = '' as $$
  select r.id from public.reservations r
  where r.access_key = regexp_replace(
    regexp_replace(upper(btrim(coalesce(p_codigo, ''))), '^[A-Z]+-[0-9]+-', ''),
    '[^A-Z0-9]', '', 'g')
$$;
revoke execute on function public.reserva_por_codigo(text) from public, anon, authenticated;
