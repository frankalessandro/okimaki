-- pgTAP: cupos, estados y permisos de las RPC de reserva.
begin;
select plan(19);

-- Tanda de prueba propia, de 5 cupos, mañana.
insert into public.service_types (id, name, price, duration_minutes, capacity, slot_times)
values ('00000000-0000-0000-0000-0000000000a1', 'Prueba', 10000, 60, 5, '{}');
insert into public.service_slots (id, service_type_id, slot_date, start_time, capacity)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
        public.fecha_local() + 1, '23:30', 5); -- hora que el seed no usa

create temp table creada on commit drop as
select public.create_reservation('00000000-0000-0000-0000-0000000000b1', 'Ana', 'Pérez', '300 111 2222', 3, false, true) as r;
grant select on creada to anon;
-- El consecutivo no sale en ninguna respuesta; se lee de la tabla (como postgres) solo para probar que no abre nada.
create temp table consecutivo on commit drop as
select code from public.reservations where access_key = (select r ->> 'public_code' from creada);
grant select on consecutivo to anon;

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
  'Celular inválido: en Colombia son 10 dígitos que empiezan por 3.', 'rechaza celulares inválidos');

select is(public.normalizar_celular('+34 612 345 678'), '+34612345678', 'acepta celulares de otros países con indicativo');

select throws_ok(
  $$ select public.normalizar_celular('+34 123') $$,
  'Celular inválido: revisa el indicativo y el número.', 'rechaza internacionales demasiado cortos');

select is(
  (select remaining from public.get_availability(public.fecha_local() + 1, public.fecha_local() + 1)
   where slot_id = '00000000-0000-0000-0000-0000000000b1'),
  2, 'la disponibilidad descuenta lo apartado');

select ok(
  (select r ->> 'public_code' from creada) ~ '^[A-HJKMNP-Z2-9]{8}$',
  'el código público es una clave de 8 caracteres, sin el consecutivo');

select ok(not ((select r from creada) ? 'code'), 'la respuesta de la RPC no expone el consecutivo');

select throws_ok(
  format('select public.report_payment(%L)', (select code from consecutivo)),
  'No encontramos esa reserva.', 'con solo el consecutivo no se puede reportar el pago');

select is(
  (public.report_payment((select lower(r ->> 'public_code') from creada))) ->> 'status',
  'payment_reported', 'reportar el pago con el código público pasa la reserva a pago reportado');

select is(
  (public.get_my_reservation((select r ->> 'public_code' from creada))) ->> 'public_code',
  (select r ->> 'public_code' from creada), 'Mi reserva abre con solo el código público');

select throws_ok(
  format('select public.get_my_reservation(%L)', (select code from consecutivo)),
  'No encontramos una reserva con ese código.', 'Mi reserva no abre con el consecutivo solo');

select is(
  (public.get_my_reservation((select (select code from consecutivo) || '-' || (r ->> 'public_code') from creada))) ->> 'public_code',
  (select r ->> 'public_code' from creada), 'Mi reserva sigue aceptando el formato largo anterior (consecutivo + clave)');

select is(
  (public.get_my_reservation((select ' ' || substr(lower(r ->> 'public_code'), 1, 4) || '-' || substr(r ->> 'public_code', 5) || ' ' from creada))) ->> 'public_code',
  (select r ->> 'public_code' from creada), 'Mi reserva acepta minúsculas, espacios y guion en el código');

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
