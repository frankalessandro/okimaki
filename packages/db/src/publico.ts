import { Reserva, Tanda, type NuevaReserva } from '@okimaki/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

/** Un error de RPC de Postgres trae el mensaje en español que escribió la función. */
function lanzar(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

const ConfigPublica = z.object({
  restaurant_name: z.string(),
  terms: z.string(),
  cancellation_policy: z.string(),
  hold_minutes: z.number().int(),
  booking_window_days: z.number().int(),
})
export type ConfigPublica = z.infer<typeof ConfigPublica>

export async function obtenerConfigPublica(db: SupabaseClient): Promise<ConfigPublica> {
  const { data, error } = await db.rpc('get_public_settings')
  lanzar(error)
  return ConfigPublica.parse(data)
}

const FilaTanda = z.object({
  slot_id: z.uuid(),
  slot_date: z.string(),
  start_time: z.string(),
  service_type_id: z.uuid(),
  service_name: z.string(),
  tagline: z.string(),
  menu: z.string(),
  highlights: z.array(z.string()),
  price: z.number().int(),
  duration_minutes: z.number().int(),
  capacity: z.number().int(),
  remaining: z.number().int(),
})

export async function obtenerDisponibilidad(db: SupabaseClient, desde: string, hasta: string): Promise<Tanda[]> {
  const { data, error } = await db.rpc('get_availability', { p_from: desde, p_to: hasta })
  lanzar(error)
  return z.array(FilaTanda).parse(data).map((f) => ({
    slotId: f.slot_id,
    fecha: f.slot_date,
    hora: f.start_time,
    servicioId: f.service_type_id,
    servicio: f.service_name,
    frase: f.tagline,
    menu: f.menu,
    incluye: f.highlights,
    precio: f.price,
    duracionMin: f.duration_minutes,
    cupo: f.capacity,
    restantes: f.remaining,
  }))
}

export async function crearReserva(db: SupabaseClient, r: NuevaReserva): Promise<Reserva> {
  const { data, error } = await db.rpc('create_reservation', {
    p_slot_id: r.slotId,
    p_first_name: r.nombre,
    p_last_name: r.apellido,
    p_phone: r.celular,
    p_party_size: r.personas,
    p_is_birthday: r.esCumple,
    p_terms_accepted: r.terminos,
    p_allergies: r.alergias ?? null,
  })
  lanzar(error)
  return Reserva.parse(data)
}

/** Exige el código público completo, no el consecutivo. */
export async function reportarPago(db: SupabaseClient, codigoPublico: string): Promise<Reserva> {
  const { data, error } = await db.rpc('report_payment', { p_code: codigoPublico })
  lanzar(error)
  return Reserva.parse(data)
}

/** Con el código público (consecutivo + clave aleatoria); el consecutivo solo no abre nada. */
export async function obtenerMiReserva(db: SupabaseClient, codigoPublico: string): Promise<Reserva> {
  const { data, error } = await db.rpc('get_my_reservation', { p_code: codigoPublico })
  lanzar(error)
  return Reserva.parse(data)
}
