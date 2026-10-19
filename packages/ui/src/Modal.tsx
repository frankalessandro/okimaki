import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  titulo: string
  onClose: () => void
  children: ReactNode
  pie?: ReactNode
}

/** Hoja anclada abajo en celular, centrada en escritorio; encabezado y pie fijos, cuerpo con scroll. */
export function Modal({ open, titulo, onClose, children, pie }: Props) {
  useEffect(() => {
    if (!open) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-gold-500/30 bg-carbon-800 md:max-w-md md:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-carbon-700 px-5 py-4">
          <h2 className="text-lg text-gold-300">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-full text-ivory-300 hover:bg-carbon-700"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {pie && <footer className="shrink-0 border-t border-carbon-700 px-5 py-4">{pie}</footer>}
      </div>
    </div>
  )
}
