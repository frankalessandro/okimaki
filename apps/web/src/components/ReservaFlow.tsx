import { fechaLarga, fechaLocalISO, formatearCOP, horaCorta, NuevaReserva, sumarDias, type Reserva, type Tanda } from '@okimaki/core'
import { crearReserva, obtenerConfigPublica, obtenerDisponibilidad, type ConfigPublica } from '@okimaki/db'
import { Modal } from '@okimaki/ui'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { recordarReserva } from '../lib/consulta'
import { db } from '../lib/db'
import { agruparExperiencias, duracionTexto, type Experiencia } from '../lib/experiencias'
import { celularCompleto, COLOMBIA, type Pais } from '../lib/paises'
import { BarcaResumen, type Carga } from './BarcaResumen'
import { Calendario } from './Calendario'
import { Espera } from './Espera'
import { CampoCelular } from './CampoCelular'
import { TarjetasExperiencia, TiqueteTanda, TiraDias } from './Experiencias'
import {
  Enso,
  IconoAlerta,
  IconoBuscar,
  IconoCalendario,
  IconoCheck,
  IconoChevron,
  IconoInstagram,
  IconoPastel,
  IconoPersonas,
  IconoRecargar,
  IconoReloj,
} from './iconos'
import { PantallaPago } from './PantallaPago'
import { Aviso, Boton, Campo, cx, Interruptor, SelectorPersonas, Sello } from './ui'

const PASOS = [
  { titulo: 'Elige tu experiencia', corto: 'Experiencia', kanji: '食', ayuda: 'Cada experiencia tiene su menú, su precio y sus días.' },
  { titulo: '¿Cuándo vienen?', corto: 'Fecha y hora', kanji: '時', ayuda: 'Elige el día y la hora; después nos dices cuántos vienen.' },
  { titulo: '¿Quién reserva?', corto: 'Datos', kanji: '名', ayuda: 'Con estos datos te confirmamos por WhatsApp.' },
  { titulo: 'Paga y confirma', corto: 'Pago', kanji: '払', ayuda: 'Transfiere y envía el comprobante antes de que termine el plazo.' },
]

const fmtCarga = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })

const vacio = { nombre: '', apellido: '', celular: '', esCumple: false, alergias: '', terminos: false }

type Direccion = 'adelante' | 'atras'

/** Lo que tarda en salir la pantalla actual antes de mostrar la siguiente (coincide con .paso-saliendo). */
const SALIDA_MS = 180

