-- Datos de ejemplo para desarrollo local. Los tipos de servicio reales siguen pendientes con el cliente.
insert into public.service_types (name, price, duration_minutes, capacity, slot_times) values
  ('Sushi flotante', 15000, 90, 10, '{12:00,15:00,18:00}');

select public.generate_slots(90);
