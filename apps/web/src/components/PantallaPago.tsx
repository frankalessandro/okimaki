import { enlaceWhatsapp, formatearCOP, mensajeWhatsapp, type Reserva } from '@okimaki/core'
import { reportarPago } from '@okimaki/db'
import { Modal } from '@okimaki/ui'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { db } from '../lib/db'
import { IconoAlerta, IconoCheck, IconoCopiar, IconoLlave, IconoQr, IconoWhatsapp } from './iconos'
import { Pase } from './Pase'
import { Aviso, Boton, cx, Monto } from './ui'

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

type Props = {
  reserva: Reserva
  onCambio: (r: Reserva) => void
  /** Plazo de pago configurado; sin él, el anillo toma como total lo que quedaba al abrir la pantalla. */
  plazoMin?: number
}

export function PantallaPago({ reserva, onCambio, plazoMin }: Props) {
  const pago = reserva.payment
  const reportada = reserva.status === 'payment_reported'
  const restante = useRestante(reserva.hold_expires_at)
  const [totalMs] = useState(() => (plazoMin ? plazoMin * 60_000 : Math.max(restante, 1)))
  const [verQr, setVerQr] = useState(false)
  const [copiado, setCopiado] = useState<'si' | 'manual' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const llaveRef = useRef<HTMLInputElement>(null)

  if (!pago) return <Pase reserva={reserva} />

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pago!.key)
      setCopiado('si')
      setTimeout(() => setCopiado(null), 2400)
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
      onCambio(await reportarPago(db, reserva.public_code))
      setAviso(null)
    } catch (e) {
      if (intento >= 8) {
        setAviso(`No pudimos registrar el reporte automáticamente. Escríbenos por WhatsApp con tu código ${reserva.public_code}.`)
        return
      }
      setAviso('Registrando tu reporte…')
      setTimeout(() => void reportar(intento + 1), 4000)
      void e
    }
  }

  const vigente = !reportada && restante > 0

  return (
    <div className="space-y-6">
      {reportada ? null : vigente ? (
        <Cuenta restante={restante} fraccion={restante / totalMs} />
      ) : (
        <Aviso icono={<IconoAlerta />}>
          <p className="font-bold">El plazo terminó.</p>
          <p className="mt-1 opacity-90">Si no reportaste el pago, la reserva se libera y el cupo vuelve a quedar disponible. Puedes reservar de nuevo.</p>
          <a href="/reservar" className="mt-3 inline-block font-bold underline underline-offset-4">
            Volver a reservar
          </a>
        </Aviso>
      )}

      <div className={cx('grid gap-6', vigente ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10' : 'mx-auto max-w-xl')}>
        <div className="lg:sticky lg:top-6">
          <Pase reserva={reserva} acciones={reportada} />
        </div>

        {vigente && (
          <section className="aparecer space-y-4" style={{ '--i': 2 } as CSSProperties}>
            <h3 className="text-xl text-ivory-50">Cómo pagar</h3>
            <ol className="space-y-3">
              <PasoPago n={1} titulo="Transfiere el monto exacto">
                <Monto valor={reserva.total} className="font-display text-3xl text-gold-200" />
                <p className="mt-1 text-xs text-ivory-500">Pago completo, sin abonos. Ni un peso más, ni uno menos.</p>
              </PasoPago>

              <PasoPago n={2} titulo="A esta llave">
                <p className="mb-2 flex items-center gap-1.5 text-xs text-ivory-500">
                  <IconoLlave tam={14} className="text-gold-400" /> A nombre de {pago.holder}
                </p>
                <input
                  ref={llaveRef}
                  readOnly
                  value={pago.key}
                  aria-label="Llave de pago"
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded-xl border border-carbon-600 bg-carbon-950 px-4 py-3.5 font-mono text-[1.05rem] tracking-wide text-ivory-50 outline-none focus:border-gold-500/60"
                />
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Boton
                    variante="secundario"
                    onClick={copiar}
                    className={cx('min-h-12', copiado === 'si' && 'border-matcha-400/70! text-matcha-400!')}
                    icono={copiado === 'si' ? <IconoCheck tam={18} dibujar /> : <IconoCopiar tam={18} />}
                    aria-live="polite"
                  >
                    {copiado === 'si' ? 'Copiada' : 'Copiar llave'}
                  </Boton>
                  <Boton variante="secundario" className="min-h-12" onClick={() => setVerQr(true)} disabled={!pago.qr_path} icono={<IconoQr tam={18} />}>
                    Ver QR
                  </Boton>
                </div>
                {copiado === 'manual' && (
                  <p className="aparecer-suave mt-2 text-[0.8rem] text-warning-500">
                    No pudimos copiar solos: la llave quedó seleccionada, cópiala manualmente.
                  </p>
                )}
              </PasoPago>

              <PasoPago n={3} titulo="Envía el comprobante" ultimo>
                <Boton onClick={enviarComprobante} icono={<IconoWhatsapp tam={22} />}>
                  Enviar comprobante por WhatsApp
                </Boton>
                <p className="mt-2 text-center text-xs text-ivory-500">
                  Se abre WhatsApp con el mensaje listo y tu reserva queda como “pago reportado”. Adjunta la captura de la transferencia.
                </p>
              </PasoPago>
            </ol>
          </section>
        )}
      </div>

      {aviso && <Aviso tono="atencion">{aviso}</Aviso>}

      <Modal open={verQr} titulo="QR de pago" onClose={() => setVerQr(false)}>
        {pago.qr_path && (
          <div className="space-y-4 pb-2 text-center">
            <div className="relative mx-auto w-full max-w-xs">
              <img src={pago.qr_path} alt="Código QR para pagar" className="w-full rounded-2xl bg-white p-3" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-gold-400/40" />
            </div>
            <p className="text-sm text-ivory-300">
              Escanéalo desde tu app del banco y transfiere <strong className="text-gold-200">{formatearCOP(reserva.total)}</strong>.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

/** Anillo que se vacía con el plazo; se vuelve ámbar y luego rojo cuando queda poco. */
function Cuenta({ restante, fraccion }: { restante: number; fraccion: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const min = restante / 60_000
  const color = min <= 3 ? 'var(--color-lacquer-500)' : min <= 10 ? 'var(--color-warning-500)' : 'var(--color-gold-400)'
  return (
    <div className="aparecer flex items-center gap-5 rounded-3xl border border-carbon-700 bg-carbon-900/70 p-4" role="timer" aria-live="off">
      <div className={cx('relative size-28 shrink-0', min <= 3 && '[animation:latido_1.2s_ease-in-out_infinite]')}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-carbon-700)" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.min(Math.max(fraccion, 0), 1))}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke .6s' }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-[1.35rem] font-bold text-ivory-50 tabular-nums">
          {mmss(restante)}
        </span>
      </div>
      <div>
        <p className="font-display text-xl text-ivory-50">Tu mesa está apartada</p>
        <p className="mt-1 text-sm leading-relaxed text-ivory-300">
          Tienes este tiempo para transferir y enviar el comprobante. Si se acaba, el cupo se libera.
        </p>
      </div>
    </div>
  )
}

function PasoPago({ n, titulo, ultimo, children }: { n: number; titulo: string; ultimo?: boolean; children: ReactNode }) {
  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-gold-500/50 font-display text-sm text-gold-200">{n}</span>
        {!ultimo && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-linear-to-b from-gold-500/40 to-transparent" />}
      </div>
      <div className="min-w-0 flex-1 pb-3">
        <p className="mb-2 pt-1 text-[0.95rem] font-bold text-ivory-50">{titulo}</p>
        {children}
      </div>
    </li>
  )
}
