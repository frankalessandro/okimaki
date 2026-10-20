import { formatearCOP, horaCorta, type Tanda } from '@okimaki/core'
import { useCallback, useState, type CSSProperties } from 'react'
import { duracionTexto, horaFin, type Experiencia } from '../lib/experiencias'
import { IconoBebida, IconoCalendario, IconoCheck, IconoDestello, IconoLinterna, IconoPalillos, IconoPlay, IconoReloj } from './iconos'
import { cx } from './ui'
import { VerExperiencia } from './VerExperiencia'

const MOTIVOS = [IconoPalillos, IconoDestello, IconoLinterna, IconoBebida]

const fmtProxima = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })

/* ------------------------------------------------------------------ Paso 1: tarjetas de experiencia */

/** Todas las experiencias a la vista, con su información completa; se elige una (radio). */
export function TarjetasExperiencia({
  experiencias,
  elegida,
  onElegir,
}: {
  experiencias: Experiencia[]
  elegida: string | null
  onElegir: (id: string) => void
}) {
  const [detalle, setDetalle] = useState<Experiencia | null>(null)
  const cerrarDetalle = useCallback(() => setDetalle(null), [])
  return (
    <>
      <div role="radiogroup" aria-label="Experiencias" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {experiencias.map((e, i) => {
          const Motivo = MOTIVOS[i % MOTIVOS.length]
          const activa = elegida === e.id
          return (
            <article
              key={e.id}
              className={cx(
                'aparecer group relative flex flex-col overflow-hidden rounded-3xl border p-5 transition-[transform,border-color,box-shadow,opacity] duration-500 ease-(--ease-suave)',
                activa
                  ? 'border-(--acento) shadow-[0_18px_50px_-20px_var(--acento)]'
                  : 'border-carbon-700 hover:-translate-y-1 hover:border-(--acento)/50',
                elegida && !activa && 'opacity-60 hover:opacity-100',
              )}
              style={
                {
                  '--acento': e.acento,
                  '--i': i,
                  background: 'linear-gradient(165deg, color-mix(in oklab, var(--acento) 13%, var(--color-carbon-900)), var(--color-carbon-900) 55%)',
                } as CSSProperties
              }
            >
              {/* El botón cubre toda la tarjeta; "Ver más" queda encima con z-10. */}
              <button
                type="button"
                role="radio"
                aria-checked={activa}
                aria-label={`${e.nombre}, ${formatearCOP(e.precio)} por persona, ${e.dias}`}
                onClick={() => onElegir(e.id)}
                className="absolute inset-0 z-0 rounded-3xl"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 -right-6 text-(--acento) opacity-[0.13] transition-transform duration-700 ease-(--ease-suave) group-hover:scale-110 group-hover:-rotate-12"
              >
                <Motivo tam={130} strokeWidth={0.8} />
              </span>

              <span className="pointer-events-none relative flex items-center gap-2.5 text-[0.8rem] font-bold tracking-[0.22em] text-(--acento) uppercase">
                <span className="size-2 rounded-full bg-(--acento)" />
                {e.dias}
              </span>

              <h3 className="pointer-events-none relative mt-3 text-[1.5rem] leading-tight text-ivory-50">{e.nombre}</h3>
              {e.frase && <p className="pointer-events-none relative mt-1 text-sm text-ivory-300">{e.frase}</p>}

              {e.menu && (
                <p className="pointer-events-none relative mt-4 line-clamp-3 text-[0.88rem] leading-relaxed text-ivory-100/90">{e.menu}</p>
              )}

              {e.incluye.length > 0 && (
                <ul className="pointer-events-none relative mt-4 grid gap-1.5">
                  {e.incluye.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-[0.85rem] text-ivory-100">
                      <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-(--acento)/15 text-(--acento)">
                        <IconoCheck tam={12} strokeWidth={2.6} />
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
              )}

              <span aria-hidden="true" className="min-h-5 flex-1" />
              <div className="pointer-events-none relative flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-t border-carbon-700/70 pt-4">
                <div>
                  <span className="block font-display text-[1.6rem] leading-none text-ivory-50">{formatearCOP(e.precio)}</span>
                  <span className="text-[0.72rem] text-ivory-500">por persona</span>
                </div>
                <div className="space-y-0.5 text-right text-[0.75rem] text-ivory-300">
                  <p className="flex items-center justify-end gap-1.5">
                    <IconoReloj tam={14} className="text-(--acento)" /> {duracionTexto(e.duracionMin)}
                  </p>
                  {e.fechas[0] && (
                    <p className="flex items-center justify-end gap-1.5">
                      <IconoCalendario tam={14} className="text-(--acento)" /> Próxima: {fmtProxima.format(new Date(`${e.fechas[0]}T12:00:00Z`))}
                    </p>
                  )}
                </div>
              </div>

              {/* "Seleccionar" es solo la cara visible del botón que cubre la tarjeta; "Ver más" abre el video y el menú completo. */}
              <div className="relative mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDetalle(e)}
                  className="relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-(--acento)/40 text-[0.85rem] font-bold text-ivory-50 transition hover:border-(--acento) hover:bg-(--acento)/10"
                >
                  {e.video && (
                    <span className="grid size-6 place-items-center rounded-full bg-(--acento) text-carbon-950">
                      <IconoPlay tam={12} className="translate-x-px fill-current" />
                    </span>
                  )}
                  Ver más
                </button>
                <span
                  aria-hidden="true"
                  className={cx(
                    'pointer-events-none flex min-h-11 items-center justify-center gap-1.5 rounded-2xl text-[0.85rem] font-bold transition-colors duration-300',
                    activa ? 'bg-(--acento) text-carbon-950' : 'bg-ivory-50/8 text-ivory-100 group-hover:bg-(--acento)/20',
                  )}
                >
                  {activa && <IconoCheck tam={16} strokeWidth={2.4} />}
                  {activa ? 'Seleccionada' : 'Seleccionar'}
                </span>
              </div>
            </article>
          )
        })}
      </div>

      <VerExperiencia experiencia={detalle} elegida={detalle?.id === elegida} onElegir={onElegir} onCerrar={cerrarDetalle} />
    </>
  )
}

/* ------------------------------------------------------------------ Tira de días (celular) */

const fmtSemana = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'short' })
const fmtMesCorto = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'short' })

