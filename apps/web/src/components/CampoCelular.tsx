import { Modal } from '@okimaki/ui'
import { useState } from 'react'
import { normalizarBusqueda, PAISES, type Pais } from '../lib/paises'
import { IconoCheck, IconoChevron } from './iconos'
import { Campo, cx } from './ui'

type Props = {
  pais: Pais
  onPais: (p: Pais) => void
  numero: string
  onNumero: (v: string) => void
  error?: string
}

/**
 * Celular con indicativo. El indicativo es un botón dentro del mismo marco del campo; abre un modal sencillo
 * con buscador y la lista de países (Colombia primero). Colombia (+57) es el predeterminado.
 */
export function CampoCelular({ pais, onPais, numero, onNumero, error }: Props) {
  const [abierto, setAbierto] = useState(false)
  const esColombia = pais.iso === 'CO'
  return (
    <>
      <Campo
        etiqueta="Celular"
        type="tel"
        inputMode="tel"
        autoComplete={esColombia ? 'tel-national' : 'tel'}
        placeholder={esColombia ? '300 123 4567' : 'Número sin el indicativo'}
        value={numero}
        error={error}
        ayuda="Aquí te confirmamos por WhatsApp."
        onChange={(e) => onNumero(e.target.value)}
        adorno={
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-haspopup="dialog"
            aria-label={`Indicativo: ${pais.nombre} +${pais.indicativo}. Cambiar país`}
            className="flex shrink-0 items-center gap-2 rounded-l-2xl pr-3 pl-4 transition-colors hover:bg-carbon-800/70"
          >
            <span className="grid h-5 w-7 place-items-center rounded-[5px] bg-carbon-700 text-[0.6rem] font-bold tracking-wider text-ivory-100">
              {pais.iso}
            </span>
            <span className="font-mono text-[0.95rem] text-gold-200">+{pais.indicativo}</span>
            <IconoChevron dir="abajo" tam={14} className="text-ivory-500" />
          </button>
        }
      />
      <SelectorPais
        abierto={abierto}
        actual={pais}
        onCerrar={() => setAbierto(false)}
        onElegir={(p) => {
          onPais(p)
          setAbierto(false)
        }}
      />
    </>
  )
}

function SelectorPais({
  abierto,
  actual,
  onCerrar,
  onElegir,
}: {
  abierto: boolean
  actual: Pais
  onCerrar: () => void
  onElegir: (p: Pais) => void
}) {
  const [busqueda, setBusqueda] = useState('')

  const q = normalizarBusqueda(busqueda).replace(/^\+/, '')
  const resultados = q ? PAISES.filter((p) => normalizarBusqueda(p.nombre).includes(q) || p.indicativo.startsWith(q)) : PAISES

  function cerrar() {
    setBusqueda('')
    onCerrar()
  }

  return (
    <Modal open={abierto} titulo="Indicativo del país" onClose={cerrar}>
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && resultados[0]) {
            e.preventDefault()
            onElegir(resultados[0])
            setBusqueda('')
          }
        }}
        placeholder="Buscar país o indicativo"
        aria-label="Buscar país o indicativo"
        autoComplete="off"
        className="mb-3 h-12 w-full rounded-xl border border-carbon-600 bg-carbon-900 px-4 text-base text-ivory-50 outline-none placeholder:text-ivory-500 focus:border-gold-500/60"
      />

      {resultados.length === 0 ? (
        <p className="py-6 text-center text-sm text-ivory-500">Sin resultados.</p>
      ) : (
        <ul role="listbox" aria-label="Países" className="divide-y divide-carbon-700/70">
          {resultados.map((p) => {
            const elegido = p.iso === actual.iso
            return (
              <li key={p.iso} role="option" aria-selected={elegido}>
                <button
                  type="button"
                  onClick={() => {
                    onElegir(p)
                    setBusqueda('')
                  }}
                  className={cx(
                    'flex min-h-12 w-full items-center justify-between gap-3 px-1 text-left text-[0.95rem] transition-colors hover:text-gold-200',
                    elegido ? 'font-bold text-gold-200' : 'text-ivory-100',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {elegido && <IconoCheck tam={16} />}
                    {p.nombre}
                  </span>
                  <span className="font-mono text-sm text-ivory-500">+{p.indicativo}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
