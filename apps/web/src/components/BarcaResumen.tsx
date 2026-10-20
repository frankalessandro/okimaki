import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { IconoFlecha } from './iconos'
import { Boton, cx, Monto } from './ui'

export type Carga = { clave: string; icono: ReactNode; texto: string; paso: number; etiqueta: string }

type Props = {
  cargas: Carga[]
  total: number | null
  etiquetaTotal: string
  pista: string
  accion: { texto: string; listo: boolean; hacer: () => void; cargando?: boolean }
  pasoActual: number
  onIr: (paso: number) => void
  /** Al confirmar la reserva la barca zarpa hacia la derecha y desaparece. */
  zarpar?: boolean
}

/** Colores del yakatabune del hero (Yakatabune.astro): la barca del resumen es la misma, estirada para llevar la carga. */
const CASCO = ['#4a2e1b', '#24150c', '#110a06'] as const
const SILUETA = '#140d08'
const DORADO = '#e6cf8e'

/** Alto del casco en px: fijo para que proa y popa (dibujadas a escala) empaten con el tramo que se estira. */
const ALTO_CASCO = 72

/**
 * La vista previa de la reserva es el yakatabune del hero: cada elección cae como carga dentro de la cabina de shoji,
 * el precio va en el casco y el botón del paso viaja con ella. Tocar una carga lleva a ese paso.
 * Proa, popa y barquero van a tamaño fijo; solo el tramo central se estira con el ancho.
 */
