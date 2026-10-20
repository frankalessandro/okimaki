import { formatearCOP } from '@okimaki/core'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { Enso, IconoCheck, IconoChevron, IconoMas, IconoMenos } from './iconos'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ Botón */

type Gota = { id: number; x: number; y: number }

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'fantasma'
  icono?: ReactNode
  cargando?: boolean
}

/** Botón con gota de tinta al tocar; el primario lleva brillo dorado. */
export function Boton({ variante = 'primario', icono, cargando, className = '', children, onPointerDown, disabled, ...props }: BotonProps) {
  const [gotas, setGotas] = useState<Gota[]>([])

  function tocar(e: ReactPointerEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const gota = { id: Date.now() + Math.random(), x: e.clientX - r.left, y: e.clientY - r.top }
    setGotas((g) => [...g, gota])
    setTimeout(() => setGotas((g) => g.filter((x) => x.id !== gota.id)), 650)
    onPointerDown?.(e)
  }

  const estilos = {
    primario:
      'brillo bg-linear-to-b from-gold-300 via-gold-400 to-gold-600 text-carbon-950 shadow-[0_10px_30px_-10px_var(--color-gold-500),inset_0_1px_0_rgb(255_255_255/.5)] hover:shadow-[0_14px_40px_-10px_var(--color-gold-400),inset_0_1px_0_rgb(255_255_255/.6)]',
    secundario: 'border border-gold-500/35 bg-carbon-900/60 text-gold-200 hover:border-gold-400/70 hover:bg-carbon-800',
    fantasma: 'text-ivory-300 hover:bg-carbon-800 hover:text-ivory-50',
  }[variante]

  return (
    <button
      type="button"
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      onPointerDown={tocar}
      className={cx(
        'relative inline-flex min-h-13 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-5 text-[0.95rem] font-bold tracking-wide',
        'transition-[transform,box-shadow,background-color,border-color,opacity] duration-300 ease-(--ease-suave) active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-45',
        estilos,
        className,
      )}
      {...props}
    >
      {gotas.map((g) => (
        <span
          key={g.id}
          aria-hidden="true"
          className="pointer-events-none absolute size-4 rounded-full bg-current opacity-25"
          style={{ left: g.x - 8, top: g.y - 8, animation: 'gota .65s var(--ease-suave) forwards' }}
        />
      ))}
      {cargando ? <Enso className="size-6 animate-spin [animation-duration:1.4s]" grosor={9} /> : icono}
      <span>{children}</span>
    </button>
  )
}

/* ------------------------------------------------------------------ Campo */

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string
  error?: string
  ayuda?: string
  /** Control pegado a la izquierda dentro del mismo marco (p. ej. el indicativo del celular). */
  adorno?: ReactNode
}

/**
 * Campo con etiqueta flotante y subrayado dorado que se dibuja al enfocar.
 * Alto fijo de 64 px: la etiqueta flota a la misma altura en todos los campos y el texto
 * queda en una sola línea base; las notas se alinean con el texto (px-4).
 */
