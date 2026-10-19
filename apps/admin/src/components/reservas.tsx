import { etiquetaEstado, type EstadoReserva } from '@okimaki/core'
import { Modal } from '@okimaki/ui'
import { useEffect, useState } from 'react'
import { Boton, Campo } from './ui'

const colorEstado: Record<EstadoReserva, string> = {
  held: 'bg-warning-500/15 text-warning-500',
  payment_reported: 'bg-gold-500/15 text-gold-300',
  confirmed: 'bg-success-500/15 text-success-500',
  attended: 'bg-success-500/15 text-success-500',
  expired: 'bg-ivory-500/15 text-ivory-300',
  cancelled: 'bg-danger-500/15 text-danger-500',
  no_show: 'bg-danger-500/15 text-danger-500',
}

export function InsigniaEstado({ estado }: { estado: EstadoReserva }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs ${colorEstado[estado]}`}>{etiquetaEstado[estado]}</span>
}

/** Instante actual, refrescado cada medio minuto, para los contadores de plazo. */
export function useAhora() {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  return ahora
}

export function textoPlazo(venceEn: string | null, ahora: number): string {
  if (!venceEn) return '—'
  const min = Math.round((new Date(venceEn).getTime() - ahora) / 60_000)
  if (min <= 0) return 'vencido'
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`
}

type ModalTextoProps = {
  abierto: boolean
  titulo: string
  etiqueta: string
  confirmar: string
  peligro?: boolean
  onCerrar: () => void
  onConfirmar: (texto: string) => Promise<void>
}

/** Pide un texto obligatorio (referencia o motivo) antes de ejecutar la acción. */
export function ModalTexto({ abierto, titulo, etiqueta, confirmar, peligro, onCerrar, onConfirmar }: ModalTextoProps) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function aceptar() {
    setError(null)
    setEnviando(true)
    try {
      await onConfirmar(texto.trim())
      setTexto('')
      onCerrar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={abierto}
      titulo={titulo}
      onClose={onCerrar}
      pie={
        <div className="flex gap-3">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Volver
          </Boton>
          <Boton variante={peligro ? 'peligro' : 'primario'} className="flex-1" disabled={!texto.trim() || enviando} onClick={aceptar}>
            {enviando ? 'Guardando…' : confirmar}
          </Boton>
        </div>
      }
    >
      <Campo etiqueta={etiqueta} value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
      {error && <p className="mt-2 text-sm text-danger-500">{error}</p>}
    </Modal>
  )
}
