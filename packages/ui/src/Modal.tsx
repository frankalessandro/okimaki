import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

type Props = {
  open: boolean
  titulo: string
  onClose: () => void
  children: ReactNode
  pie?: ReactNode
}

const SALIDA_MS = 280

/**
 * Hoja anclada abajo en celular, centrada en escritorio; encabezado y pie fijos, cuerpo con scroll.
 * Entra y sale animada, y en celular se cierra arrastrándola hacia abajo desde el encabezado.
 */
export function Modal({ open, titulo, onClose, children, pie }: Props) {
  const [montado, setMontado] = useState(open)
  const [visible, setVisible] = useState(false)
  const [arrastre, setArrastre] = useState(0)
  const inicio = useRef<{ y: number; t: number } | null>(null)

  if (open && !montado) setMontado(true)

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const t = setTimeout(() => setMontado(false), SALIDA_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', alTeclear)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  function bajar(e: ReactPointerEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    inicio.current = { y: e.clientY, t: performance.now() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function mover(e: ReactPointerEvent<HTMLElement>) {
    if (!inicio.current) return
    setArrastre(Math.max(0, e.clientY - inicio.current.y))
  }
  function soltar(e: ReactPointerEvent<HTMLElement>) {
    const i = inicio.current
    inicio.current = null
    if (!i) return
    const dy = e.clientY - i.y
    const velocidad = dy / (performance.now() - i.t)
    setArrastre(0)
    if (dy > 120 || velocidad > 0.6) onClose()
  }

  if (!montado) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
      onClick={onClose}
      style={{
        backgroundColor: visible ? 'rgb(0 0 0 / .72)' : 'rgb(0 0 0 / 0)',
        backdropFilter: visible ? 'blur(6px)' : 'blur(0)',
        transition: `background-color ${SALIDA_MS}ms ease, backdrop-filter ${SALIDA_MS}ms ease`,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-3xl border border-gold-500/30 bg-carbon-800 shadow-[0_-20px_60px_-20px_rgb(0_0_0/.9)] md:max-w-md md:rounded-3xl"
        style={{
          transform: visible ? `translateY(${arrastre}px)` : 'translateY(100%)',
          opacity: visible ? 1 : 0,
          transition: arrastre
            ? 'none'
            : `transform ${visible ? 480 : SALIDA_MS}ms cubic-bezier(.22,1,.36,1), opacity ${SALIDA_MS}ms ease`,
        }}
      >
        <header
          className="relative flex shrink-0 touch-none items-center justify-between border-b border-carbon-700 px-5 pt-5 pb-4"
          onPointerDown={bajar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        >
          <span aria-hidden="true" className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-carbon-600 md:hidden" />
          <h2 className="text-lg text-gold-300">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-10 place-items-center rounded-full text-ivory-300 transition hover:rotate-90 hover:bg-carbon-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {pie && <footer className="shrink-0 border-t border-carbon-700 px-5 py-4">{pie}</footer>}
      </div>
    </div>
  )
}
