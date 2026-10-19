import { z } from 'zod'

export const EstadoReserva = z.enum([
  'held',
  'payment_reported',
  'confirmed',
  'attended',
  'expired',
  'cancelled',
  'no_show',
])
export type EstadoReserva = z.infer<typeof EstadoReserva>

export const etiquetaEstado: Record<EstadoReserva, string> = {
  held: 'Apartada',
  payment_reported: 'Pago reportado',
  confirmed: 'Confirmada',
  attended: 'Asistió',
  expired: 'Vencida',
  cancelled: 'Cancelada',
  no_show: 'No se presentó',
}
