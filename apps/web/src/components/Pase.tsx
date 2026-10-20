import { fechaLarga, horaCorta, type EstadoReserva, type Reserva } from '@okimaki/core'
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { compartirReserva } from '../lib/compartir'
import { horaFin } from '../lib/experiencias'
import { MAPA_URL } from '../lib/restaurante'
import { IconoCalendario, IconoCheck, IconoCompartir, IconoCopiar, IconoPastel, IconoPersonas, IconoReloj, IconoUbicacion } from './iconos'
import { cx, Monto, useCopiar } from './ui'

/**
 * "Asistió" es un dato del restaurante (mesera y panel); al cliente le basta con saber que está confirmada.
 * Todo estado que se pinta en el sitio público pasa por aquí.
 */
export function estadoCliente(estado: EstadoReserva): EstadoReserva {
  return estado === 'attended' ? 'confirmed' : estado
}

type Tema = { kanji: string; acento: string; etiqueta: string }

/** Kanji del sello y color de acento por estado: 仮 provisional, 報 reportado, 済 pagada, 終/止/欠 cerrada. */
const TEMA: Record<EstadoReserva, Tema> = {
  held: { kanji: '仮', acento: 'var(--color-warning-500)', etiqueta: 'Apartada' },
  payment_reported: { kanji: '報', acento: 'var(--color-ai-400)', etiqueta: 'Pago reportado' },
  confirmed: { kanji: '済', acento: 'var(--color-matcha-400)', etiqueta: 'Confirmada' },
  attended: { kanji: '済', acento: 'var(--color-matcha-400)', etiqueta: 'Confirmada' },
  expired: { kanji: '終', acento: 'var(--color-ivory-500)', etiqueta: 'Vencida' },
  cancelled: { kanji: '止', acento: 'var(--color-ivory-500)', etiqueta: 'Cancelada' },
  no_show: { kanji: '欠', acento: 'var(--color-ivory-500)', etiqueta: 'No se presentó' },
}

const fmtCorta = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
const fmtHoraInstante = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit' })

/** Sello hanko que se estampa al aparecer; cambia con el estado. */
export function SelloEstado({ estado, className = '' }: { estado: EstadoReserva; className?: string }) {
  const t = TEMA[estadoCliente(estado)]
  return (
    <span
      key={estado}
      role="img"
      aria-label={t.etiqueta}
      className={cx('grid size-16 shrink-0 place-items-center rounded-2xl border-[2.5px] bg-carbon-950/40', className)}
      style={{ color: t.acento, borderColor: t.acento, animation: 'estampar .6s var(--ease-rebote) .25s both' }}
    >
      <span className="font-pincel text-[2.1rem] leading-none" aria-hidden="true">
        {t.kanji}
      </span>
    </span>
  )
}

/**
 * El pase de la reserva. Misma estructura en todos los estados —encabezado, datos de la visita,
 * bloque de pago y talón con el código—; solo cambian el acento, el sello y el bloque de pago.
 */
