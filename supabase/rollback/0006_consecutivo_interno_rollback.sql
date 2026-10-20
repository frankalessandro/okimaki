-- Reversa de 0006_consecutivo_interno: el payload vuelve a incluir el consecutivo ('code').
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
