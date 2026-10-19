import { enlaceWhatsapp, fechaLarga, formatearCOP, horaCorta, mensajeWhatsapp, type Reserva } from '@okimaki/core'
import { reportarPago } from '@okimaki/db'
import { Modal } from '@okimaki/ui'
import { useEffect, useRef, useState } from 'react'
import { db } from '../lib/db'
import { Boton, Tarjeta } from './ui'

function useRestante(venceEn: string | null) {
  const [ms, setMs] = useState(() => (venceEn ? new Date(venceEn).getTime() - Date.now() : 0))
  useEffect(() => {
    if (!venceEn) return
    const calcular = () => setMs(new Date(venceEn).getTime() - Date.now())
    calcular()
    const id = setInterval(calcular, 1000)
    return () => clearInterval(id)
  }, [venceEn])
  return Math.max(ms, 0)
}

function mmss(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

type Props = { reserva: Reserva; onCambio: (r: Reserva) => void }

export function PantallaPago({ reserva, onCambio }: Props) {
  const pago = reserva.payment
  const reportada = reserva.status === 'payment_reported'
  const restante = useRestante(reserva.hold_expires_at)
  const [verQr, setVerQr] = useState(false)
  const [copiado, setCopiado] = useState<'si' | 'manual' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const llaveRef = useRef<HTMLInputElement>(null)

  if (!pago) return null

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pago!.key)
      setCopiado('si')
    } catch {
      // El navegador interno de Instagram puede bloquear el portapapeles: selección manual.
      setCopiado('manual')
      llaveRef.current?.focus()
      llaveRef.current?.select()
    }
  }

  function enviarComprobante() {
    const texto = mensajeWhatsapp(pago!.whatsapp_template, reserva)
    window.open(enlaceWhatsapp(pago!.whatsapp_number, texto), '_blank', 'noopener')
    void reportar(0)
  }

  /** Reporta el pago; si falla, WhatsApp ya se abrió y se reintenta en segundo plano. */
  async function reportar(intento: number): Promise<void> {
    try {
      onCambio(await reportarPago(db, reserva.code))
      setAviso(null)
    } catch (e) {
      if (intento >= 8) {
        setAviso(`No pudimos registrar el reporte automáticamente. Escríbenos por WhatsApp con tu código ${reserva.code}.`)
        return
      }
      setAviso('Registrando tu reporte…')
      setTimeout(() => void reportar(intento + 1), 4000)
      void e
    }
  }

  return (
    <div className="space-y-4">
      <Tarjeta className="text-center">
        <p className="text-sm text-ivory-300">Tu código</p>
        <p className="font-display text-2xl tracking-widest text-gold-300">{reserva.code}</p>
        <p className="mt-2 text-sm text-ivory-300">
          {fechaLarga(reserva.slot_date)} · {horaCorta(reserva.start_time)} · {reserva.party_size}{' '}
          {reserva.party_size === 1 ? 'persona' : 'personas'}
        </p>
      </Tarjeta>

      <Tarjeta className="text-center">
        <p className="text-sm text-ivory-300">Monto exacto a transferir</p>
        <p className="font-display text-4xl text-ivory-50">{formatearCOP(reserva.total)}</p>
      </Tarjeta>

      {reportada ? (
        <Tarjeta className="border-success-500/40 text-center">
          <p className="font-semibold text-success-500">Pago reportado</p>
          <p className="mt-1 text-sm text-ivory-300">
            Estamos verificando tu transferencia. Te confirmaremos por WhatsApp. Puedes consultar el estado en “Mi reserva”.
          </p>
        </Tarjeta>
      ) : restante > 0 ? (
        <p className="text-center text-sm text-ivory-300">
          Tienes <span className="font-mono text-lg text-gold-300">{mmss(restante)}</span> para pagar y reportar el pago.
        </p>
      ) : (
        <Tarjeta className="border-danger-500/40 text-center text-danger-500">
          El plazo terminó. Si no reportaste el pago, la reserva se libera; vuelve a reservar.
        </Tarjeta>
      )}

      {!reportada && restante > 0 && (
        <>
          <Tarjeta>
            <p className="text-sm text-ivory-300">Llave de pago · {pago.holder}</p>
            <input
              ref={llaveRef}
              readOnly
              value={pago.key}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-1 w-full rounded-lg border border-carbon-600 bg-carbon-950 px-3 py-3 font-mono text-ivory-50"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Boton variante="secundario" onClick={copiar}>
                {copiado === 'si' ? '¡Copiada!' : 'Copiar llave'}
              </Boton>
              <Boton variante="secundario" onClick={() => setVerQr(true)} disabled={!pago.qr_path}>
                Ver QR
              </Boton>
            </div>
            {copiado === 'manual' && (
              <p className="mt-2 text-sm text-warning-500">No pudimos copiar solos: la llave quedó seleccionada, cópiala manualmente.</p>
            )}
          </Tarjeta>
          <Boton onClick={enviarComprobante}>Enviar comprobante por WhatsApp</Boton>
          <p className="text-center text-xs text-ivory-500">
            Al tocar el botón se abre WhatsApp con el mensaje listo y quedas como “pago reportado”.
          </p>
        </>
      )}

      {aviso && <p className="text-center text-sm text-warning-500">{aviso}</p>}

      <Modal open={verQr} titulo="QR de pago" onClose={() => setVerQr(false)}>
        {pago.qr_path && <img src={pago.qr_path} alt="Código QR para pagar" className="mx-auto w-full max-w-xs rounded-xl bg-white p-2" />}
      </Modal>
    </div>
  )
}
