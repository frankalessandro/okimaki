import { etiquetaEstado, fechaLarga, formatearCOP, horaCorta, type Reserva } from '@okimaki/core'
import { obtenerMiReserva } from '@okimaki/db'
import { useState } from 'react'
import { db } from '../lib/db'
import { PantallaPago } from './PantallaPago'
import { Boton, Campo, Tarjeta } from './ui'

export default function MiReserva() {
  const [codigo, setCodigo] = useState('')
  const [identificador, setIdentificador] = useState('')
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function buscar() {
    setError(null)
    setCargando(true)
    try {
      setReserva(await obtenerMiReserva(db, codigo, identificador))
    } catch (e) {
      setReserva(null)
      setError((e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  if (reserva) {
    const pendiente = reserva.status === 'held' || reserva.status === 'payment_reported'
    return (
      <div className="space-y-4">
        <Tarjeta className="text-center">
          <p className="text-sm text-ivory-300">Estado</p>
          <p className="font-display text-2xl text-gold-300">{etiquetaEstado[reserva.status]}</p>
        </Tarjeta>
        {pendiente ? (
          <PantallaPago reserva={reserva} onCambio={setReserva} />
        ) : (
          <Tarjeta className="space-y-1 text-center text-ivory-100">
            <p className="font-display text-xl tracking-widest text-gold-300">{reserva.code}</p>
            <p>
              {fechaLarga(reserva.slot_date)} · {horaCorta(reserva.start_time)}
            </p>
            <p>
              {reserva.party_size} {reserva.party_size === 1 ? 'persona' : 'personas'} · {formatearCOP(reserva.total)}
            </p>
          </Tarjeta>
        )}
        <Boton variante="secundario" onClick={() => setReserva(null)}>
          Consultar otra reserva
        </Boton>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Campo etiqueta="Código de reserva" placeholder="OKIMAKI-000123" autoCapitalize="characters" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
      <Campo etiqueta="Apellido o celular" value={identificador} onChange={(e) => setIdentificador(e.target.value)} />
      {error && <p className="rounded-xl border border-danger-500/40 p-3 text-sm text-danger-500">{error}</p>}
      <Boton onClick={buscar} disabled={cargando || !codigo || !identificador}>
        {cargando ? 'Buscando…' : 'Consultar'}
      </Boton>
    </div>
  )
}