/** Fechas disponibles de la experiencia en fila horizontal: cambiar de día sin desplegar el calendario. */
export function TiraDias({
  fechas,
  seleccion,
  onElegir,
}: {
  fechas: { fecha: string; habilitada: boolean }[]
  seleccion: string | null
  onElegir: (f: string) => void
}) {
  return (
    <div
      className="sin-barra -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1"
      ref={(el) => {
        // Centra el día elegido dentro de la tira, sin mover la página.
        const activo = el?.querySelector<HTMLElement>('[aria-pressed="true"]')
        if (el && activo) el.scrollLeft = activo.offsetLeft - el.clientWidth / 2 + activo.offsetWidth / 2
      }}
    >
      {fechas.map(({ fecha, habilitada }) => {
        const d = new Date(`${fecha}T12:00:00Z`)
        const activa = fecha === seleccion
        return (
          <button
            key={fecha}
            type="button"
            disabled={!habilitada}
            aria-pressed={activa}
            onClick={() => onElegir(fecha)}
            className={cx(
              'flex w-[4.75rem] shrink-0 snap-center flex-col items-center rounded-2xl border py-3 transition-all duration-300 ease-(--ease-suave)',
              activa
                ? 'border-gold-400 bg-gold-400 text-carbon-950'
                : 'border-carbon-700 bg-carbon-900 text-ivory-100 active:scale-95 disabled:opacity-35',
            )}
          >
            <span className={cx('text-[0.65rem] font-bold tracking-wider uppercase', activa ? 'text-carbon-950/70' : 'text-ivory-500')}>
              {fmtSemana.format(d).replace('.', '')}
            </span>
            <span className="font-display text-2xl leading-tight">{d.getUTCDate()}</span>
            <span className={cx('text-[0.65rem]', activa ? 'text-carbon-950/70' : 'text-ivory-500')}>{fmtMesCorto.format(d).replace('.', '')}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ Tiquete de tanda */

export function TiqueteTanda({
  tanda,
  personas,
  elegida,
  onElegir,
  indice,
}: {
  tanda: Tanda
  personas: number
  elegida: boolean
  onElegir: () => void
  indice: number
}) {
  const lleno = tanda.restantes === 0
  const noAlcanza = !lleno && tanda.restantes < personas
  const fraccion = tanda.cupo ? tanda.restantes / tanda.cupo : 0
  const pocos = !lleno && fraccion <= 0.25
  const [hora, ...resto] = horaCorta(tanda.hora).split(' ')
  const sufijo = resto.join('')
  const estado = lleno ? 'Agotada' : noAlcanza ? `Solo ${tanda.restantes} ${tanda.restantes === 1 ? 'cupo' : 'cupos'}` : pocos ? `¡Últimos ${tanda.restantes}!` : `${tanda.restantes} cupos`
  return (
    <button
      type="button"
      disabled={lleno || noAlcanza}
      onClick={onElegir}
      aria-pressed={elegida}
      aria-label={`Tanda de las ${horaCorta(tanda.hora)}, ${estado}`}
      className={cx(
        'perforado aparecer-suave relative flex min-h-26 w-full items-stretch rounded-3xl text-left transition-[transform,background-color] duration-400 ease-(--ease-suave)',
        elegida
          ? 'bg-gold-400 text-carbon-950'
          : lleno || noAlcanza
            ? 'bg-carbon-800/50 text-ivory-500'
            : 'bg-carbon-800 text-ivory-50 hover:-translate-y-0.5 hover:bg-carbon-700 active:scale-[0.98]',
      )}
      style={{ '--i': indice } as CSSProperties}
    >
      <span className="flex w-32 shrink-0 flex-col justify-center pl-7">
        <span className="font-display text-[2.1rem] leading-none">{hora}</span>
        <span className={cx('mt-1 text-[0.66rem] font-bold tracking-[0.2em] uppercase', elegida ? 'text-carbon-950/70' : 'text-ivory-500')}>
          {sufijo}
        </span>
      </span>
      <span aria-hidden="true" className={cx('my-3 border-l border-dashed', elegida ? 'border-carbon-950/30' : 'border-carbon-600')} />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-2 pr-7 pl-5">
        <span className={cx('text-[0.78rem]', elegida ? 'text-carbon-950/75' : 'text-ivory-500')}>
          Hasta las {horaCorta(horaFin(tanda.hora, tanda.duracionMin))}
        </span>
        <span className="flex items-center justify-between gap-2 text-[0.9rem]">
          <span className={cx('font-bold', elegida ? '' : lleno ? 'text-lacquer-500' : noAlcanza || pocos ? 'text-warning-500' : 'text-ivory-100')}>
            {estado}
          </span>
          {elegida && <IconoCheck tam={22} strokeWidth={2.4} dibujar />}
        </span>
        <span className={cx('h-2 overflow-hidden rounded-full', elegida ? 'bg-carbon-950/15' : 'bg-carbon-700')}>
          <span
            className={cx(
              'block h-full origin-left rounded-full transition-transform duration-700 ease-(--ease-suave)',
              elegida ? 'bg-carbon-950/70' : pocos ? 'bg-warning-500' : 'bg-gold-400',
            )}
            style={{ transform: `scaleX(${fraccion})` }}
          />
        </span>
      </span>
    </button>
  )
}