export function Pase({ reserva, acciones = true }: { reserva: Reserva; /** Falso mientras se paga: copiar código, compartir y cómo llegar esperan a que el pago esté reportado. */ acciones?: boolean }) {
  const estado = estadoCliente(reserva.status)
  const tema = TEMA[estado]
  const codigoRef = useRef<HTMLSpanElement>(null)
  const { estado: copia, copiar } = useCopiar(codigoRef)
  const fecha = new Date(`${reserva.slot_date}T12:00:00Z`)
  // Compartir y llegar solo tienen sentido mientras la reserva sigue en pie.
  const vigente = acciones && (estado === 'held' || estado === 'payment_reported' || estado === 'confirmed')

  return (
    <article
      className="marco aparecer w-full overflow-hidden"
      aria-label={`Reserva ${reserva.public_code}, ${tema.etiqueta}`}
      style={{ '--acento': tema.acento } as CSSProperties}
    >
      <div aria-hidden="true" className="h-1 bg-linear-to-r from-transparent via-(--acento) to-transparent opacity-80" />

      {/* Encabezado: qué, a nombre de quién y el sello del estado */}
      <header className="relative px-6 pt-5 pb-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-(--acento) opacity-[0.07] blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.64rem] font-bold tracking-[0.32em] text-gold-500 uppercase">Okimaki 369 · Pase</p>
            <h3 className="mt-2 text-[1.6rem] leading-tight text-ivory-50">{reserva.service_name}</h3>
            <p className="mt-1.5 text-sm text-ivory-300">
              A nombre de{' '}
              <strong className="font-bold text-ivory-50">
                {reserva.first_name} {reserva.last_name}
              </strong>
            </p>
            {reserva.is_birthday && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sakura-300/40 bg-sakura-300/10 px-3 py-1 text-[0.75rem] text-sakura-300">
                <IconoPastel tam={14} /> Celebramos un cumpleaños
              </span>
            )}
          </div>
          <SelloEstado estado={estado} className="-rotate-8" />
        </div>
      </header>

      <Perforacion />

      {/* La visita: tres datos del mismo peso */}
      <dl className="grid grid-cols-3 divide-x divide-carbon-700/70 py-5 text-center">
        <Dato icono={<IconoCalendario tam={16} />} etiqueta="Fecha" titulo={fechaLarga(reserva.slot_date)}>
          <span className="inline-block first-letter:uppercase">{fmtCorta.format(fecha).replace(/\./g, '')}</span>
        </Dato>
        <Dato icono={<IconoReloj tam={16} />} etiqueta="Hora">
          {horaCorta(reserva.start_time)}
          <span className="block font-sans text-[0.7rem] text-ivory-500">
            hasta {horaCorta(horaFin(reserva.start_time, reserva.duration_minutes))}
          </span>
        </Dato>
        <Dato icono={<IconoPersonas tam={16} />} etiqueta="Grupo">
          {reserva.party_size}
          <span className="block font-sans text-[0.7rem] text-ivory-500">{reserva.party_size === 1 ? 'persona' : 'personas'}</span>
        </Dato>
      </dl>

      <Perforacion />

      {/* El pago: lo único que cambia de un estado a otro */}
      <section className="px-6 py-5" aria-label="Pago">
        <BloquePago reserva={reserva} estado={estado} />
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.64rem] font-bold tracking-[0.25em] text-ivory-500 uppercase">{rotuloTotal(estado)}</p>
            <Monto
              valor={reserva.total}
              className={cx('font-display text-[2rem] leading-none', estado === 'confirmed' ? 'text-matcha-400' : 'text-ivory-50')}
            />
          </div>
          <p className="pb-1 text-right text-[0.75rem] text-ivory-500">
            {reserva.party_size} × <Monto valor={reserva.price_per_person} />
          </p>
        </div>
      </section>

      {/* Talón: el código y lo que se hace con la reserva */}
      <footer className="border-t border-dashed border-gold-500/25 bg-carbon-950/50 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] tracking-[0.25em] text-ivory-500 uppercase">Código de reserva</p>
            <span ref={codigoRef} className="font-mono text-lg font-bold tracking-[0.08em] break-all text-ivory-50 select-all">
              {reserva.public_code}
            </span>
            {acciones && (
              <p className="text-[0.7rem] text-ivory-500">
                {copia === 'manual' ? 'Quedó seleccionado: cópialo manualmente.' : 'Con este código consultas tu reserva desde cualquier celular.'}
              </p>
            )}
          </div>
          {acciones && (
            <button
              type="button"
              onClick={() => void copiar(reserva.public_code)}
              aria-label={copia === 'si' ? 'Código copiado' : 'Copiar código de reserva'}
              className={cx(
                'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-all duration-300 ease-(--ease-rebote) active:scale-90',
                copia === 'si' ? 'border-matcha-400/60 bg-matcha-400/10 text-matcha-400' : 'border-gold-500/35 text-gold-200 hover:bg-gold-500/10',
              )}
            >
              {copia === 'si' ? <IconoCheck tam={16} strokeWidth={2.4} dibujar /> : <IconoCopiar tam={16} />}
              {copia === 'si' ? 'Copiado' : 'Copiar'}
            </button>
          )}
        </div>
        {vigente && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void compartirReserva(reserva)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gold-500/30 bg-carbon-900/70 text-sm font-bold text-gold-200 transition duration-300 ease-(--ease-suave) hover:border-gold-400/60 hover:bg-carbon-800 active:scale-[0.97]"
            >
              <IconoCompartir tam={18} /> Compartir
            </button>
            <a
              href={MAPA_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gold-500/30 bg-carbon-900/70 text-sm font-bold text-gold-200 transition duration-300 ease-(--ease-suave) hover:border-gold-400/60 hover:bg-carbon-800 active:scale-[0.97]"
            >
              <IconoUbicacion tam={18} /> Cómo llegar
            </a>
          </div>
        )}
      </footer>
    </article>
  )
}

function rotuloTotal(estado: EstadoReserva) {
  if (estado === 'confirmed') return 'Pagado'
  if (estado === 'payment_reported') return 'Reportado'
  if (estado === 'held') return 'Por pagar'
  return 'Total'
}

