import { fechaLocalISO, sumarDias, type Tanda } from '@okimaki/core'
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { Experiencia } from '../lib/experiencias'
import { Enso, IconoChevron } from './iconos'
import { cx, Desplegable } from './ui'

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const fmtMes = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'long', year: 'numeric' })
const fmtDiaLargo = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })

const nombreMes = (mes: string) => fmtMes.format(new Date(`${mes}-01T12:00:00Z`))

type Dia = { libres: number; cupo: number; mayor: number; acentos: string[] }

type Props = {
  tandas: Tanda[]
  experiencias: Experiencia[]
  filtro: string | null
  /** Tamaño del grupo: solo se habilitan los días con alguna tanda donde quepa. */
  personas: number
  mes: string
  onMes: (mes: string) => void
  seleccion: string | null
  onElegir: (fecha: string) => void
}

/** Calendario propio: se desliza con el dedo, puntos de color por experiencia y barra de cupo por día. */
export function Calendario({ tandas, experiencias, filtro, personas, mes, onMes, seleccion, onElegir }: Props) {
  const hoy = fechaLocalISO()
  const [direccion, setDireccion] = useState<'izq' | 'der'>('izq')
  const [arrastre, setArrastre] = useState(0)
  const inicio = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const huboArrastre = useRef(false)

  const acento = new Map(experiencias.map((e) => [e.id, e.acento]))
  const porFecha = new Map<string, Dia>()
  for (const t of tandas) {
    if (filtro && t.servicioId !== filtro) continue
    const d = porFecha.get(t.fecha) ?? { libres: 0, cupo: 0, mayor: 0, acentos: [] }
    d.libres += t.restantes
    d.mayor = Math.max(d.mayor, t.restantes)
    d.cupo += t.cupo
    const a = acento.get(t.servicioId)
    if (a && !d.acentos.includes(a)) d.acentos.push(a)
    porFecha.set(t.fecha, d)
  }

  const primerMes = hoy.slice(0, 7)
  const ultimoMes = (tandas.at(-1)?.fecha ?? hoy).slice(0, 7)
  const meses: string[] = []
  for (let m = primerMes; m <= ultimoMes; m = sumarDias(`${m}-01`, 32).slice(0, 7)) meses.push(m)

  const [anio, mesNum] = mes.split('-').map(Number)
  const desfase = (new Date(Date.UTC(anio, mesNum - 1, 1)).getUTCDay() + 6) % 7 // lunes = 0
  const diasEnMes = new Date(Date.UTC(anio, mesNum, 0)).getUTCDate()
  const indice = meses.indexOf(mes)

  function irA(nuevo: string | undefined) {
    if (!nuevo || nuevo === mes) return
    setDireccion(nuevo > mes ? 'izq' : 'der')
    onMes(nuevo)
  }

  function bajar(e: ReactPointerEvent) {
    inicio.current = { x: e.clientX, y: e.clientY, horizontal: null }
    huboArrastre.current = false
  }
  function mover(e: ReactPointerEvent) {
    const i = inicio.current
    if (!i) return
    const dx = e.clientX - i.x
    const dy = e.clientY - i.y
    if (i.horizontal === null && Math.hypot(dx, dy) > 8) i.horizontal = Math.abs(dx) > Math.abs(dy)
    if (i.horizontal) {
      huboArrastre.current = true
      const bordes = (dx > 0 && indice === 0) || (dx < 0 && indice === meses.length - 1)
      setArrastre(bordes ? dx * 0.2 : dx * 0.6)
    }
  }
  function soltar(e: ReactPointerEvent) {
    const i = inicio.current
    inicio.current = null
    setArrastre(0)
    if (!i?.horizontal) return
    const dx = e.clientX - i.x
    if (dx < -50) irA(meses[indice + 1])
    else if (dx > 50) irA(meses[indice - 1])
  }

  const opciones = meses.map((m) => {
    const abiertos = [...porFecha.entries()].filter(([f, d]) => f.startsWith(m) && d.mayor >= personas).length
    return { valor: m, etiqueta: nombreMes(m), detalle: abiertos ? `${abiertos} días` : 'sin cupos', deshabilitada: !abiertos }
  })

  return (
    <div className="marco overflow-hidden p-3 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <BotonMes dir="izq" onClick={() => irA(meses[indice - 1])} disabled={indice <= 0} />
        <Desplegable valor={mes} opciones={opciones} onCambio={irA} etiquetaAccesible={`Cambiar mes, ahora ${nombreMes(mes)}`}>
          <span className="font-display text-xl text-ivory-50 capitalize sm:text-2xl">{nombreMes(mes)}</span>
        </Desplegable>
        <BotonMes dir="der" onClick={() => irA(meses[indice + 1])} disabled={indice >= meses.length - 1} />
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[0.7rem] font-bold tracking-wider text-ivory-500 uppercase sm:gap-2 sm:text-xs">
        {DIAS.map((d) => (
          <span key={d} className="py-1.5">
            {d}
          </span>
        ))}
      </div>

      <div
        className="touch-pan-y select-none"
        onPointerDown={bajar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onClickCapture={(e) => {
          if (huboArrastre.current) {
            e.stopPropagation()
            huboArrastre.current = false
          }
        }}
      >
        <div
          key={mes}
          role="group"
          aria-label={nombreMes(mes)}
          className="grid grid-cols-7 gap-1.5 sm:gap-2"
          style={{
            transform: arrastre ? `translateX(${arrastre}px)` : undefined,
            opacity: arrastre ? 1 - Math.min(Math.abs(arrastre) / 400, 0.5) : undefined,
            transition: arrastre ? 'none' : 'transform .4s var(--ease-suave), opacity .4s',
            animation: `deslizar-${direccion} .45s var(--ease-suave) backwards`,
          }}
        >
          {Array.from({ length: desfase }, (_, i) => (
            <span key={`v${i}`} />
          ))}
          {Array.from({ length: diasEnMes }, (_, i) => {
            const dia = i + 1
            const fecha = `${mes}-${String(dia).padStart(2, '0')}`
            const info = porFecha.get(fecha)
            const lleno = info !== undefined && info.libres === 0
            const habilitado = info !== undefined && info.mayor >= personas
            const pocos = habilitado && info.libres / info.cupo <= 0.25
            const elegido = seleccion === fecha
            const fmt = fmtDiaLargo.format(new Date(`${fecha}T12:00:00Z`))
            return (
              <button
                key={fecha}
                type="button"
                disabled={!habilitado}
                onClick={() => onElegir(fecha)}
                aria-pressed={elegido}
                aria-label={`${fmt}${lleno ? ', lleno' : habilitado ? `, ${info.libres} cupos` : info ? `, sin cupo para ${personas}` : ', sin servicio'}`}
                className={cx(
                  'relative grid aspect-square place-items-center rounded-xl text-base transition-[background-color,transform,color] duration-300 ease-(--ease-suave) sm:rounded-2xl sm:text-lg',
                  elegido
                    ? 'z-10 scale-105 bg-gold-500/15 font-bold text-gold-200'
                    : habilitado
                      ? 'bg-carbon-800/70 text-ivory-50 hover:-translate-y-0.5 hover:bg-carbon-700 active:scale-95'
                      : 'text-ivory-500/35',
                )}
                style={{ '--i': i } as CSSProperties}
              >
                {elegido && <Enso key={fecha} className="pointer-events-none absolute -inset-1 size-[calc(100%+.5rem)] text-gold-300" grosor={5} />}
                {fecha === hoy && !elegido && (
                  <span className="absolute top-1 text-[0.5rem] font-bold tracking-widest text-gold-400 uppercase">hoy</span>
                )}
                <span className={cx('relative', lleno && 'text-ivory-500/50')}>
                  {dia}
                  {lleno && (
                    <svg viewBox="0 0 30 12" aria-hidden="true" className="absolute top-1/2 -left-1.5 w-[calc(100%+.75rem)] -translate-y-1/2 text-lacquer-500">
                      <path d="M2 8.5C9 6 18 4 28 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                </span>
                {habilitado && (
                  <span className="absolute bottom-1.5 flex gap-1 sm:bottom-2.5">
                    {info.acentos.slice(0, 3).map((a) => (
                      <span key={a} className="size-1.5 rounded-full" style={{ background: a }} />
                    ))}
                  </span>
                )}
                {pocos && !elegido && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-warning-500 [animation:latido_1.6s_ease-in-out_infinite]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-carbon-700/70 pt-3 text-[0.72rem] text-ivory-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning-500" /> Últimos cupos
        </span>
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 8" className="w-4 text-lacquer-500" aria-hidden="true">
            <path d="M1 6c4-2 9-3 14-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          Lleno
        </span>
        <span className="text-ivory-500/70 lg:hidden">Desliza para cambiar de mes</span>
      </div>
    </div>
  )
}

function BotonMes({ dir, onClick, disabled }: { dir: 'izq' | 'der'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'izq' ? 'Mes anterior' : 'Mes siguiente'}
      className="grid size-12 place-items-center rounded-full text-gold-300 transition duration-300 ease-(--ease-rebote) hover:bg-carbon-800 active:scale-85 disabled:opacity-25"
    >
      <IconoChevron dir={dir} tam={20} />
    </button>
  )
}
