import { formatearCOP } from './dinero'
import { fechaLarga, horaCorta } from './fechas'
import type { Reserva } from './reserva'

/** Rellena `settings.whatsapp_template`; el texto del mensaje nunca vive en un componente. */
export function mensajeWhatsapp(plantilla: string, r: Reserva): string {
  const valores: Record<string, string> = {
    nombre: r.first_name,
    codigo: r.code,
    fecha: fechaLarga(r.slot_date),
    hora: horaCorta(r.start_time),
    personas: String(r.party_size),
    total: formatearCOP(r.total),
  }
  return plantilla.replace(/\{(\w+)\}/g, (marca, clave: string) => valores[clave] ?? marca)
}

/** Enlace wa.me con el mensaje ya codificado. */
export function enlaceWhatsapp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
}
