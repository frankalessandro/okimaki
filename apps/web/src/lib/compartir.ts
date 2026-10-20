import { fechaLarga, horaCorta, type Reserva } from '@okimaki/core'
import { MAPA_URL } from './restaurante'

/** Texto para que el cliente le cuente a su grupo; sin montos ni datos de pago. */
export function textoCompartir(r: Reserva) {
  const personas = `${r.party_size} ${r.party_size === 1 ? 'persona' : 'personas'}`
  return [
    `¡Tenemos reserva en Okimaki 369!`,
    `${r.service_name} · ${fechaLarga(r.slot_date)} · ${horaCorta(r.start_time)}`,
    `${personas} · a nombre de ${r.first_name} ${r.last_name}`,
    `Código: ${r.public_code}`,
    `Cómo llegar: ${MAPA_URL}`,
  ].join('\n')
}

/**
 * Comparte con la hoja nativa del celular; donde no existe (muchos navegadores de escritorio),
 * abre WhatsApp con el texto listo.
 */
export async function compartirReserva(r: Reserva) {
  const texto = textoCompartir(r)
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: `Reserva ${r.public_code} · Okimaki 369`, text: texto })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
}
