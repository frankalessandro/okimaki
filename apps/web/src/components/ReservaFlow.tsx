import {
  fechaLarga,
  fechaLocalISO,
  formatearCOP,
  horaCorta,
  NuevaReserva,
  sumarDias,
  type Reserva,
  type Tanda,
} from '@okimaki/core'
import { crearReserva, obtenerConfigPublica, obtenerDisponibilidad, type ConfigPublica } from '@okimaki/db'
import { Modal } from '@okimaki/ui'
import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { Calendario } from './Calendario'
import { PantallaPago } from './PantallaPago'
import { Boton, Campo, Seccion } from './ui'

const vacio = { nombre: '', apellido: '', celular: '', personas: 1, esCumple: false, alergias: '', terminos: false }

export default function ReservaFlow() {
  const [config, setConfig] = useState<ConfigPublica | null>(null)
  const [tandas, setTandas] = useState<Tanda[] | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [fecha, setFecha] = useState<string | null>(null)
  const [tanda, setTanda] = useState<Tanda | null>(null)
  const [form, setForm] = useState(vacio)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [verTerminos, setVerTerminos] = useState(false)
  const [reserva, setReserva] = useState<Reserva | null>(null)

  useEffect(() => {
    const hoy = fechaLocalISO()
    Promise.all([obtenerConfigPublica(db), obtenerDisponibilidad(db, hoy, sumarDias(hoy, 90))])
      .then(([c, t]) => {
        setConfig(c)
        setTandas(t)
      })
      .catch((e: Error) => setErrorCarga(e.message))
  }, [])

  if (reserva) {
    return (
      <Seccion numero={4} titulo="Pago">
        <PantallaPago reserva={reserva} onCambio={setReserva} />
      </Seccion>
    )
  }

  if (errorCarga) return <p className="text-center text-danger-500">No pudimos cargar la agenda: {errorCarga}</p>
  if (!tandas || !config) return <p className="text-center text-ivory-300">Cargando agenda…</p>

  const delDia = tandas.filter((t) => t.fecha === fecha)
  const maxPersonas = tanda?.restantes ?? 1

  async function enviar() {
    if (!tanda) return
    const parsed = NuevaReserva.safeParse({ ...form, slotId: tanda.slotId, alergias: form.alergias || undefined })
    if (!parsed.success) {
      setErrores(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
      return
    }
    setErrores({})
    setErrorEnvio(null)
    setEnviando(true)
    try {
      setReserva(await crearReserva(db, parsed.data))
    } catch (e) {
      setErrorEnvio((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const set = <K extends keyof typeof vacio>(k: K, v: (typeof vacio)[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <>
      <Seccion numero={1} titulo="Elige el día">
        <Calendario
          tandas={tandas}
          seleccion={fecha}
          onElegir={(f) => {
            setFecha(f)
            setTanda(null)
          }}
        />
      </Seccion>

      {fecha && (
        <Seccion numero={2} titulo={`Tanda · ${fechaLarga(fecha)}`}>
          <div className="grid gap-2">
            {delDia.map((t) => {
              const lleno = t.restantes === 0
              const elegida = tanda?.slotId === t.slotId
              return (
                <button
                  key={t.slotId}
                  type="button"
                  disabled={lleno}
                  onClick={() => {
                    setTanda(t)
                    set('personas', Math.min(form.personas, t.restantes))
                  }}
                  aria-pressed={elegida}
                  className={`flex min-h-14 items-center justify-between rounded-xl border px-4 text-left transition ${
                    elegida
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-carbon-600 bg-carbon-900 hover:border-gold-500/60'
                  } disabled:opacity-40`}
                >
                  <span>
                    <span className="block font-display text-lg text-ivory-50">{horaCorta(t.hora)}</span>
                    <span className="text-xs text-ivory-300">
                      {t.servicio} · {formatearCOP(t.precio)} por persona
                    </span>
                  </span>
                  <span className={`text-sm ${lleno ? 'text-lacquer-500' : t.restantes <= 3 ? 'text-warning-500' : 'text-success-500'}`}>
                    {lleno ? 'Lleno' : `${t.restantes} cupos`}
                  </span>
                </button>
              )
            })}
          </div>
        </Seccion>
      )}

      {tanda && (
        <Seccion numero={3} titulo="Tus datos">
          <div className="space-y-3">
            <Campo etiqueta="Nombre" autoComplete="given-name" value={form.nombre} error={errores.nombre} onChange={(e) => set('nombre', e.target.value)} />
            <Campo etiqueta="Apellido" autoComplete="family-name" value={form.apellido} error={errores.apellido} onChange={(e) => set('apellido', e.target.value)} />
            <Campo etiqueta="Celular" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 123 4567" value={form.celular} error={errores.celular} onChange={(e) => set('celular', e.target.value)} />

            <div>
              <span className="mb-1 block text-sm text-ivory-300">Personas (te incluyes tú)</span>
              <div className="flex items-center gap-3">
                <Boton variante="secundario" className="!w-12 !px-0" aria-label="Menos" onClick={() => set('personas', Math.max(1, form.personas - 1))}>
                  −
                </Boton>
                <span className="w-10 text-center font-display text-2xl text-ivory-50">{form.personas}</span>
                <Boton variante="secundario" className="!w-12 !px-0" aria-label="Más" onClick={() => set('personas', Math.min(maxPersonas, form.personas + 1))}>
                  +
                </Boton>
                <span className="ml-auto text-lg text-gold-300">{formatearCOP(tanda.precio * form.personas)}</span>
              </div>
              {errores.personas && <span className="mt-1 block text-sm text-danger-500">{errores.personas}</span>}
            </div>

            <label className="flex min-h-11 items-center gap-3 text-ivory-100">
              <input type="checkbox" className="size-5 accent-gold-500" checked={form.esCumple} onChange={(e) => set('esCumple', e.target.checked)} />
              Alguien del grupo cumple años (se verifica con documento)
            </label>
            <Campo etiqueta="Alergias o restricciones (opcional)" value={form.alergias} onChange={(e) => set('alergias', e.target.value)} />

            <label className="flex min-h-11 items-center gap-3 text-ivory-100">
              <input type="checkbox" className="size-5 accent-gold-500" checked={form.terminos} onChange={(e) => set('terminos', e.target.checked)} />
              <span>
                Acepto los{' '}
                <button type="button" onClick={() => setVerTerminos(true)} className="text-gold-300 underline">
                  términos y condiciones
                </button>
              </span>
            </label>
            {errores.terminos && <span className="block text-sm text-danger-500">{errores.terminos}</span>}

            {errorEnvio && <p className="rounded-xl border border-danger-500/40 p-3 text-sm text-danger-500">{errorEnvio}</p>}
            <Boton onClick={enviar} disabled={enviando}>
              {enviando ? 'Reservando…' : 'Reservar y pagar'}
            </Boton>
            <p className="text-center text-xs text-ivory-500">Tu cupo se aparta {config.hold_minutes} minutos mientras pagas.</p>
          </div>
        </Seccion>
      )}

      <Modal open={verTerminos} titulo="Términos y condiciones" onClose={() => setVerTerminos(false)}>
        <p className="whitespace-pre-line text-sm text-ivory-100">{config.terms}</p>
        <p className="mt-4 whitespace-pre-line text-sm text-ivory-300">{config.cancellation_policy}</p>
      </Modal>
    </>
  )
}
