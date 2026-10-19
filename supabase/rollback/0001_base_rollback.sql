-- Reversa de 0001_base. Borra TODO el esquema de reservas: solo para entornos de prueba.
select cron.unschedule('expire-holds');
select cron.unschedule('generate-slots');

drop view if exists public.slot_availability;
drop table if exists public.audit_log, public.payments, public.reservations, public.customers,
  public.service_slots, public.service_types, public.staff, public.settings cascade;
drop sequence if exists public.reservation_code_seq;

drop function if exists public.generate_slots(int), public.expire_holds(),
  public.cancel_reservation(uuid, text), public.reject_payment(uuid, text),
  public.verify_payment(uuid, text), public.get_my_reservation(text, text),
  public.report_payment(text), public.create_reservation(uuid, text, text, text, int, boolean, boolean, text),
  public.get_availability(date, date), public.get_public_settings(), public.reservation_payload(uuid),
  public.bloquear_borrado(), public.audit_trigger(), public.has_role(public.staff_role),
  public.normalizar_celular(text), public.fecha_local();

drop type if exists public.payment_status, public.reservation_status, public.staff_role;
