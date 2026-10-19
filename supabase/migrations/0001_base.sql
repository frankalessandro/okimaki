-- 0001_base: esquema mínimo para arrancar (reservas, pagos manuales, panel con un rol).
-- Reversa: supabase/rollback/0001_base_rollback.sql

-- Nada queda abierto por defecto: cada grant es explícito.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

create type public.staff_role as enum ('host', 'admin', 'owner'); -- el orden define la jerarquía
create type public.reservation_status as enum
  ('held', 'payment_reported', 'confirmed', 'attended', 'expired', 'cancelled', 'no_show');
create type public.payment_status as enum ('reported', 'verified', 'rejected');

-- ---------------------------------------------------------------- utilidades

create function public.fecha_local() returns date
language sql stable set search_path = '' as
$$ select (now() at time zone 'America/Bogota')::date $$;

create function public.normalizar_celular(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if length(d) = 12 and left(d, 2) = '57' then d := substr(d, 3); end if;
  if length(d) = 10 and left(d, 1) = '3' then return '+57' || d; end if;
  raise exception 'Celular inválido: usa 10 dígitos que empiecen por 3.';
end $$;

-- ---------------------------------------------------------------- tablas

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  restaurant_name text not null default 'Okimaki369',
  whatsapp_number text not null default '57300000000',
  payment_key text not null default 'LLAVE-POR-CONFIGURAR',
  payment_key_holder text not null default 'Okimaki369',
  qr_path text,
  whatsapp_template text not null default
    'Hola, soy {nombre}. Envío el comprobante de mi reserva {codigo} para el {fecha} a las {hora} ({personas} personas) por {total}.',
  terms text not null default 'Términos y condiciones por definir.',
  cancellation_policy text not null default 'Política de cancelación por definir.',
  hold_minutes int not null default 60 check (hold_minutes > 0),
  reported_limit_minutes int not null default 180 check (reported_limit_minutes > 0),
  booking_window_days int not null default 90 check (booking_window_days > 0),
  min_advance_hours int not null default 0 check (min_advance_hours >= 0),
  max_reservations_per_day int not null default 3 check (max_reservations_per_day > 0),
  cancel_hours int not null default 24 check (cancel_hours >= 0)
);
insert into public.settings default values;

create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null check (price >= 0),
  duration_minutes int not null check (duration_minutes > 0),
  capacity int not null check (capacity > 0),
  slot_times time[] not null,
  weekdays smallint[] not null default '{0,1,2,3,4,5,6}',
  active boolean not null default true
);

create table public.service_slots (
  id uuid primary key default gen_random_uuid(),
  service_type_id uuid not null references public.service_types (id),
  slot_date date not null,
  start_time time not null,
  capacity int not null check (capacity > 0),
  closed boolean not null default false,
  unique (slot_date, start_time)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  first_name text not null,
  last_name text not null,
  created_at timestamptz not null default now()
);

create sequence public.reservation_code_seq;

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    default 'OKIMAKI-' || lpad(nextval('public.reservation_code_seq')::text, 6, '0'),
  slot_id uuid not null references public.service_slots (id),
  customer_id uuid not null references public.customers (id),
  first_name text not null,
  last_name text not null,
  party_size int not null check (party_size > 0),
  price_per_person integer not null check (price_per_person >= 0),
  total integer not null check (total >= 0),
  status public.reservation_status not null default 'held',
  hold_expires_at timestamptz, -- plazo vigente: de pago (held) o de verificación (payment_reported)
  reported_at timestamptz,
  is_birthday boolean not null default false,
  allergies text,
  internal_note text,
  cancel_reason text,
  cancelled_by uuid references auth.users (id),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.reservations (slot_id);
create index on public.reservations (customer_id);
create index on public.reservations (status);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id),
  amount integer not null check (amount >= 0),
  status public.payment_status not null default 'reported',
  reference text,
  reported_at timestamptz not null default now(),
  verified_by uuid references auth.users (id),
  verified_at timestamptz,
  reject_reason text
);
create index on public.payments (reservation_id);

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.staff_role not null default 'admin',
  active boolean not null default true
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  table_name text not null,
  row_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor uuid
);