export function BarcaResumen({ cargas, total, etiquetaTotal, pista, accion, pasoActual, onIr, zarpar }: Props) {
  const [zarpo, setZarpo] = useState(false)
  const tira = useRef<HTMLUListElement>(null)

  // En celular la carga es una sola fila con scroll: al sumar una elección la tira se desliza para mostrarla.
  useEffect(() => {
    const el = tira.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: el.scrollWidth, behavior: suave ? 'smooth' : 'instant' })
  }, [cargas.length])

  if (zarpo) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 sm:px-6"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* Velo: lo que pasa por detrás se apaga antes de llegar a la barca, para que ni la carga ni el texto del
          formulario se mezclen. Arranca bastante arriba del techo y es casi sólido a la altura del casco. */}
      <div
        aria-hidden="true"
        className={cx(
          'absolute inset-x-0 bottom-0 h-[calc(100%+4.5rem)] bg-linear-to-t from-carbon-950 from-45% via-carbon-950/90 via-70% to-transparent transition-opacity duration-700',
          zarpar && 'opacity-0',
        )}
      />
      <div
        className={cx('pointer-events-auto relative mx-auto max-w-2xl', zarpar ? 'barca-zarpa' : 'barca-llega')}
        onAnimationEnd={(e) => {
          if (zarpar && e.animationName === 'zarpar') setZarpo(true)
        }}
      >
        {/* Halo cálido detrás, como en el hero: separa la silueta oscura del velo. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-6 -top-10 bottom-2 bg-[radial-gradient(ellipse_closest-side_at_50%_45%,rgb(243_184_102/.24),transparent)]"
          style={{ animation: 'titilar-farol 6s ease-in-out infinite' }}
        />

        <div className="barca-meca relative" style={{ filter: 'drop-shadow(0 0 18px rgb(243 184 102 / .16))' }}>
          {/* Sobre cubierta: barquero en la popa, cabina con techo en el centro y la proa alta a la derecha */}
          <div className="flex items-end">
            <Barquero />

            <div className="relative min-w-0 flex-1">
              <Techo />
              <Cabina>
                {/* Celular: una sola fila con scroll (centrada si cabe, con borde difuminado si no). Desde sm, se parte en filas. */}
                <ul
                  ref={tira}
                  className="sin-barra relative flex min-h-10 snap-x items-center gap-1.5 overflow-x-auto px-3 py-1.5 max-sm:[mask-image:linear-gradient(to_right,transparent,#000_10px,#000_calc(100%-10px),transparent)] sm:min-h-14 sm:flex-wrap sm:justify-center sm:gap-2 sm:overflow-visible sm:px-3 sm:py-2 max-sm:[&>li:first-child]:ml-auto max-sm:[&>li:last-child]:mr-auto"
                  aria-label="Lo que llevas elegido"
                >
                  {cargas.length === 0 && <li className="shrink-0 text-[0.75rem] font-bold text-[#5a3010] italic">Tu barca espera tu pedido…</li>}
                  {cargas.map((c, i) => {
                    const puede = c.paso < pasoActual
                    return (
                      <li key={`${c.clave}-${c.texto}`} className="carga shrink-0 snap-center" style={{ animationDelay: `${i * 40}ms` }}>
                        <button
                          type="button"
                          disabled={!puede}
                          onClick={() => onIr(c.paso)}
                          aria-label={puede ? `Cambiar ${c.etiqueta}: ${c.texto}` : `${c.etiqueta}: ${c.texto}`}
                          className={cx(
                            'flex min-h-8 max-w-[10rem] items-center gap-1.5 rounded-full border border-[#6b3d16] bg-carbon-950/92 px-2.5 text-[0.74rem] text-ivory-50 shadow-[0_3px_10px_-2px_rgb(60_30_10/.6)] transition sm:min-h-9 sm:max-w-[11rem] sm:px-3 sm:text-[0.78rem]',
                            puede && 'hover:-translate-y-0.5 hover:border-gold-400',
                            'disabled:cursor-default',
                          )}
                        >
                          <span className="shrink-0 text-gold-300">{c.icono}</span>
                          <span className="truncate">{c.texto}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </Cabina>
            </div>

            {/* Hueco de la proa: el casco de la proa sube hasta aquí desde abajo */}
            <span aria-hidden="true" className="w-12 shrink-0" />
          </div>

          {/* Casco */}
          <div className="relative" style={{ height: ALTO_CASCO }}>
            <div aria-hidden="true" className="absolute inset-0 flex">
              <Popa />
              <svg viewBox={`0 0 100 ${ALTO_CASCO}`} preserveAspectRatio="none" className="block h-full min-w-0 flex-1">
                <defs>
                  <Madera id="barca-casco" />
                </defs>
                <rect width="100" height={ALTO_CASCO} fill="url(#barca-casco)" />
                <Tablones ancho={100} />
                <path d="M0 0.6H100" stroke={DORADO} strokeOpacity=".8" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="w-12 shrink-0" />
            </div>
            <Proa />

            <div className="relative flex h-full items-center gap-3 pr-3 pl-7 sm:pr-5 sm:pl-9">
              <div className="min-w-0 flex-1">
                {total !== null ? (
                  <>
                    <p className="text-[0.62rem] font-bold tracking-[0.25em] text-gold-400/90 uppercase">{etiquetaTotal}</p>
                    <Monto valor={total} className="font-display text-[1.45rem] leading-tight text-ivory-50 sm:text-[1.7rem]" />
                  </>
                ) : (
                  <p className="text-sm text-ivory-300">{pista}</p>
                )}
              </div>
              <Boton
                onClick={accion.hacer}
                disabled={!accion.listo}
                cargando={accion.cargando}
                icono={!accion.cargando && <IconoFlecha tam={18} />}
                className="w-auto! shrink-0 flex-row-reverse px-5 sm:px-7"
              >
                {accion.texto}
              </Boton>
            </div>
          </div>
        </div>

        <Reflejo />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Piezas del yakatabune */

/** Degradado del casco. En la proa va en coordenadas de usuario (y1/y2) para empatar con el tramo central. */
function Madera({ id, y1, y2 }: { id: string; y1?: number; y2?: number }) {
  const enUsuario = y1 !== undefined && y2 !== undefined
  return (
    <linearGradient
      id={id}
      x1="0"
      x2="0"
      y1={enUsuario ? y1 : 0}
      y2={enUsuario ? y2 : 1}
      gradientUnits={enUsuario ? 'userSpaceOnUse' : 'objectBoundingBox'}
    >
      <stop offset="0" stopColor={CASCO[0]} />
      <stop offset=".55" stopColor={CASCO[1]} />
      <stop offset="1" stopColor={CASCO[2]} />
    </linearGradient>
  )
}

/** Las dos vetas del casco del hero, a 37 % y 70 % de su alto. */
function Tablones({ ancho, desde = 0 }: { ancho: number; desde?: number }) {
  const y1 = desde + ALTO_CASCO * 0.37
  const y2 = desde + ALTO_CASCO * 0.7
  return (
    <path
      d={`M0 ${y1}H${ancho} M0 ${y2}H${ancho}`}
      stroke="#c9a24b"
      strokeOpacity=".14"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
  )
}

/** Barquero con kasa y pértiga, de pie en la popa. Mismo trazo del hero, recortado a su figura. */
function Barquero() {
  return (
    <svg viewBox="8 34 28 36" className="relative mr-1 block h-11 w-[2.15rem] shrink-0 overflow-visible sm:h-14 sm:w-[2.7rem]" aria-hidden="true">
      <path d="M33 38 L4 104" stroke="#2a1c12" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 70 L19 52 Q22 47 26 52 L27 70 Z" fill={SILUETA} />
      <path d="M21 56 L31 46 M25 58 L32 50" stroke={SILUETA} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22.5" cy="45.5" r="3.4" fill={SILUETA} />
      <path d="M13 44.5 L22.5 36.5 L32 44.5 Q22.5 46.5 13 44.5 Z" fill="#2a1c12" stroke="#c9a24b" strokeOpacity=".6" strokeWidth=".6" />
    </svg>
  )
}

/** Techo curvo con aleros; sobresale de la cabina y de sus puntas cuelgan los faroles. */
function Techo() {
  return (
    <div className="relative z-10 -mx-3.5">
      <svg viewBox="0 0 400 30" preserveAspectRatio="none" className="block h-5 w-full overflow-visible sm:h-6" aria-hidden="true">
        <defs>
          <linearGradient id="barca-techo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b1d14" />
            <stop offset="1" stopColor="#0f0a07" />
          </linearGradient>
        </defs>
        <path d="M0 30 L34 12 Q200 -6 366 12 L400 30 Q200 20 0 30 Z" fill="url(#barca-techo)" />
        <path d="M0 30 Q200 20 400 30" fill="none" stroke={DORADO} strokeOpacity=".75" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d="M34 12 Q200 -6 366 12" fill="none" stroke={DORADO} strokeOpacity=".35" strokeWidth=".8" vectorEffect="non-scaling-stroke" />
      </svg>
      <Farol className="top-[calc(100%-3px)] left-0" />
      <Farol className="top-[calc(100%-3px)] right-0" retraso="-0.8s" />
    </div>
  )
}

/** Cabina: marco oscuro y shoji encendidos con su celosía; adentro va la carga. */
function Cabina({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mt-1.5 bg-[#120b07] px-[3px] pt-[5px] pb-[5px]">
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-[#ffe3a8] to-[#e79a45]"
          style={{ animation: 'titilar-farol 5s ease-in-out infinite' }}
        />
        {/* Celosía: postes cada 64 px y listones finos, como las ventanas del hero */}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: [
              'linear-gradient(to right, #120b07 0 3px, transparent 3px)',
              'linear-gradient(to right, rgb(107 61 22 / .45) 0 1px, transparent 1px)',
              'linear-gradient(to bottom, transparent calc(50% - .5px), rgb(107 61 22 / .45) calc(50% - .5px) calc(50% + .5px), transparent calc(50% + .5px))',
              'linear-gradient(to bottom, transparent calc(25% - .5px), rgb(107 61 22 / .3) calc(25% - .5px) calc(25% + .5px), transparent calc(25% + .5px) calc(75% - .5px), rgb(107 61 22 / .3) calc(75% - .5px) calc(75% + .5px), transparent calc(75% + .5px))',
            ].join(','),
            backgroundSize: '64px 100%, 32px 100%, 100% 100%, 100% 100%',
            backgroundPosition: '-1.5px 0, 14.5px 0, 0 0, 0 0',
          }}
        />
        {children}
      </div>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-[#2a1a10]" />
    </div>
  )
}

/** Popa del casco: se mete hacia adentro al bajar, como la del hero. */
function Popa() {
  return (
    <svg viewBox={`0 0 20 ${ALTO_CASCO}`} preserveAspectRatio="none" className="block h-full w-5 shrink-0">
      <defs>
        <Madera id="barca-popa" />
      </defs>
      <path d={`M0 0H20V${ALTO_CASCO}Q9 71 5 56Q2 42 0 0Z`} fill="url(#barca-popa)" />
      <Tablones ancho={20} />
      <path d="M0 0.6H20" stroke={DORADO} strokeOpacity=".8" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Proa alta con su pértiga y farol. Sube desde la cubierta hasta el hueco que deja la cabina. */
function Proa() {
  const cubierta = 60
  const fondo = cubierta + ALTO_CASCO
  return (
    <svg
      viewBox={`0 0 48 ${fondo}`}
      className="pointer-events-none absolute right-0 bottom-0 block w-12 overflow-visible"
      style={{ height: fondo }}
      aria-hidden="true"
    >
      <defs>
        <Madera id="barca-proa" y1={cubierta} y2={fondo} />
        <radialGradient id="barca-farol-proa" cx=".45" cy=".4" r=".6">
          <stop offset="0" stopColor="#ffb08a" />
          <stop offset=".6" stopColor="#d23b2a" />
          <stop offset="1" stopColor="#7d1810" />
        </radialGradient>
      </defs>
      {/* Pértiga con gancho y farol, como en la proa del hero */}
      <path d="M31 48 L36 8" stroke="#3a2617" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M36 8 L42 10 V13" stroke="#3a2617" strokeWidth=".9" fill="none" />
      <g style={{ animation: 'titilar-farol 2.6s ease-in-out -1.6s infinite' }}>
        <ellipse cx="42" cy="19" rx="7" ry="8" fill="#d23b2a" opacity=".3" filter="blur(3px)" />
        <ellipse cx="42" cy="18.5" rx="3.6" ry="4.8" fill="url(#barca-farol-proa)" />
        <path d="M39 14.4 H45 M39 22.6 H45" stroke="#1a110b" strokeWidth="1.1" />
      </g>
      <path
        d={`M0 ${cubierta} C18 ${cubierta} 30 52 38 38 L44 33 C43 66 37 98 23 116 C15 126 7 ${fondo} 0 ${fondo} Z`}
        fill="url(#barca-proa)"
      />
      <path d={`M0 ${cubierta + 26.6}H39 M0 ${cubierta + 50.4}H28`} stroke="#c9a24b" strokeOpacity=".14" strokeWidth="1" />
      <path d={`M0 ${cubierta} C18 ${cubierta} 30 52 38 38 L44 33`} fill="none" stroke={DORADO} strokeOpacity=".8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Farol de alero: cordel, papel rojo con anillos oscuros y su resplandor. */
function Farol({ className, retraso = '0s' }: { className: string; retraso?: string }) {
  // useId trae caracteres (: o «») que no van bien dentro de url(#…).
  const id = `barca-farol-${useId().replace(/[^\w-]/g, '')}`
  return (
    <span
      aria-hidden="true"
      className={cx('pointer-events-none absolute block w-3.5', className)}
      style={{ animation: `titilar-farol 2.6s ease-in-out ${retraso} infinite` }}
    >
      <span className="absolute inset-x-[-5px] top-2 bottom-[-3px] rounded-full bg-[#d23b2a]/45 blur-md" />
      <svg viewBox="0 0 10 17" className="relative block h-6 w-3.5">
        <defs>
          <radialGradient id={id} cx=".45" cy=".4" r=".6">
            <stop offset="0" stopColor="#ffb08a" />
            <stop offset=".6" stopColor="#d23b2a" />
            <stop offset="1" stopColor="#7d1810" />
          </radialGradient>
        </defs>
        <path d="M5 0V4.5" stroke="#3a2617" strokeWidth=".8" />
        <ellipse cx="5" cy="10.6" rx="4.4" ry="5.8" fill={`url(#${id})`} />
        <path d="M1.2 5.7H8.8 M1.2 15.5H8.8" stroke="#1a110b" strokeWidth="1.3" />
      </svg>
    </span>
  )
}

/** Reflejo del casco en el agua, con los destellos que corren y la estela de la popa. */
function Reflejo() {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-4">
      <span className="absolute inset-x-4 top-0 h-full bg-linear-to-b from-[#24150c]/70 to-transparent" />
      <svg viewBox="0 0 400 16" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path
          className="barca-destellos"
          d="M60 4H110 M150 7H230 M270 3H330 M90 11H150 M200 13H260"
          stroke="#f3c77a"
          strokeOpacity=".45"
          strokeWidth="1.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg viewBox="-40 0 40 16" className="barca-estela absolute top-0 -left-9 h-4 w-10 overflow-visible">
        <path d="M0 2 Q-14 4 -30 3 M-4 8 Q-18 11 -38 10" fill="none" stroke={DORADO} strokeOpacity=".3" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 800 20" preserveAspectRatio="none" className="absolute inset-x-0 top-1 h-3 w-full overflow-hidden">
        <g className="barca-agua">
          <path
            d="M0 10 Q25 4 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 T450 10 T500 10 T550 10 T600 10 T650 10 T700 10 T750 10 T800 10 T850 10 T900 10 T950 10 T1000 10 T1050 10 T1100 10 T1150 10 T1200 10"
            fill="none"
            stroke={DORADO}
            strokeOpacity=".3"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  )
}
