import type { Tanda } from '@okimaki/core'

/** Clip que se reproduce en "Ver más". La orientación define el marco del reproductor. */
export type VideoExperiencia = {
  src: string
  poster?: string
  orientacion: 'vertical' | 'horizontal'
}

/**
 * Provisional: el mismo clip de prueba (CC0, MDN) para todas las experiencias, solo para ver el modal.
 * Falta definir de dónde sale el video real de cada tipo de servicio.
 */
const VIDEO_PRUEBA: VideoExperiencia = {
  src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  orientacion: 'horizontal',
}

/** Una experiencia = un tipo de servicio o evento, con su color y las fechas en que se ofrece. */
export type Experiencia = {
  id: string
  nombre: string
  frase: string
  menu: string
  incluye: string[]
  precio: number
  duracionMin: number
  acento: string
  fechas: string[]
  dias: string
  libres: number
  video: VideoExperiencia | null
}

const ACENTOS = [
  'var(--color-gold-400)',
  'var(--color-sakura-300)',
  'var(--color-matcha-400)',
  'var(--color-ai-400)',
  'var(--color-lacquer-500)',
]

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function diaSemana(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay()
}

function unir(partes: string[]) {
  return partes.length < 2 ? (partes[0] ?? '') : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
}

/** "martes", "miércoles y jueves" o, si es un evento de pocas fechas, "31 de octubre". */
function describirDias(fechas: string[]): string {
  if (fechas.length <= 2) {
    const fmt = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', day: 'numeric', month: 'long' })
    return unir(fechas.map((f) => fmt.format(new Date(`${f}T12:00:00Z`))))
  }
  const dias = [...new Set(fechas.map(diaSemana))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  if (dias.length === 7) return 'todos los días'
  return unir(dias.map((d) => NOMBRES_DIA[d]))
}

/** Agrupa las tandas en experiencias, en orden de su primera fecha disponible. */
export function agruparExperiencias(tandas: Tanda[]): Experiencia[] {
  const mapa = new Map<string, { t: Tanda; fechas: Set<string>; libres: number }>()
  for (const t of tandas) {
    const e = mapa.get(t.servicioId) ?? { t, fechas: new Set<string>(), libres: 0 }
    e.fechas.add(t.fecha)
    e.libres += t.restantes
    mapa.set(t.servicioId, e)
  }
  return [...mapa.values()].map(({ t, fechas, libres }, i) => ({
    id: t.servicioId,
    nombre: t.servicio,
    frase: t.frase,
    menu: t.menu,
    incluye: t.incluye,
    precio: t.precio,
    duracionMin: t.duracionMin,
    acento: ACENTOS[i % ACENTOS.length],
    fechas: [...fechas],
    dias: describirDias([...fechas]),
    libres,
    video: VIDEO_PRUEBA,
  }))
}

export function duracionTexto(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} ${h === 1 ? 'hora' : 'horas'}`
}

/** Hora en que termina la tanda: "13:00:00" + 90 min → "14:30:00". */
export function horaFin(hora: string, duracionMin: number) {
  const [h, m] = hora.split(':').map(Number)
  const total = (h * 60 + m + duracionMin) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`
}