/* ------------------------------------------------------------------ Bloque de pago por estado */

function BloquePago({ reserva, estado }: { reserva: Reserva; estado: EstadoReserva }) {
  if (estado === 'confirmed') {
    return (
      <div>
        <Insignia tono="var(--color-matcha-400)" icono={<IconoCheck tam={14} strokeWidth={2.8} dibujar />}>
          Pagada
        </Insignia>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-ivory-100">
          Verificamos tu pago y <span className="font-bold text-ivory-50">tu mesa está confirmada</span>. Te esperamos el{' '}
          {fechaLarga(reserva.slot_date)} a las {horaCorta(reserva.start_time)}.
        </p>
        <Trayecto actual={3} />
      </div>
    )
  }
  if (estado === 'payment_reported') {
    return (
      <div>
        <Insignia tono="var(--color-ai-400)" icono={<span className="size-2 rounded-full bg-current [animation:latido_1.4s_ease-in-out_infinite]" />}>
          En verificación
        </Insignia>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-ivory-100">
          {reserva.reported_at ? `Reportaste tu pago a las ${fmtHoraInstante.format(new Date(reserva.reported_at))}` : 'Recibimos tu reporte de pago'}
          : estamos revisando la transferencia y te confirmaremos por WhatsApp.
        </p>
        <Trayecto actual={2} />
      </div>
    )
  }
  if (estado === 'held') {
    return (
      <div>
        <Insignia tono="var(--color-warning-500)" icono={<span className="size-2 rounded-full bg-current" />}>
          Pendiente de pago
        </Insignia>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-ivory-100">
          {reserva.hold_expires_at
            ? `Tu cupo está apartado hasta las ${fmtHoraInstante.format(new Date(reserva.hold_expires_at))}: transfiere y envía el comprobante antes de esa hora.`
            : 'Transfiere y envía el comprobante para confirmar tu mesa.'}
        </p>
        <Trayecto actual={1} />
      </div>
    )
  }
  return (
    <Insignia tono="var(--color-ivory-500)" icono={<span className="size-2 rounded-full bg-current" />}>
      {TEMA[estado].etiqueta}
    </Insignia>
  )
}

function Insignia({ tono, icono, children }: { tono: string; icono: ReactNode; children: ReactNode }) {
  return (
    <span
      className="inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[0.8rem] font-bold"
      style={{ color: tono, borderColor: `color-mix(in oklab, ${tono} 45%, transparent)`, background: `color-mix(in oklab, ${tono} 10%, transparent)` }}
    >
      <span className="grid size-4 place-items-center">{icono}</span>
      {children}
    </span>
  )
}

const TRAYECTO = ['Apartada', 'Pago reportado', 'Confirmada']

/** Mini línea de tres tramos dentro del bloque de pago: dónde va la reserva. */
function Trayecto({ actual }: { actual: number }) {
  return (
    <ol className="mt-4 grid grid-cols-3 gap-2" aria-label={`Paso ${actual} de 3: ${TRAYECTO[actual - 1]}`}>
      {TRAYECTO.map((t, i) => {
        const n = i + 1
        const lleno = n <= actual
        return (
          <li key={t}>
            <span className="block h-1 overflow-hidden rounded-full bg-carbon-700">
              <span
                className="block h-full origin-left rounded-full bg-(--acento) transition-transform duration-700 ease-(--ease-suave)"
                style={{ transform: `scaleX(${lleno ? 1 : 0})`, transitionDelay: `${i * 150}ms` }}
              />
            </span>
            <span className={cx('mt-1.5 block text-[0.68rem]', n === actual ? 'font-bold text-(--acento)' : lleno ? 'text-ivory-300' : 'text-ivory-500/60')}>
              {t}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ Piezas */

function Perforacion() {
  return (
    <div className="relative flex items-center" aria-hidden="true">
      <span className="absolute -left-3 size-6 rounded-full bg-carbon-950" />
      <span className="mx-6 h-px flex-1 border-t border-dashed border-gold-500/25" />
      <span className="absolute -right-3 size-6 rounded-full bg-carbon-950" />
    </div>
  )
}

function Dato({ icono, etiqueta, titulo, children }: { icono: ReactNode; etiqueta: string; titulo?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-2" title={titulo}>
      <dt className="flex items-center justify-center gap-1.5 text-[0.62rem] tracking-[0.18em] text-ivory-500 uppercase">
        <span className="text-gold-400">{icono}</span>
        {etiqueta}
      </dt>
      <dd className="mt-1.5 font-display text-[1.05rem] leading-tight text-ivory-50 sm:text-lg">{children}</dd>
    </div>
  )
}