export default function ReservaFlow() {
  const [config, setConfig] = useState<ConfigPublica | null>(null)
  const [tandas, setTandas] = useState<Tanda[] | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [intentoCarga, setIntentoCarga] = useState(0)

  const [paso, setPaso] = useState(1)
  const [direccion, setDireccion] = useState<Direccion>('adelante')
  const [expId, setExpId] = useState<string | null>(null)
  const [personas, setPersonas] = useState(0)
  // Se enciende si tocan Continuar sin haber dicho cuántos vienen: resalta el selector.
  const [pedirPersonas, setPedirPersonas] = useState(false)
  const [mes, setMes] = useState(() => fechaLocalISO().slice(0, 7))
  const [fecha, setFecha] = useState<string | null>(null)
  const [verCalendario, setVerCalendario] = useState(false)
  const [tanda, setTanda] = useState<Tanda | null>(null)
  const [form, setForm] = useState(vacio)
  const [pais, setPais] = useState<Pais>(COLOMBIA)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [verTerminos, setVerTerminos] = useState(false)
  const [reserva, setReserva] = useState<Reserva | null>(null)
  // El cambio de paso va en secuencia: sale la pantalla actual y luego entra la nueva, nunca las dos a la vez.
  const [saliendo, setSaliendo] = useState(false)

  const raiz = useRef<HTMLDivElement>(null)
  const seccionPersonas = useRef<HTMLElement>(null)
  const pasoRef = useRef(paso)
  const reservaRef = useRef(reserva)
  const cambiarRef = useRef<(dir: Direccion, cambio: () => void) => void>(() => {})

  useEffect(() => {
    const hoy = fechaLocalISO()
    Promise.all([obtenerConfigPublica(db), obtenerDisponibilidad(db, hoy, sumarDias(hoy, 90))])
      .then(([c, t]) => {
        setConfig(c)
        setTandas(t)
      })
      .catch((e: Error) => setErrorCarga(e.message))
  }, [intentoCarga])

  // Cada paso es una entrada del historial: el botón "atrás" del celular retrocede un paso.
  useEffect(() => {
    history.replaceState({ ...history.state, okimakiPaso: 1 }, '')
    const alVolver = (e: PopStateEvent) => {
      const p = (e.state as { okimakiPaso?: number } | null)?.okimakiPaso
      if (!p || reservaRef.current) return
      const dir = p < pasoRef.current ? 'atras' : 'adelante'
      cambiarRef.current(dir, () => setPaso(p))
    }
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [])

  useEffect(() => {
    pasoRef.current = paso
    reservaRef.current = reserva
  }, [paso, reserva])

  /**
   * Cambio de pantalla en tres tiempos: la actual sale (SALIDA_MS), con todo invisible se sube al inicio
   * del flujo sin animación y se cambia el paso, y la nueva entra. Así no se cruzan contenidos ni se ve el salto.
   */
  function cambiarPantalla(dir: Direccion, cambio: () => void) {
    if (saliendo) return // un segundo toque durante la salida no encadena otra transición
    const aplicar = () => {
      cambio()
      setDireccion(dir)
      setSaliendo(false)
      const top = raiz.current?.getBoundingClientRect().top ?? 0
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 16, behavior: 'instant' })
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return aplicar()
    setDireccion(dir)
    setSaliendo(true)
    setTimeout(aplicar, SALIDA_MS)
  }
  cambiarRef.current = cambiarPantalla

  function avanzar(n: number) {
    history.pushState({ ...history.state, okimakiPaso: n }, '')
    cambiarPantalla('adelante', () => setPaso(n))
  }
  /** Volver a un paso anterior usando el historial, para que "atrás" y "adelante" sigan cuadrando. */
  function volverA(n: number) {
    if (n < paso) history.go(n - paso)
  }

  if (errorCarga) {
    return (
      <Aviso icono={<IconoAlerta />}>
        <p className="font-bold">No pudimos cargar la agenda.</p>
        <p className="mt-1 opacity-90">{errorCarga}</p>
        <button
          type="button"
          onClick={() => {
            setErrorCarga(null)
            setIntentoCarga((n) => n + 1)
          }}
          className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold underline underline-offset-4"
        >
          <IconoRecargar tam={16} /> Reintentar
        </button>
      </Aviso>
    )
  }

  if (!tandas || !config) return <Cargando />

  if (tandas.length === 0) {
    return (
      <div className="marco aparecer mx-auto max-w-md p-6 text-center">
        <Enso className="mx-auto size-16 text-gold-400" />
        <p className="mt-4 font-display text-xl text-ivory-50">Aún no hay fechas abiertas</p>
        <p className="mt-2 text-sm text-ivory-300">Muy pronto abriremos nuevas tandas. Síguenos para enterarte primero.</p>
        <a
          href="https://www.instagram.com/okimaki369/"
          target="_blank"
          rel="noopener"
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-gold-200 underline underline-offset-4"
        >
          <IconoInstagram tam={18} /> @okimaki369
        </a>
      </div>
    )
  }

  const experiencias = agruparExperiencias(tandas)
  const exp = experiencias.find((e) => e.id === expId) ?? null
  const tandasExp = tandas.filter((t) => t.servicioId === expId)
  const fechasExp = [...new Set(tandasExp.map((t) => t.fecha))].map((f) => ({
    fecha: f,
    habilitada: tandasExp.some((t) => t.fecha === f && t.restantes > 0),
  }))
  const delDia = tandasExp.filter((t) => t.fecha === fecha)
  // Si el historial lleva a un paso cuyos datos ya no existen (p. ej. "adelante" tras cambiar de experiencia), se muestra el último paso válido.
  const pasoVisible = paso === 4 ? 4 : Math.min(paso, !exp ? 1 : !tanda ? 2 : 3)
  const setCampo = <K extends keyof typeof vacio>(k: K, v: (typeof vacio)[K]) => setForm((f) => ({ ...f, [k]: v }))

  function elegirExperiencia(id: string) {
    if (id === expId) return
    const nueva = experiencias.find((e) => e.id === id)
    setExpId(id)
    setFecha(null)
    setTanda(null)
    setVerCalendario(false)
    if (nueva?.fechas[0]) setMes(nueva.fechas[0].slice(0, 7))
  }

  /** Al elegir la hora, el grupo queda topado en los cupos de esa tanda. */
  function elegirTanda(t: Tanda) {
    setTanda(t)
    setPersonas((p) => Math.min(p, t.restantes))
  }

  function elegirPersonas(n: number) {
    setPersonas(n)
    if (n >= 1) setPedirPersonas(false)
  }

  /** Sin cantidad elegida, Continuar lleva al selector de personas en vez de avanzar. */
  function continuarDesdeHora() {
    if (personas >= 1) return avanzar(3)
    setPedirPersonas(true)
    const seccion = seccionPersonas.current
    if (!seccion) return
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches
    seccion.scrollIntoView({ behavior: suave ? 'smooth' : 'instant', block: 'center' })
    seccion.focus({ preventScroll: true })
  }

  async function enviar() {
    if (!tanda) return
    const parsed = NuevaReserva.safeParse({
      ...form,
      celular: celularCompleto(pais, form.celular),
      personas,
      slotId: tanda.slotId,
      alergias: form.alergias || undefined,
    })
    if (!parsed.success) {
      const nuevos = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))
      if (nuevos.celular && pais.iso !== COLOMBIA.iso) nuevos.celular = `Revisa el número de ${pais.nombre}: escríbelo sin el +${pais.indicativo}.`
      setErrores(nuevos)
      // El foco lleva al primer campo con error; el navegador lo trae a la vista.
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 50)
      return
    }
    setErrores({})
    setErrorEnvio(null)
    setEnviando(true)
    try {
      const r = await crearReserva(db, parsed.data)
      recordarReserva(r.public_code)
      setReserva(r)
      avanzar(4)
    } catch (e) {
      setErrorEnvio((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const accion =
    pasoVisible === 1
      ? { texto: 'Continuar', listo: exp !== null, hacer: () => avanzar(2) }
      : pasoVisible === 2
        ? { texto: 'Continuar', listo: tanda !== null, hacer: continuarDesdeHora }
        : { texto: 'Reservar y pagar', listo: true, hacer: () => void enviar(), cargando: enviando }
  const pista = pasoVisible === 1 ? 'Elige una experiencia' : !fecha ? 'Elige un día' : 'Elige una hora'

  // La carga de la barca: lo elegido hasta ahora, en orden.
  const cargas: Carga[] = []
  if (exp) {
    cargas.push({
      clave: 'exp',
      etiqueta: 'experiencia',
      paso: 1,
      texto: exp.nombre,
      icono: <span className="block size-2.5 rounded-full" style={{ background: exp.acento }} />,
    })
  }
  if (fecha) cargas.push({ clave: 'fecha', etiqueta: 'fecha', paso: 2, texto: fmtCarga.format(new Date(`${fecha}T12:00:00Z`)).replace(/\./g, ''), icono: <IconoCalendario tam={15} /> })
  if (tanda) cargas.push({ clave: 'hora', etiqueta: 'hora', paso: 2, texto: horaCorta(tanda.hora), icono: <IconoReloj tam={15} /> })
  if (tanda && personas >= 1) {
    cargas.push({
      clave: 'personas',
      etiqueta: 'personas',
      paso: 2,
      texto: `${personas} ${personas === 1 ? 'persona' : 'personas'}`,
      icono: <IconoPersonas tam={15} />,
    })
  }

  const info = PASOS[pasoVisible - 1]

  return (
    <div ref={raiz} className={cx(pasoVisible < 4 && 'pb-64')}>
      <Stepper paso={pasoVisible} onIr={volverA} onAtras={() => history.back()} />

      <div
        key={pasoVisible}
        className={cx(saliendo ? `paso-saliendo pointer-events-none` : direccion === 'adelante' ? 'paso-adelante' : 'paso-atras')}
        data-dir={direccion}
      >
        <header className="mb-8 flex flex-col items-center text-center">
          <span className="relative grid size-16 place-items-center">
            <Enso className="absolute inset-0 size-full text-gold-500/70" grosor={4} />
            <span className="font-pincel text-2xl text-gold-200" aria-hidden="true">
              {info.kanji}
            </span>
          </span>
          <h2 className="mt-3 text-[1.9rem] leading-tight text-ivory-50 sm:text-[2.4rem]">{info.titulo}</h2>
          <p className="mt-2 max-w-md text-sm text-ivory-300">{info.ayuda}</p>
        </header>

        {pasoVisible === 1 && <TarjetasExperiencia experiencias={experiencias} elegida={expId} onElegir={elegirExperiencia} />}

        {pasoVisible === 2 && exp && (
          <div className="space-y-8">
            <ChipExperiencia experiencia={exp} onCambiar={() => volverA(1)} />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
              <section aria-labelledby="titulo-dia" className={cx(fecha && !verCalendario && 'hidden lg:block')}>
                <h3 id="titulo-dia" className="mb-3 text-xl text-ivory-50">
                  Elige el día
                </h3>
                <Calendario
                  tandas={tandas}
                  experiencias={experiencias}
                  filtro={expId}
                  personas={1}
                  mes={mes}
                  onMes={setMes}
                  seleccion={fecha}
                  onElegir={(f) => {
                    setFecha(f)
                    setTanda(null)
                    setVerCalendario(false)
                  }}
                />
              </section>

              {fecha ? (
                <section key={fecha} className="aparecer-suave min-w-0" aria-labelledby="titulo-hora">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 id="titulo-hora" className="text-xl text-ivory-50">
                      Elige la hora
                    </h3>
                    <button
                      type="button"
                      onClick={() => setVerCalendario((v) => !v)}
                      aria-expanded={verCalendario}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-gold-500/30 px-4 text-[0.82rem] text-gold-200 transition hover:bg-carbon-800 lg:hidden"
                    >
                      <IconoCalendario tam={16} /> {verCalendario ? 'Ocultar calendario' : 'Ver calendario'}
                    </button>
                  </div>
                  {!verCalendario && (
                    <div className="mb-5 lg:hidden">
                      <TiraDias
                        fechas={fechasExp}
                        seleccion={fecha}
                        onElegir={(f) => {
                          setFecha(f)
                          setTanda(null)
                          setMes(f.slice(0, 7))
                        }}
                      />
                    </div>
                  )}
                  <p className="mb-3 text-sm text-ivory-300 first-letter:uppercase">{fechaLarga(fecha)}</p>
                  <div className="grid gap-3">
                    {delDia.map((t, i) => (
                      <TiqueteTanda
                        key={t.slotId}
                        tanda={t}
                        personas={1}
                        indice={i}
                        elegida={tanda?.slotId === t.slotId}
                        onElegir={() => elegirTanda(t)}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="hidden min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-carbon-700 p-8 text-center lg:mt-10 lg:flex">
                  <IconoReloj tam={40} className="text-gold-500/60" />
                  <p className="mt-4 font-display text-xl text-ivory-100">Elige un día</p>
                  <p className="mt-1 max-w-60 text-sm text-ivory-500">Aquí aparecerán sus tandas, con la hora y los cupos que quedan.</p>
                </div>
              )}
            </div>

            {/* Personas: aparece al elegir la hora, con el tope y las cifras exactas de esa tanda */}
            {tanda && (
              <section
                key={tanda.slotId}
                ref={seccionPersonas}
                tabIndex={-1}
                className="marco aparecer mx-auto max-w-2xl scroll-mt-6 p-6 outline-none sm:p-8"
                aria-labelledby="titulo-personas"
              >
                <h3 id="titulo-personas" className="text-center text-xl text-ivory-50">
                  ¿Cuántos vienen?
                </h3>
                <p className="mt-1 mb-5 text-center text-sm text-ivory-300">
                  Tanda de las {horaCorta(tanda.hora)} · {fmtCarga.format(new Date(`${tanda.fecha}T12:00:00Z`)).replace(/\./g, '')}
                </p>
                <SelectorPersonas
                  valor={personas}
                  max={tanda.restantes}
                  onCambio={elegirPersonas}
                  pedir={pedirPersonas}
                  capacidad={tanda.cupo}
                  disponibles={tanda.restantes}
                  onOtraHora={() => setTanda(null)}
                />
              </section>
            )}
          </div>
        )}

        {pasoVisible === 3 && tanda && (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre" autoComplete="given-name" value={form.nombre} error={errores.nombre} onChange={(e) => setCampo('nombre', e.target.value)} />
              <Campo etiqueta="Apellido" autoComplete="family-name" value={form.apellido} error={errores.apellido} onChange={(e) => setCampo('apellido', e.target.value)} />
              <CampoCelular
                pais={pais}
                onPais={setPais}
                numero={form.celular}
                onNumero={(v) => setCampo('celular', v)}
                error={errores.celular}
              />
              <Campo
                etiqueta="Alergias o restricciones (opcional)"
                value={form.alergias}
                maxLength={300}
                onChange={(e) => setCampo('alergias', e.target.value)}
              />
            </div>
            <div className="relative">
              <Interruptor
                activo={form.esCumple}
                onCambio={(v) => setCampo('esCumple', v)}
                etiqueta="Celebramos un cumpleaños"
                descripcion="Puede ser cualquiera del grupo; se verifica con documento al llegar."
                icono={<IconoPastel tam={22} />}
              />
              {form.esCumple && <Confeti />}
            </div>
            <Sello marcado={form.terminos} onCambio={(v) => setCampo('terminos', v)} error={errores.terminos}>
              Acepto los{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setVerTerminos(true)
                }}
                className="text-gold-200 underline decoration-gold-500/50 underline-offset-4 hover:decoration-gold-300"
              >
                términos y condiciones
              </button>{' '}
              y autorizo el tratamiento de mis datos.
            </Sello>
            {errores.personas && <Aviso icono={<IconoAlerta />}>{errores.personas}</Aviso>}
            {errorEnvio && <Aviso icono={<IconoAlerta />}>{errorEnvio}</Aviso>}
          </div>
        )}

        {pasoVisible === 4 && reserva && (
          <div className="space-y-6">
            <PantallaPago reserva={reserva} onCambio={setReserva} plazoMin={config.hold_minutes} />
            {/* Mientras paga solo importa enviar el comprobante; consultar el estado tiene sentido una vez reportado. */}
            {reserva.status !== 'held' && (
              <div className="mx-auto max-w-xl">
                <Boton variante="secundario" icono={<IconoBuscar tam={18} />} onClick={() => (window.location.href = '/mi-reserva')}>
                  Consultar el estado de mi reserva
                </Boton>
              </div>
            )}
          </div>
        )}
      </div>

      <BarcaResumen
        cargas={cargas}
        total={exp ? (tanda && personas >= 1 ? tanda.precio * personas : (tanda?.precio ?? exp.precio)) : null}
        etiquetaTotal={tanda && personas >= 1 ? 'Total' : 'Por persona'}
        pista={pista}
        accion={accion}
        pasoActual={pasoVisible}
        onIr={volverA}
        zarpar={pasoVisible === 4}
      />

      <Modal open={verTerminos} titulo="Términos y condiciones" onClose={() => setVerTerminos(false)}>
        <p className="text-sm leading-relaxed whitespace-pre-line text-ivory-100">{config.terms}</p>
        <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ivory-300">{config.cancellation_policy}</p>
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ Stepper */

function Stepper({ paso, onIr, onAtras }: { paso: number; onIr: (n: number) => void; onAtras: () => void }) {
  const puedeVolver = paso > 1 && paso < 4
  return (
    <nav aria-label="Pasos de la reserva" className="mx-auto mb-10 max-w-3xl">
      <div className="mb-5 flex min-h-11 items-center justify-between">
        <button
          type="button"
          onClick={onAtras}
          disabled={!puedeVolver}
          className={cx(
            'group inline-flex min-h-11 items-center gap-1.5 rounded-full pr-4 pl-2 text-sm text-ivory-300 transition-all duration-500 ease-(--ease-suave) hover:bg-carbon-800 hover:text-ivory-50',
            puedeVolver ? 'opacity-100' : 'pointer-events-none -translate-x-2 opacity-0',
          )}
        >
          <IconoChevron dir="izq" tam={18} className="text-gold-300 transition-transform group-hover:-translate-x-0.5" />
          Atrás
        </button>
        <span className="text-[0.7rem] font-bold tracking-[0.25em] text-gold-500 uppercase">
          Paso {paso} de {PASOS.length}
        </span>
      </div>
      <ol className="relative grid grid-cols-4">
        {PASOS.map((p, i) => {
          const n = i + 1
          const hecho = n < paso
          const actual = n === paso
          const saltable = hecho && paso < 4
          return (
            <li key={p.corto} className="relative flex flex-col items-center">
              {i > 0 && (
                <span aria-hidden="true" className="absolute top-5 right-1/2 left-[-50%] h-px bg-carbon-700">
                  <span
                    className="block h-full origin-left bg-gold-400 transition-transform duration-700 ease-(--ease-suave)"
                    style={{ transform: `scaleX(${n <= paso ? 1 : 0})` }}
                  />
                </span>
              )}
              <button
                type="button"
                disabled={!saltable}
                onClick={() => onIr(n)}
                aria-current={actual ? 'step' : undefined}
                aria-label={`Paso ${n}: ${p.corto}${hecho ? ', completado, volver' : ''}`}
                className={cx(
                  'relative z-10 grid size-10 place-items-center rounded-full border font-display text-base transition-all duration-500 ease-(--ease-rebote) disabled:cursor-default',
                  hecho && 'border-gold-400 bg-gold-400 text-carbon-950 hover:scale-110',
                  actual && 'scale-110 border-gold-300 bg-carbon-950 text-gold-200 shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-gold-400)_15%,transparent)]',
                  !hecho && !actual && 'border-carbon-600 bg-carbon-900 text-ivory-500',
                )}
              >
                {hecho ? <IconoCheck tam={18} strokeWidth={2.4} /> : n}
              </button>
              <span
                className={cx(
                  'mt-2.5 text-center text-[0.68rem] leading-tight sm:text-xs',
                  actual ? 'font-bold text-gold-200' : hecho ? 'text-ivory-300' : 'text-ivory-500/60',
                )}
              >
                {p.corto}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------ Experiencia elegida */

function ChipExperiencia({ experiencia, onCambiar }: { experiencia: Experiencia; onCambiar: () => void }) {
  return (
    <div
      className="mx-auto flex max-w-2xl items-center gap-4 rounded-3xl border border-(--acento)/40 px-5 py-4"
      style={
        {
          '--acento': experiencia.acento,
          background: 'linear-gradient(120deg, color-mix(in oklab, var(--acento) 12%, var(--color-carbon-900)), var(--color-carbon-900) 70%)',
        } as CSSProperties
      }
    >
      <span className="size-3 shrink-0 rounded-full bg-(--acento) shadow-[0_0_12px_var(--acento)]" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.62rem] font-bold tracking-[0.25em] text-(--acento) uppercase">Tu experiencia</p>
        <p className="truncate font-display text-lg text-ivory-50">{experiencia.nombre}</p>
        <p className="text-[0.78rem] text-ivory-300">
          {formatearCOP(experiencia.precio)} por persona · {duracionTexto(experiencia.duracionMin)}
        </p>
      </div>
      <button
        type="button"
        onClick={onCambiar}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-(--acento)/50 px-4 text-[0.82rem] font-bold text-(--acento) transition hover:bg-(--acento)/10"
      >
        Cambiar
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ Detalles */

function Confeti() {
  const colores = ['var(--color-sakura-300)', 'var(--color-gold-300)', 'var(--color-lacquer-500)', 'var(--color-ivory-50)']
  return (
    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-8 z-10">
      {Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2
        const dist = 50 + (i % 4) * 18
        return (
          <span
            key={i}
            className="absolute block h-2 w-1 rounded-[1px]"
            style={
              {
                background: colores[i % colores.length],
                '--x': `${Math.cos(ang) * dist}px`,
                '--y': `${Math.sin(ang) * dist - 20}px`,
                '--r': `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
                animation: `confeti .9s var(--ease-suave) ${i * 12}ms forwards`,
              } as CSSProperties
            }
          />
        )
      })}
    </span>
  )
}

function Cargando() {
  return (
    <div aria-busy="true" className="space-y-6">
      <Espera texto="Preparando la agenda" className="py-4" />
      <div className="esqueleto h-1 rounded-full" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="esqueleto h-80 rounded-3xl" />
        ))}
      </div>
    </div>
  )
}