-- ---------------------------------------------------------------- roles y bitácora

create function public.has_role(min_role public.staff_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid() and s.active and s.role >= min_role)
$$;

create function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (table_name, row_id, action, old_data, new_data, actor)
  values (
    tg_table_name,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id', to_jsonb(new) ->> 'user_id', to_jsonb(old) ->> 'user_id'),
    tg_op,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end,
    auth.uid());
  return null;
end $$;

create function public.bloquear_borrado() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Los registros no se borran ni se editan en %: se anulan con motivo.', tg_table_name;
end $$;

create trigger audit after insert or update or delete on public.settings
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.service_types
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.service_slots
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.reservations
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.payments
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.staff
  for each row execute function public.audit_trigger();

create trigger sin_borrado before delete on public.reservations
  for each row execute function public.bloquear_borrado();
create trigger sin_borrado before delete on public.payments
  for each row execute function public.bloquear_borrado();
create trigger sin_borrado before delete on public.customers
  for each row execute function public.bloquear_borrado();
create trigger append_only before update or delete on public.audit_log
  for each row execute function public.bloquear_borrado();

-- ---------------------------------------------------------------- disponibilidad

create view public.slot_availability with (security_invoker = true) as
select *, greatest(capacity - taken, 0) as remaining
from (
  select
    s.id as slot_id, s.service_type_id, s.slot_date, s.start_time, s.capacity, s.closed,
    coalesce(sum(r.party_size) filter (
      where r.status in ('payment_reported', 'confirmed', 'attended')
         or (r.status = 'held' and r.hold_expires_at > now())), 0)::int as taken
  from public.service_slots s
  left join public.reservations r on r.slot_id = s.id
  group by s.id
) t;

-- ---------------------------------------------------------------- RLS

alter table public.settings enable row level security;
alter table public.service_types enable row level security;
alter table public.service_slots enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.payments enable row level security;
alter table public.staff enable row level security;
alter table public.audit_log enable row level security;

-- Solo lectura para el personal; toda escritura pasa por RPC (security definer).
create policy leer on public.settings for select to authenticated using (public.has_role('admin'));
create policy leer on public.service_types for select to authenticated using (public.has_role('host'));
create policy leer on public.service_slots for select to authenticated using (public.has_role('host'));
create policy leer on public.customers for select to authenticated using (public.has_role('admin'));
create policy leer on public.reservations for select to authenticated using (public.has_role('host'));
create policy leer on public.payments for select to authenticated using (public.has_role('admin'));
create policy leer on public.audit_log for select to authenticated using (public.has_role('admin'));
create policy leer on public.staff for select to authenticated
  using (user_id = auth.uid() or public.has_role('owner'));

grant select on public.settings, public.service_types, public.service_slots, public.customers,
  public.reservations, public.payments, public.audit_log, public.staff,
  public.slot_availability to authenticated;
grant execute on function public.has_role(public.staff_role) to authenticated;

-- ---------------------------------------------------------------- RPC públicas

create function public.reservation_payload(p_id uuid) returns jsonb
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

create function public.get_public_settings() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'restaurant_name', restaurant_name, 'terms', terms, 'cancellation_policy', cancellation_policy,
    'hold_minutes', hold_minutes, 'booking_window_days', booking_window_days)
  from public.settings
$$;

create function public.get_availability(p_from date, p_to date)
returns table (
  slot_id uuid, slot_date date, start_time time, service_name text, price integer,
  duration_minutes int, capacity int, remaining int)
language sql stable security definer set search_path = '' as $$
  select a.slot_id, a.slot_date, a.start_time, t.name, t.price, t.duration_minutes, a.capacity, a.remaining
  from public.slot_availability a
  join public.service_types t on t.id = a.service_type_id
  cross join public.settings c
  where not a.closed
    and a.slot_date between greatest(p_from, public.fecha_local())
                        and least(p_to, public.fecha_local() + c.booking_window_days)
    and (a.slot_date + a.start_time) >=
        ((now() at time zone 'America/Bogota') + make_interval(hours => c.min_advance_hours))
  order by a.slot_date, a.start_time
