import { EstadoReserva, Reserva } from '@okimaki/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

function lanzar(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

export async function verificarPago(db: SupabaseClient, reservaId: string, referencia: string): Promise<Reserva> {
  const { data, error } = await db.rpc('verify_payment', { p_reservation_id: reservaId, p_reference: referencia })
  lanzar(error)
  return Reserva.parse(data)
}

export async function rechazarPago(db: SupabaseClient, reservaId: string, motivo: string): Promise<Reserva> {
  const { data, error } = await db.rpc('reject_payment', { p_reservation_id: reservaId, p_reason: motivo })
  lanzar(error)
  return Reserva.parse(data)
}

export async function cancelarReserva(db: SupabaseClient, reservaId: string, motivo: string): Promise<Reserva> {
  const { data, error } = await db.rpc('cancel_reservation', { p_reservation_id: reservaId, p_reason: motivo })
  lanzar(error)
  return Reserva.parse(data)
}

/** Fila de la bandeja: columnas snake_case de Postgres con alias camelCase en el select. */
export const SELECT_RESERVA_PANEL = `
  id, codigo:code, estado:status, nombre:first_name, apellido:last_name,
  personas:party_size, total, venceEn:hold_expires_at, reportadaEn:reported_at,
  esCumple:is_birthday, alergias:allergies, motivoCancelacion:cancel_reason, creadaEn:created_at,
  tanda:service_slots(fecha:slot_date, hora:start_time),
  cliente:customers(celular:phone),
  pagos:payments(id, monto:amount, estado:status, referencia:reference, reportadoEn:reported_at, motivoRechazo:reject_reason)
`

export const FilaReserva = z.object({
  id: z.uuid(),
  codigo: z.string(),
  estado: EstadoReserva,
  nombre: z.string(),
  apellido: z.string(),
  personas: z.number().int(),
  total: z.number().int(),
  venceEn: z.string().nullable(),
  reportadaEn: z.string().nullable(),
  esCumple: z.boolean(),
  alergias: z.string().nullable(),
  motivoCancelacion: z.string().nullable(),
  creadaEn: z.string(),
  tanda: z.object({ fecha: z.string(), hora: z.string() }),
  cliente: z.object({ celular: z.string() }),
  pagos: z.array(
    z.object({
      id: z.uuid(),
      monto: z.number().int(),
      estado: z.enum(['reported', 'verified', 'rejected']),
      referencia: z.string().nullable(),
      reportadoEn: z.string(),
      motivoRechazo: z.string().nullable(),
    }),
  ),
})
export type FilaReserva = z.infer<typeof FilaReserva>

export async function listarReservasPanel(db: SupabaseClient, estados?: EstadoReserva[]): Promise<FilaReserva[]> {
  let consulta = db.from('reservations').select(SELECT_RESERVA_PANEL).order('created_at', { ascending: false }).limit(500)
  if (estados) consulta = consulta.in('status', estados)
  const { data, error } = await consulta
  lanzar(error)
  return z.array(FilaReserva).parse(data)
}
