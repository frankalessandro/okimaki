-- M2/M3: cada tipo de servicio (o evento) muestra al cliente su frase, su menú y lo que incluye.
alter table public.service_types
  add column tagline text not null default '',
  add column menu text not null default '',
  add column highlights text[] not null default '{}';

-- Cambia el tipo de retorno: hay que recrearla.
drop function public.get_availability(date, date);

create function public.get_availability(p_from date, p_to date)
returns table (
  slot_id uuid, slot_date date, start_time time, service_type_id uuid, service_name text,
  tagline text, menu text, highlights text[], price integer, duration_minutes int,
  capacity int, remaining int)
language sql stable security definer set search_path = '' as $$
  select a.slot_id, a.slot_date, a.start_time, t.id, t.name, t.tagline, t.menu, t.highlights,
         t.price, t.duration_minutes, a.capacity, a.remaining
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

grant execute on function public.get_availability(date, date) to anon, authenticated;
