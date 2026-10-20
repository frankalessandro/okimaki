import { formatearCOP } from '@okimaki/core'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { duracionTexto, type Experiencia } from '../lib/experiencias'
import { IconoCerrar, IconoCheck, IconoReloj } from './iconos'
import { Boton, cx } from './ui'

const SALIDA_MS = 220

/**
 * "Ver más" de una experiencia: reproductor a pantalla completa con su video, el menú completo y el botón para elegirla.
 * Como el lightbox de felinas y del portafolio: el clip se descarga recién al abrir, el marco toma la forma del video
 * (vertical u horizontal) y al cerrar se suelta el buffer.
 */
export function VerExperiencia({
  experiencia,
  elegida,
  onElegir,
  onCerrar,
}: {
  experiencia: Experiencia | null
  elegida: boolean
  onElegir: (id: string) => void
  onCerrar: () => void
}) {
  // La experiencia se conserva mientras sale la animación de cierre.
  const [actual, setActual] = useState(experiencia)
  const [visible, setVisible] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const cerrar = useRef<HTMLButtonElement>(null)
  const abierta = experiencia !== null

  if (experiencia && experiencia !== actual) setActual(experiencia)

  useEffect(() => {
    if (abierta) {
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const t = setTimeout(() => setActual(null), SALIDA_MS)
    return () => clearTimeout(t)
  }, [abierta])

  // Teclado, scroll de fondo bloqueado y foco: se devuelve a la tarjeta que abrió el modal.
  useEffect(() => {
    if (!abierta) return
    const origen = document.activeElement as HTMLElement | null
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclear)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrar.current?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
      origen?.focus({ preventScroll: true })
    }
  }, [abierta, onCerrar])

  // Arranca al abrir (si el navegador no deja reproducir con sonido, quedan los controles) y se detiene al cerrar.
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (abierta) {
      void v.play().catch(() => {})
      return
    }
    v.pause()
  }, [abierta, actual])

  // Al desmontar el reproductor se suelta el clip: sin esto sigue en memoria tras cerrar.
  useEffect(() => {
    const v = video.current
    return () => {
      if (!v) return
      v.removeAttribute('src')
      v.load()
    }
  }, [actual])

  if (!actual) return null
  const e = actual
  const vertical = e.video?.orientacion === 'vertical'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={e.nombre}
      onClick={onCerrar}
      className={cx(
        'fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-carbon-950/90 backdrop-blur-lg transition-opacity duration-200 ease-(--ease-suave)',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ '--acento': e.acento } as CSSProperties}
    >
      <button
        ref={cerrar}
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="fixed top-4 right-4 z-10 grid size-11 place-items-center rounded-full border border-ivory-50/20 bg-ivory-50/10 text-ivory-50 transition hover:bg-ivory-50/20"
      >
        <IconoCerrar tam={20} />
      </button>

      <div className="flex min-h-full items-center justify-center px-4 py-18">
        <div
          onClick={(ev) => ev.stopPropagation()}
          className={cx(
            'grid w-full justify-items-center gap-6 transition-transform duration-400 ease-(--ease-suave) motion-reduce:transition-none',
            visible ? 'translate-y-0 scale-100' : 'translate-y-6 scale-[0.96]',
            vertical ? 'max-w-4xl md:grid-cols-[auto_minmax(0,24rem)] md:items-center md:gap-10' : 'max-w-[920px]',
          )}
        >
          {e.video && (
            <div
              className="overflow-hidden rounded-3xl border border-(--acento)/30 bg-black shadow-[0_30px_80px_-30px_var(--acento)]"
              // El marco sigue la forma del clip; el vertical además cabe en el alto de la pantalla.
              style={{ width: vertical ? 'min(400px, 82vw, calc(72svh * 9 / 16))' : 'min(920px, 100%)' }}
            >
              <video
                ref={video}
                key={e.video.src}
                src={e.video.src}
                poster={e.video.poster}
                controls
                playsInline
                preload="none"
                className={cx('block w-full bg-black', vertical ? 'aspect-9/16' : 'aspect-video')}
              />
            </div>
          )}

          <div className={cx('w-full', !vertical && 'max-w-2xl')}>
            <span className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.25em] text-(--acento) uppercase">
              <span className="size-1.5 rounded-full bg-(--acento)" />
              {e.dias}
            </span>
            <h2 className="mt-2 text-[1.9rem] leading-tight text-ivory-50">{e.nombre}</h2>
            {e.frase && <p className="mt-1 text-gold-200">{e.frase}</p>}

            <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-1">
              <p>
                <span className="font-display text-[1.6rem] leading-none text-ivory-50">{formatearCOP(e.precio)}</span>
                <span className="ml-1.5 text-[0.75rem] text-ivory-500">por persona</span>
              </p>
              <p className="flex items-center gap-1.5 text-[0.8rem] text-ivory-300">
                <IconoReloj tam={15} className="text-(--acento)" /> {duracionTexto(e.duracionMin)}
              </p>
            </div>

            {e.incluye.length > 0 && (
              <ul className="mt-5 grid gap-1.5">
                {e.incluye.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-[0.88rem] text-ivory-100">
                    <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-(--acento)/15 text-(--acento)">
                      <IconoCheck tam={12} strokeWidth={2.6} />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            )}

            {e.menu && (
              <div className="mt-5 border-t border-carbon-700/70 pt-4">
                <p className="text-[0.66rem] font-bold tracking-[0.25em] text-ivory-500 uppercase">Menú</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ivory-100">{e.menu}</p>
              </div>
            )}

            <div className="mt-6">
              {elegida ? (
                <Boton variante="secundario" icono={<IconoCheck tam={18} strokeWidth={2.4} />} onClick={onCerrar}>
                  Ya la elegiste
                </Boton>
              ) : (
                <Boton
                  onClick={() => {
                    onElegir(e.id)
                    onCerrar()
                  }}
                >
                  Seleccionar esta experiencia
                </Boton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
