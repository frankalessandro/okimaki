import { z } from 'zod'
import { normalizarCelular } from './celular'
import { EstadoReserva } from './estados'

/** Lo que el cliente llena en el formulario; los mismos campos que espera `create_reservation`. */
export const NuevaReserva = z.object({
  slotId: z.uuid(),
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(80),
  apellido: z.string().trim().min(1, 'Escribe tu apellido').max(80),
  celular: z
    .string()
    .refine((v) => normalizarCelular(v) !== null, 'Celular inválido: 10 dígitos que empiecen por 3'),
  personas: z.number().int().min(1, 'Mínimo 1 persona'),
  esCumple: z.boolean(),
  alergias: z.string().trim().max(300).optional(),
  terminos: z.literal(true, 'Debes aceptar los términos y condiciones'),
})
export type NuevaReserva = z.infer<typeof NuevaReserva>

export const Tanda = z.object({
  slotId: z.uuid(),
  fecha: z.string(),
  hora: z.string(),
  servicio: z.string(),
  precio: z.number().int(),
  duracionMin: z.number().int(),
  cupo: z.number().int(),
  restantes: z.number().int(),
})
export type Tanda = z.infer<typeof Tanda>

export const DatosPago = z.object({
  key: z.string(),
  holder: z.string(),
  qr_path: z.string().nullable(),
  whatsapp_number: z.string(),
  whatsapp_template: z.string(),
})

/** Respuesta de `create_reservation`, `report_payment` y `get_my_reservation`. */
export const Reserva = z.object({
  code: z.string(),
  status: EstadoReserva,
  first_name: z.string(),
  last_name: z.string(),
  party_size: z.number().int(),
  price_per_person: z.number().int(),
  total: z.number().int(),
  hold_expires_at: z.string().nullable(),
  reported_at: z.string().nullable(),
  is_birthday: z.boolean(),
  slot_date: z.string(),
  start_time: z.string(),
  service_name: z.string(),
  duration_minutes: z.number().int(),
  payment: DatosPago.optional(),
})
export type Reserva = z.infer<typeof Reserva>