$$;

create function public.create_reservation(
  p_slot_id uuid, p_first_name text, p_last_name text, p_phone text, p_party_size int,
  p_is_birthday boolean default false, p_terms_accepted boolean default false,
  p_allergies text default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cfg public.settings;
  slot public.service_slots;
  v_first text := left(btrim(coalesce(p_first_name, '')), 80);
  v_last text := left(btrim(coalesce(p_last_name, '')), 80);
  v_phone text;
  v_customer uuid;
  v_remaining int;
  v_price integer;
  v_active int;
  v_id uuid;
begin
  select * into cfg from public.settings;
  if not coalesce(p_terms_accepted, false) then
    raise exception 'Debes aceptar los términos y condiciones para reservar.';
  end if;
  if v_first = '' or v_last = '' then raise exception 'Faltan el nombre y el apellido.'; end if;
  if coalesce(p_party_size, 0) < 1 then raise exception 'Número de personas inválido.'; end if;
  v_phone := public.normalizar_celular(p_phone);

  select * into slot from public.service_slots where id = p_slot_id for update;
  if not found or slot.closed then raise exception 'Esa tanda no está disponible.'; end if;
  if slot.slot_date < public.fecha_local()
     or slot.slot_date > public.fecha_local() + cfg.booking_window_days
     or (slot.slot_date + slot.start_time) <
        ((now() at time zone 'America/Bogota') + make_interval(hours => cfg.min_advance_hours)) then
    raise exception 'Esa tanda ya no admite reservas.';
  end if;

  select remaining into v_remaining from public.slot_availability where slot_id = p_slot_id;
  if p_party_size > v_remaining then
    raise exception 'Solo quedan % cupo(s) en esa tanda.', v_remaining;
  end if;

  insert into public.customers (phone, first_name, last_name)
  values (v_phone, v_first, v_last)
  on conflict (phone) do update set first_name = excluded.first_name, last_name = excluded.last_name
  returning id into v_customer;

  -- Máximo de reservas por celular para el mismo día de servicio.
  select count(*) into v_active
  from public.reservations r
  join public.service_slots s on s.id = r.slot_id
  where r.customer_id = v_customer and s.slot_date = slot.slot_date
    and r.status in ('held', 'payment_reported', 'confirmed', 'attended');
  if v_active >= cfg.max_reservations_per_day then
    raise exception 'Este celular ya alcanzó el máximo de % reservas para ese día.', cfg.max_reservations_per_day;
  end if;

  select price into v_price from public.service_types where id = slot.service_type_id;

  insert into public.reservations (
    slot_id, customer_id, first_name, last_name, party_size, price_per_person, total,
    hold_expires_at, is_birthday, allergies)
  values (
    p_slot_id, v_customer, v_first, v_last, p_party_size, v_price, v_price * p_party_size,
    now() + make_interval(mins => cfg.hold_minutes), coalesce(p_is_birthday, false),
    nullif(left(btrim(coalesce(p_allergies, '')), 300), ''))
  returning id into v_id;

  return public.reservation_payload(v_id);
end $$;

create function public.report_payment(p_code text) returns jsonb
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

-- Código + apellido o celular. El mensaje de error es el mismo si no coincide.
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

grant execute on function public.get_public_settings() to anon, authenticated;
grant execute on function public.get_availability(date, date) to anon, authenticated;
grant execute on function public.create_reservation(uuid, text, text, text, int, boolean, boolean, text)
  to anon, authenticated;
grant execute on function public.report_payment(text) to anon, authenticated;
grant execute on function public.get_my_reservation(text, text) to anon, authenticated;

-- ---------------------------------------------------------------- RPC del panel (admin)

create function public.verify_payment(p_reservation_id uuid, p_reference text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_ref text := btrim(coalesce(p_reference, ''));
begin
  if not public.has_role('admin') then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if v_ref = '' then raise exception 'La referencia de la transferencia es obligatoria.'; end if;

  perform 1 from public.service_slots
  where id = (select slot_id from public.reservations where id = p_reservation_id) for update;
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found or r.status <> 'payment_reported' then
    raise exception 'La reserva no tiene un pago reportado por verificar.';
  end if;

  update public.payments
  set status = 'verified', reference = v_ref, verified_by = auth.uid(), verified_at = now()
  where reservation_id = r.id and status = 'reported';
  update public.reservations set status = 'confirmed', hold_expires_at = null where id = r.id;
  return public.reservation_payload(r.id);
end $$;

create function public.reject_payment(p_reservation_id uuid, p_reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cfg public.settings;
  r public.reservations;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.has_role('admin') then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if v_reason = '' then raise exception 'El motivo del rechazo es obligatorio.'; end if;
  select * into cfg from public.settings;

  perform 1 from public.service_slots
  where id = (select slot_id from public.reservations where id = p_reservation_id) for update;
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found or r.status <> 'payment_reported' then
    raise exception 'La reserva no tiene un pago reportado por verificar.';
  end if;

  update public.payments set status = 'rejected', reject_reason = v_reason
  where reservation_id = r.id and status = 'reported';
  update public.reservations
  set status = 'held', hold_expires_at = now() + make_interval(mins => cfg.hold_minutes)
  where id = r.id;
  return public.reservation_payload(r.id);
end $$;

create function public.cancel_reservation(p_reservation_id uuid, p_reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.has_role('admin') then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if v_reason = '' then raise exception 'El motivo de la cancelación es obligatorio.'; end if;

  perform 1 from public.service_slots
  where id = (select slot_id from public.reservations where id = p_reservation_id) for update;
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found or r.status not in ('held', 'payment_reported', 'confirmed') then
    raise exception 'Esa reserva no se puede cancelar.';
  end if;

  update public.payments set status = 'rejected', reject_reason = 'Reserva cancelada: ' || v_reason
  where reservation_id = r.id and status = 'reported';
  update public.reservations
  set status = 'cancelled', cancel_reason = v_reason, cancelled_by = auth.uid(),
      cancelled_at = now(), hold_expires_at = null
  where id = r.id;
  return public.reservation_payload(r.id);
end $$;

grant execute on function public.verify_payment(uuid, text) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
grant execute on function public.cancel_reservation(uuid, text) to authenticated;

-- ---------------------------------------------------------------- tareas programadas

create function public.expire_holds() returns void
language plpgsql security definer set search_path = '' as $$
declare cfg public.settings;
begin
  select * into cfg from public.settings;
  update public.reservations set status = 'expired', hold_expires_at = null
  where status = 'held' and hold_expires_at <= now();

  with late as (
    update public.reservations
    set status = 'held', hold_expires_at = now() + make_interval(mins => cfg.hold_minutes)
    where status = 'payment_reported' and hold_expires_at <= now()
    returning id)
  update public.payments set status = 'rejected', reject_reason = 'Sin verificar a tiempo'
  where status = 'reported' and reservation_id in (select id from late);
end $$;

create function public.generate_slots(p_days int default 90) returns int
language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  insert into public.service_slots (service_type_id, slot_date, start_time, capacity)
  select st.id, d::date, t, st.capacity
  from public.service_types st
  cross join generate_series(public.fecha_local(), public.fecha_local() + p_days, interval '1 day') d
  cross join unnest(st.slot_times) t
  where st.active and extract(dow from d)::int = any (st.weekdays)
  on conflict (slot_date, start_time) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

grant execute on function public.expire_holds() to service_role;
grant execute on function public.generate_slots(int) to service_role;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('expire-holds', '* * * * *', 'select public.expire_holds()');
select cron.schedule('generate-slots', '0 8 * * *', 'select public.generate_slots(90)'); -- 03:00 Bogotá
