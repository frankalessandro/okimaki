import type { EstadoReserva, Reserva } from '@okimaki/core'
import { obtenerMiReserva } from '@okimaki/db'
import { useEffect, useState, type FormEvent } from 'react'
import { olvidarReserva, recordarReserva, reservasRecordadas } from '../lib/consulta'
import { db } from '../lib/db'
import { Espera } from './Espera'
import { IconoAlerta, IconoBuscar, IconoFlecha, IconoRecargar } from './iconos'
import { PantallaPago } from './PantallaPago'
import { Pase } from './Pase'
import { CodigoReserva, codigoCompleto, codigoDe, limpiarCodigo } from './CodigoReserva'
import { Aviso, Boton } from './ui'

const FINALES: Partial<Record<EstadoReserva, string>> = {
  expired: 'El plazo de pago terminó y el cupo se liberó. Puedes reservar de nuevo cuando quieras.',
  cancelled: 'Esta reserva fue cancelada. Si tienes dudas, escríbenos por WhatsApp con tu código.',
  no_show: 'Esta reserva quedó registrada como “No se presentó”.',
}

export default function MiReserva() {
  const [codigo, setCodigo] = useState('')
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [recordadas, setRecordadas] = useState<string[]>([])
  // Mientras se abre sola la reserva recordada, no se muestra el formulario (evita un parpadeo).
  const [abriendo, setAbriendo] = useState(true)

  // La reserva más reciente de este dispositivo se abre sola.
  useEffect(() => {
    const lista = reservasRecordadas()
    setRecordadas(lista)
    if (lista[0]) {
      setCodigo(limpiarCodigo(lista[0]))
      void consultar(lista[0]).finally(() => setAbriendo(false))
    } else setAbriendo(false)
  }, [])

  async function buscar(e?: FormEvent) {
    e?.preventDefault()
    if (codigoCompleto(codigo)) await consultar(codigoDe(codigo))
  }

  async function consultar(cod: string) {
    setError(null)
    setCargando(true)
    try {
      const r = await obtenerMiReserva(db, cod.trim())
      setReserva(r)
      recordarReserva(r.public_code)
      setRecordadas(reservasRecordadas())
    } catch (err) {
      setReserva(null)
      setError((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  function olvidar(r: Reserva) {
    olvidarReserva(r.public_code)
    setRecordadas(reservasRecordadas())
    setReserva(null)
    setCodigo('')
  }

  if (abriendo) {
    return (
      <Espera texto="Abriendo tu reserva" className="py-12" />
    )
  }

  if (reserva) {
    const pendiente = reserva.status === 'held' || reserva.status === 'payment_reported'
    const final = FINALES[reserva.status]
    return (
      <div className="space-y-6">
        {final && (
          <div className="mx-auto max-w-xl">
            <Aviso tono="info" icono={<IconoAlerta />}>
              {final}
            </Aviso>
          </div>
        )}
        {pendiente ? (
          <PantallaPago reserva={reserva} onCambio={setReserva} />
        ) : (
          <div className="mx-auto max-w-xl">
            <Pase reserva={reserva} />
          </div>
        )}
        {/* Mientras falta confirmar el pago tiene sentido refrescar; ya pagada, no. */}
        {pendiente && (
          <div className="mx-auto max-w-xl">
            <Boton variante="secundario" onClick={() => void consultar(reserva.public_code)} cargando={cargando} icono={<IconoRecargar tam={18} />}>
              Actualizar estado
            </Boton>
          </div>
        )}
        <div className="mx-auto flex max-w-xl flex-col items-center gap-1 pt-2 text-center">
          <a
            href="/reservar"
            className="group inline-flex min-h-11 items-center gap-2 font-display text-lg text-gold-200 underline decoration-gold-500/40 underline-offset-[6px] transition hover:text-gold-300 hover:decoration-gold-300"
          >
            Agenda otra experiencia
            <IconoFlecha tam={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-4 text-[0.8rem] text-ivory-500">
            <button
              type="button"
              onClick={() => {
                setReserva(null)
                setCodigo('')
              }}
              className="min-h-10 underline-offset-4 transition hover:text-ivory-300 hover:underline"
            >
              Consultar otro código
            </button>
            <button type="button" onClick={() => olvidar(reserva)} className="min-h-10 underline-offset-4 transition hover:text-ivory-300 hover:underline">
              Olvidar en este dispositivo
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <form onSubmit={buscar} className="marco aparecer space-y-4 p-5 sm:p-6" noValidate>
        <div>
          <CodigoReserva
            valor={codigo}
            onCambio={(v) => {
              setCodigo(v)
              setError(null)
            }}
            onCompleto={(v) => void consultar(codigoDe(v))}
            error={error !== null}
            disabled={cargando}
          />
          <p className="mt-2 text-[0.8rem] text-ivory-500">Los 8 caracteres de tu pase y del mensaje de tu reserva. Puedes pegarlo completo.</p>
        </div>
        {error && <Aviso icono={<IconoAlerta />}>{error}</Aviso>}
        <Boton type="submit" cargando={cargando} disabled={!codigoCompleto(codigo)} icono={<IconoBuscar tam={20} />}>
          {cargando ? 'Buscando…' : 'Consultar'}
        </Boton>
      </form>

      {recordadas.length > 0 && (
        <section className="aparecer px-1" aria-labelledby="titulo-recordadas">
          <h2 id="titulo-recordadas" className="mb-2 text-center text-[0.66rem] font-bold tracking-[0.25em] text-ivory-500 uppercase">
            En este dispositivo
          </h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {recordadas.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => {
                    setCodigo(limpiarCodigo(c))
                    void consultar(c)
                  }}
                  className="min-h-10 rounded-full border border-gold-500/30 bg-carbon-900/70 px-3.5 font-mono text-[0.78rem] tracking-wide text-gold-200 transition hover:border-gold-400/60 hover:bg-carbon-800"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
