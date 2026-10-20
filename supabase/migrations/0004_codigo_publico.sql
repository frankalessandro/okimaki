-- M5 / T1: el cliente consulta su reserva solo con el código (cambio de la regla 18, confirmado por el dueño del proyecto).
-- Para que eso sea seguro, el código que ve el cliente no se puede adivinar:
--   código público = consecutivo + clave aleatoria → OKIMAKI-000007-K3QX9P
-- El consecutivo (reservations.code) se conserva tal cual: lo usa el control antifraude y el panel.
-- De paso, report_payment deja de aceptar solo el consecutivo (cualquiera podía reportar el pago de otra reserva).

-- 6 caracteres de un alfabeto sin 0/O/1/I/L (31 símbolos ≈ 887 millones de combinaciones por reserva).
-- gen_random_uuid() usa el generador criptográfico de Postgres; los bytes 0–5 de un UUID v4 son aleatorios.
create function public.clave_acceso() returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (get_byte(b, i) % 31) + 1, 1), '' order by i)
  from (select decode(replace(gen_random_uuid()::text, '-', ''), 'hex') as b) x, generate_series(0, 5) i
$$;

-- Default volátil: cada fila existente recibe su propia clave al agregar la columna.
alter table public.reservations add column access_key text not null default public.clave_acceso();

-- Código que ve el cliente; también se acepta en minúsculas y con espacios alrededor.
create function public.codigo_publico(r public.reservations) returns text
language sql immutable set search_path = '' as $$
  select r.code || '-' || r.access_key
$$;

create function public.reserva_por_codigo(p_codigo text) returns uuid
language sql stable security definer set search_path = '' as $$
  select r.id from public.reservations r
  where r.code || '-' || r.access_key = upper(btrim(coalesce(p_codigo, '')))
$$;
revoke execute on function public.reserva_por_codigo(text) from public, anon, authenticated;

create or replace function public.reservation_payload(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', r.code, 'public_code', public.codigo_publico(r), 'status', r.status,
    'first_name', r.first_name, 'last_name', r.last_name,
    'party_size', r.party_size, 'price_per_person', r.price_per_person, 'total', r.total,
    'hold_expires_at', r.hold_expires_at, 'reported_at', r.reported_at,
    'is_birthday', r.is_birthday,
    'slot_date', s.slot_date, 'start_time', s.start_time, 'service_name', t.name,
    'duration_minutes', t.duration_minutes)
  || case when r.status in ('held', 'payment_reported') then jsonb_build_object(
       'payment', jsonb_build_object(
         'key', c.payment_key, 'holder', c.payment_key_holder, 'qr_path', c.qr_path,
         'whatsapp_number', c.whatsapp_number, 'whatsapp_template', c.whatsapp_template))
     else '{}'::jsonb end
  from public.reservations r
  join public.service_slots s on s.id = r.slot_id
  join public.service_types t on t.id = s.service_type_id
  cross join public.settings c
  where r.id = p_id
$$;

-- Reportar el pago exige el código público completo.
create or replace function public.report_payment(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cfg public.settings;
  r public.reservations;
  v_id uuid := public.reserva_por_codigo(p_code);
begin
  select * into cfg from public.settings;
  if v_id is null then raise exception 'No encontramos esa reserva.'; end if;

  perform 1 from public.service_slots where id = (select slot_id from public.reservations where id = v_id) for update;
  select * into r from public.reservations where id = v_id for update;

  if r.status = 'payment_reported' then return public.reservation_payload(r.id); end if;
  if r.status <> 'held' or r.hold_expires_at <= now() then
    raise exception 'La reserva venció o ya no admite reportar pago.';
  end if;

  update public.reservations
  set status = 'payment_reported', reported_at = now(),
      hold_expires_at = now() + make_interval(mins => cfg.reported_limit_minutes)
  where id = r.id;
  insert into public.payments (reservation_id, amount) values (r.id, r.total);

  return public.reservation_payload(r.id);
end $$;

-- Mi reserva: solo el código público. El mensaje es el mismo exista o no el consecutivo.
drop function public.get_my_reservation(text, text);

create function public.get_my_reservation(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_id uuid := public.reserva_por_codigo(p_code);
begin
  if v_id is null then raise exception 'No encontramos una reserva con ese código.'; end if;
  return public.reservation_payload(v_id);
end $$;

grant execute on function public.get_my_reservation(text) to anon, authenticated;
