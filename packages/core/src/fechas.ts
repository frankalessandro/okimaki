const ZONA = 'America/Bogota'

const partes = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Fecha del negocio ("hoy") en America/Bogota, formato YYYY-MM-DD. */
export function fechaLocalISO(instante: Date = new Date()): string {
  return partes.format(instante)
}

/** Suma días a una fecha YYYY-MM-DD sin pasar por la zona horaria del equipo. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

/** "2026-10-24" → "sábado 24 de octubre". */
export function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(a, m - 1, d)))
}

/** "15:00:00" → "3:00 p. m." */
export function horaCorta(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${sufijo}`
}
