-- Reversa de 0002_menu_tipo_servicio: vuelve a la firma original de get_availability y quita las columnas.
drop function public.get_availability(date, date);

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

grant execute on function public.get_availability(date, date) to anon, authenticated;

alter table public.service_types
  drop column highlights,
  drop column menu,
  drop column tagline;
