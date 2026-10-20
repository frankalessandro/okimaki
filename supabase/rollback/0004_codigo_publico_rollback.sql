-- Reversa de 0004_codigo_publico: vuelve a "código + apellido o celular" y al payload sin código público.
-- Ojo: report_payment vuelve a aceptar solo el consecutivo (el hueco que 0004 cerró).
drop function public.get_my_reservation(text);

create function public.get_my_reservation(p_code text, p_identifier text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_ident text := btrim(coalesce(p_identifier, ''));
  v_phone text;
  v_id uuid;
begin
  begin v_phone := public.normalizar_celular(v_ident);
  exception when others then v_phone := null; end;

  select r.id into v_id
  from public.reservations r
  join public.customers c on c.id = r.customer_id
  where r.code = upper(btrim(coalesce(p_code, '')))
    and v_ident <> ''
    and (lower(r.last_name) = lower(v_ident) or c.phone = v_phone);
  if v_id is null then raise exception 'No encontramos una reserva con esos datos.'; end if;
  return public.reservation_payload(v_id);
end $$;
grant execute on function public.get_my_reservation(text, text) to anon, authenticated;

create or replace function public.report_payment(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cfg public.settings;
  r public.reservations;
  v_slot uuid;
begin
  select * into cfg from public.settings;
  select slot_id into v_slot from public.reservations where code = upper(btrim(p_code));
  if not found then raise exception 'No encontramos esa reserva.'; end if;

  perform 1 from public.service_slots where id = v_slot for update;
  select * into r from public.reservations where code = upper(btrim(p_code)) for update;

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

create or replace function public.reservation_payload(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', r.code, 'status', r.status,
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

drop function public.reserva_por_codigo(text);
drop function public.codigo_publico(public.reservations);
alter table public.reservations drop column access_key;
drop function public.clave_acceso();
