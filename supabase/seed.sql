-- Datos de ejemplo para desarrollo local, tomados de las publicaciones de Instagram.
-- Los tipos de servicio reales (precios, tandas y cupos) siguen pendientes con el cliente.
-- weekdays: 0 = domingo … 6 = sábado.
insert into public.service_types (name, tagline, menu, highlights, price, duration_minutes, capacity, slot_times, weekdays) values
  ('All You Can Eat', '¡Come todo lo que quieras!',
   'Sushi japonés sin límites durante 90 minutos: rolls, nigiris y especiales de la casa navegando hasta tu mesa.',
   '{"Bebidas de la casa ilimitadas","90 minutos de sushi sin límite","Rolls y nigiris de la barra"}',
   99000, 90, 24, '{13:00,15:00,17:00,19:00}', '{2}'),
  ('Platos de Colores', 'El menú lo eliges tú.',
   'Cada color es un precio: toma de la banda los platos que quieras y paga por los que elijas. Sabor y variedad.',
   '{"Tú armas tu menú","Platos por color","Ideal para probar de todo"}',
   20000, 90, 24, '{13:00,15:30,18:00,20:00}', '{3,4}'),
  ('Experiencia Mística Okimaki 369', 'Gastronomía, sentidos y magia.',
   'Una experiencia diferente donde la cocina fusión asiática, los sentidos y la magia se encuentran. Barcas, luces y un recorrido que navega hasta ti.',
   '{"Experiencia sensorial","Menú de autor","Cupos limitados"}',
   140000, 120, 16, '{13:00,16:00,19:30}', '{5,6,0}');

select public.generate_slots(90);