export function Campo({ etiqueta, error, ayuda, adorno, className = '', ...props }: CampoProps) {
  const id = useId()
  return (
    <div className={className}>
      <div
        key={error ?? 'ok'}
        className={cx(
          'group relative flex h-16 rounded-2xl border bg-carbon-900/80 transition-colors duration-300',
          error ? 'border-danger-500/60 [animation:sacudir_.4s]' : 'border-carbon-700 focus-within:border-gold-500/50 hover:border-carbon-600',
        )}
      >
        {adorno && (
          <>
            {adorno}
            <span aria-hidden="true" className="my-3.5 w-px shrink-0 bg-carbon-700" />
          </>
        )}
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={error || ayuda ? `${id}-nota` : undefined}
            className="peer h-full w-full rounded-2xl bg-transparent px-4 pt-6 pb-2 text-base text-ivory-50 outline-none placeholder:text-transparent focus:placeholder:text-ivory-500/60"
            {...props}
          />
          <label
            htmlFor={id}
            className={cx(
              'pointer-events-none absolute top-1/2 left-4 max-w-[calc(100%-2rem)] -translate-y-1/2 truncate text-[0.95rem] text-ivory-500 transition-all duration-300 ease-(--ease-suave)',
              'peer-focus:top-[1.15rem] peer-focus:text-[0.66rem] peer-focus:font-bold peer-focus:tracking-[0.14em] peer-focus:text-gold-300 peer-focus:uppercase',
              'peer-[:not(:placeholder-shown)]:top-[1.15rem] peer-[:not(:placeholder-shown)]:text-[0.66rem] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:uppercase',
            )}
          >
            {etiqueta}
          </label>
          <span
            aria-hidden="true"
            className="absolute inset-x-4 -bottom-px h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-gold-300 to-transparent transition-transform duration-500 ease-(--ease-suave) peer-focus:scale-x-100"
          />
        </div>
      </div>
      {(error || ayuda) && (
        <p id={`${id}-nota`} className={cx('mt-1.5 px-4 text-[0.78rem] leading-snug', error ? 'aparecer-suave text-danger-500' : 'text-ivory-500')}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Sello (checkbox) */

/** Casilla que se "estampa" como un sello hanko al marcarla. */
export function Sello({
  marcado,
  onCambio,
  children,
  error,
}: {
  marcado: boolean
  onCambio: (v: boolean) => void
  children: ReactNode
  error?: string
}) {
  return (
    <div>
      <label className="group flex min-h-12 cursor-pointer items-start gap-3.5 py-1">
        <input type="checkbox" className="peer sr-only" checked={marcado} onChange={(e) => onCambio(e.target.checked)} />
        <span
          aria-hidden="true"
          className={cx(
            'relative mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border transition-colors duration-300',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-400',
            marcado ? 'border-transparent' : error ? 'border-danger-500/70' : 'border-gold-500/40 group-hover:border-gold-400',
          )}
        >
          {marcado && (
            <span
              className="absolute inset-0 grid place-items-center rounded-lg bg-lacquer-500 text-ivory-50 shadow-[0_0_0_2px_var(--color-carbon-950),0_0_0_3px_color-mix(in_oklab,var(--color-lacquer-500)_60%,transparent)]"
              style={{ animation: 'estampar .45s var(--ease-rebote) both' }}
            >
              <IconoCheck tam={16} strokeWidth={2.4} dibujar />
            </span>
          )}
        </span>
        <span className="text-[0.92rem] leading-relaxed text-ivory-100">{children}</span>
      </label>
      {error && <p className="aparecer-suave pl-10.5 text-[0.8rem] text-danger-500">{error}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ Interruptor */

export function Interruptor({
  activo,
  onCambio,
  etiqueta,
  descripcion,
  icono,
}: {
  activo: boolean
  onCambio: (v: boolean) => void
  etiqueta: string
  descripcion?: string
  icono?: ReactNode
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onCambio(!activo)}
      className={cx(
        'flex min-h-16 w-full items-center gap-3.5 rounded-2xl border px-4 py-3 text-left transition-colors duration-300',
        activo ? 'border-sakura-300/50 bg-sakura-300/8' : 'border-carbon-700 bg-carbon-900/80 hover:border-carbon-600',
      )}
    >
      {icono && (
        <span
          className={cx(
            'grid size-10 shrink-0 place-items-center rounded-xl transition-all duration-500 ease-(--ease-rebote)',
            activo ? 'rotate-[-8deg] scale-110 bg-sakura-300/15 text-sakura-300' : 'bg-carbon-800 text-ivory-500',
          )}
        >
          {icono}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-medium text-ivory-50">{etiqueta}</span>
        {descripcion && <span className="block text-[0.78rem] text-ivory-500">{descripcion}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300',
          activo ? 'bg-sakura-300' : 'bg-carbon-700',
        )}
      >
        <span
          className={cx(
            'absolute top-1 left-1 size-5 rounded-full bg-ivory-50 shadow-md transition-transform duration-400 ease-(--ease-rebote)',
            activo && 'translate-x-5',
          )}
        />
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ Números animados */

/** Interpola un número hacia su nuevo valor con easing (para montos). */
export function useValorAnimado(objetivo: number, duracion = 700) {
  const [valor, setValor] = useState(objetivo)
  const desde = useRef(objetivo)
  useEffect(() => {
    const inicio = performance.now()
    const origen = desde.current
    if (origen === objetivo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      desde.current = objetivo
      setValor(objetivo)
      return
    }
    let raf = 0
    const paso = (t: number) => {
      const p = Math.min((t - inicio) / duracion, 1)
      const e = 1 - Math.pow(1 - p, 4)
      const v = Math.round(origen + (objetivo - origen) * e)
      desde.current = v
      setValor(v)
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [objetivo, duracion])
  return valor
}

export function Monto({ valor, className = '' }: { valor: number; className?: string }) {
  const v = useValorAnimado(valor)
  return (
    <span className={cx('tabular-nums', className)} aria-label={formatearCOP(valor)}>
      {formatearCOP(v)}
    </span>
  )
}

/* ------------------------------------------------------------------ Selector de personas */

/** Selector de personas: se escribe el número o se ajusta con −/+ y atajos; muestra capacidad y disponibles. */
export function SelectorPersonas({
  valor,
  max,
  onCambio,
  pedir = false,
  capacidad,
  disponibles,
  onOtraHora,
}: {
  /** 0 mientras el cliente no ha elegido cuántos vienen. */
  valor: number
  max: number
  onCambio: (v: number) => void
  /** Tocaron Continuar sin elegir: se resalta y se pide la cantidad. */
  pedir?: boolean
  /** Capacidad total de la sala en la tanda elegida. */
  capacidad: number
  /** Cupos libres en la tanda elegida (también es el máximo). */
  disponibles: number
  /** Vuelve a los tiquetes para elegir otra hora (para grupos que no caben). */
  onOtraHora: () => void
}) {
  // Mientras se escribe se guarda el texto tal cual; al salir del campo se ajusta a 1…max (o se deja en 0 si no eligieron).
  const [borrador, setBorrador] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const boton =
    'grid size-14 shrink-0 place-items-center rounded-full border border-gold-500/40 text-gold-200 transition duration-300 ease-(--ease-rebote) hover:bg-gold-500/10 active:scale-90 disabled:opacity-25 sm:size-16'
  const atajos = Array.from({ length: Math.min(max, 8) }, (_, i) => i + 1)

  function escribir(texto: string) {
    const limpio = texto.replace(/\D/g, '').slice(0, 3)
    setBorrador(limpio)
    const n = Number(limpio)
    if (limpio && n >= 1 && n <= max) {
      setAviso(null)
      onCambio(n)
    } else if (n > max) setAviso(`Esta tanda tiene ${max} ${max === 1 ? 'cupo' : 'cupos'}.`)
  }

  function confirmar() {
    if (borrador !== null) {
      const n = Number(borrador)
      if (n > max) onCambio(max)
    }
    setBorrador(null)
  }

  function fijar(n: number) {
    setBorrador(null)
    setAviso(null)
    onCambio(n)
  }

  const fraccion = capacidad ? disponibles / capacidad : 0

  return (
    <div role="group" aria-label="Número de personas">
      <div className="flex items-center justify-center gap-5 sm:gap-10">
        <button type="button" aria-label="Una persona menos" disabled={valor <= 1} onClick={() => fijar(Math.max(1, valor - 1))} className={boton}>
          <IconoMenos tam={24} />
        </button>
        <label className="group flex w-28 flex-col items-center">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="done"
            aria-label="Número de personas, puedes escribirlo"
            value={borrador ?? String(valor)}
            onChange={(e) => escribir(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={confirmar}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-invalid={pedir && valor < 1}
            className={cx(
              'w-full rounded-2xl border bg-transparent py-1 text-center font-display text-[3.25rem] leading-none tabular-nums outline-none transition-colors group-hover:border-carbon-600 focus:border-gold-500/60 focus:bg-carbon-950/60 sm:text-6xl',
              pedir && valor < 1 ? 'border-warning-500/70 text-warning-500' : cx('border-transparent', valor < 1 ? 'text-ivory-500' : 'text-ivory-50'),
            )}
          />
          <span className="mt-1 text-[0.7rem] tracking-[0.2em] text-ivory-500 uppercase">{valor === 1 ? 'persona' : 'personas'}</span>
        </label>
        <button type="button" aria-label="Una persona más" disabled={valor >= max} onClick={() => fijar(Math.min(max, valor + 1))} className={boton}>
          <IconoMas tam={24} />
        </button>
      </div>
      {pedir && valor < 1 && (
        <p role="alert" className="aparecer-suave mt-3 text-center text-[0.85rem] font-bold text-warning-500">
          Elige cuántas personas vienen para continuar.
        </p>
      )}
      {(aviso || valor >= max) && (
        <p className="aparecer-suave mt-3 text-center text-[0.8rem] text-warning-500">
          {aviso ?? `Llegaste al máximo de esta tanda (${max} ${max === 1 ? 'cupo' : 'cupos'}).`} Para más personas,{' '}
          <button type="button" onClick={onOtraHora} className="font-bold underline underline-offset-4 hover:text-warning-500/80">
            elige otra hora
          </button>
          .
        </p>
      )}

      {atajos.length > 1 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {atajos.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={n === valor}
              onClick={() => fijar(n)}
              className={cx(
                'grid size-11 place-items-center rounded-full border font-display text-base transition-all duration-300 ease-(--ease-rebote)',
                n === valor
                  ? 'scale-110 border-gold-400 bg-gold-400 text-carbon-950'
                  : 'border-carbon-600 text-ivory-300 hover:border-gold-500/60 hover:text-ivory-50',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-carbon-700 bg-carbon-950/40 p-3.5 text-center">
          <p className="text-[0.62rem] font-bold tracking-[0.2em] text-ivory-500 uppercase">Capacidad de la sala</p>
          <p className="mt-1 font-display text-2xl text-ivory-50">{capacidad}</p>
          <p className="text-[0.7rem] text-ivory-500">personas por tanda</p>
        </div>
        <div className="rounded-2xl border border-carbon-700 bg-carbon-950/40 p-3.5 text-center">
          <p className="text-[0.62rem] font-bold tracking-[0.2em] text-ivory-500 uppercase">Disponibles</p>
          <p className={cx('mt-1 font-display text-2xl', fraccion <= 0.25 ? 'text-warning-500' : 'text-gold-200')}>{disponibles}</p>
          <p className="text-[0.7rem] text-ivory-500">cupos libres</p>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-carbon-700" aria-hidden="true">
        <span
          className="block h-full origin-left rounded-full bg-gold-400 transition-transform duration-700 ease-(--ease-suave)"
          style={{ transform: `scaleX(${fraccion})` }}
        />
      </div>
      <p className="mt-3 text-center text-[0.78rem] text-ivory-500">Te incluyes tú en el número de personas.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ Copiar */

/**
 * Copia un texto al portapapeles. Si el navegador lo bloquea (el de Instagram a veces lo hace),
 * deja seleccionado el elemento de respaldo para copiarlo a mano.
 */
export function useCopiar(respaldo?: { current: HTMLElement | null }) {
  const [estado, setEstado] = useState<'si' | 'manual' | null>(null)
  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setEstado('si')
      setTimeout(() => setEstado(null), 2400)
    } catch {
      setEstado('manual')
      const el = respaldo?.current
      if (el instanceof HTMLInputElement) {
        el.focus()
        el.select()
      } else if (el) {
        const rango = document.createRange()
        rango.selectNodeContents(el)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(rango)
      }
    }
  }
  return { estado, copiar }
}

/* ------------------------------------------------------------------ Desplegable */

type Opcion<T> = { valor: T; etiqueta: string; detalle?: string; deshabilitada?: boolean }

/** Menú desplegable propio: teclado (flechas, Enter, Escape), clic afuera y animación de origen. */
export function Desplegable<T extends string>({
  valor,
  opciones,
  onCambio,
  etiquetaAccesible,
  children,
}: {
  valor: T
  opciones: Opcion<T>[]
  onCambio: (v: T) => void
  etiquetaAccesible: string
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const raiz = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const id = useId()

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('pointerdown', fuera)
    lista.current?.focus()
    return () => document.removeEventListener('pointerdown', fuera)
  }, [abierto])

  function abrir() {
    setActivo(Math.max(0, opciones.findIndex((o) => o.valor === valor)))
    setAbierto(true)
  }

  function elegir(i: number) {
    const o = opciones[i]
    if (!o || o.deshabilitada) return
    onCambio(o.valor)
    setAbierto(false)
  }

  function teclear(e: KeyboardEvent) {
    if (e.key === 'Escape') setAbierto(false)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((a) => Math.min(opciones.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      elegir(activo)
    }
  }

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={etiquetaAccesible}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className="group inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 transition hover:bg-carbon-800"
      >
        {children}
        <IconoChevron dir={abierto ? 'arriba' : 'abajo'} tam={16} className="text-gold-400" />
      </button>
      {abierto && (
        <ul
          ref={lista}
          id={id}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${id}-${activo}`}
          onKeyDown={teclear}
          className="absolute top-full left-1/2 z-30 mt-2 w-64 -translate-x-1/2 origin-top rounded-2xl border border-gold-500/25 bg-carbon-800/95 p-1.5 shadow-[0_24px_60px_-12px_rgb(0_0_0/.8)] outline-none backdrop-blur-xl"
          style={{ animation: 'desplegar .28s var(--ease-suave) both' }}
        >
          {opciones.map((o, i) => (
            <li
              key={o.valor}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.valor === valor}
              aria-disabled={o.deshabilitada || undefined}
              onPointerEnter={() => setActivo(i)}
              onClick={() => elegir(i)}
              className={cx(
                'aparecer-suave flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                i === activo && 'bg-carbon-700',
                o.deshabilitada && 'cursor-not-allowed opacity-40',
              )}
              style={{ '--i': i } as CSSProperties}
            >
              <span className={cx('capitalize', o.valor === valor ? 'text-gold-200' : 'text-ivory-100')}>{o.etiqueta}</span>
              <span className="flex items-center gap-2 text-xs text-ivory-500">
                {o.detalle}
                {o.valor === valor && <IconoCheck tam={16} className="text-gold-300" dibujar />}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Aviso({ tono = 'peligro', icono, children }: { tono?: 'peligro' | 'atencion' | 'info'; icono?: ReactNode; children: ReactNode }) {
  const estilos = {
    peligro: 'border-danger-500/40 bg-danger-500/8 text-danger-500',
    atencion: 'border-warning-500/40 bg-warning-500/8 text-warning-500',
    info: 'border-gold-500/30 bg-gold-500/6 text-gold-200',
  }[tono]
  return (
    <div role={tono === 'peligro' ? 'alert' : 'status'} className={cx('aparecer-suave flex gap-3 rounded-2xl border p-4 text-sm', estilos)}>
      {icono && <span className="mt-0.5 shrink-0">{icono}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export { cx }
