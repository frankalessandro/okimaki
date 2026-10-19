-- pgTAP: cupos, estados y permisos de las RPC de reserva.
begin;
select plan(11);

-- Tanda de prueba propia, de 5 cupos, mañana.
insert into public.service_types (id, name, price, duration_minutes, capacity, slot_times)
values ('00000000-0000-0000-0000-0000000000a1', 'Prueba', 10000, 60, 5, '{}');
insert into public.service_slots (id, service_type_id, slot_date, start_time, capacity)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
        public.fecha_local() + 1, '23:30', 5); -- hora que el seed no usa

create temp table creada on commit drop as
select public.create_reservation('00000000-0000-0000-0000-0000000000b1', 'Ana', 'Pérez', '300 111 2222', 3, false, true) as r;
grant select on creada to anon;

set local role anon;

select is(
  (select r ->> 'total' from creada),
  '30000', 'el total sale del precio de la tanda por personas');

select throws_ok(
  $$ select public.create_reservation('00000000-0000-0000-0000-0000000000b1', 'Luis', 'Gómez', '300 333 4444', 3, false, true) $$,
  'Solo quedan 2 cupo(s) en esa tanda.', 'no se puede pasar del cupo');

select throws_ok(
  $$ select public.create_reservation('00000000-0000-0000-0000-0000000000b1', 'Luis', 'Gómez', '300 333 4444', 1, false, false) $$,
  'Debes aceptar los términos y condiciones para reservar.', 'exige aceptar términos');

select throws_ok(
  $$ select public.create_reservation('00000000-0000-0000-0000-0000000000b1', 'Luis', 'Gómez', '12345', 1, false, true) $$,
  'Celular inválido: usa 10 dígitos que empiecen por 3.', 'rechaza celulares inválidos');

select is(
  (select remaining from public.get_availability(public.fecha_local() + 1, public.fecha_local() + 1)
   where slot_id = '00000000-0000-0000-0000-0000000000b1'),
  2, 'la disponibilidad descuenta lo apartado');

select is(
  (public.report_payment((select r ->> 'code' from creada))) ->> 'status',
  'payment_reported', 'reportar el pago pasa la reserva a pago reportado');

select throws_ok(
  $$ select public.get_my_reservation('OKIMAKI-000001', 'nadie') $$,
  'No encontramos una reserva con esos datos.', 'Mi reserva exige coincidencia');

select throws_ok(
  $$ select public.verify_payment('00000000-0000-0000-0000-000000000000', 'REF') $$,
  'No autorizado.', 'anon no puede verificar pagos');

select throws_ok($$ select 1 from public.reservations $$, '42501', null, 'anon no lee reservations');

reset role;

select throws_ok($$ delete from public.reservations $$, null, 'las reservas no se borran');

-- Un pago reportado sin verificar a tiempo vuelve a apartada.
update public.reservations set hold_expires_at = now() - interval '1 minute' where status = 'payment_reported';
select public.expire_holds();
select is((select status::text from public.reservations where slot_id = '00000000-0000-0000-0000-0000000000b1'), 'held', 'expire_holds devuelve el pago reportado vencido a apartada');

select * from finish();
rollback;
