import { fechaLocalISO, sumarDias, type Tanda } from '@okimaki/core'
import { useState } from 'react'

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

type Props = {
  tandas: Tanda[]
  seleccion: string | null
  onElegir: (fecha: string) => void
}

export function Calendario({ tandas, seleccion, onElegir }: Props) {
  const hoy = fechaLocalISO()
  const [mes, setMes] = useState(hoy.slice(0, 7)) // YYYY-MM

  const porFecha = new Map<string, number>() // fecha → cupos libres
  for (const t of tandas) porFecha.set(t.fecha, (porFecha.get(t.fecha) ?? 0) + t.restantes)

  const [anio, mesNum] = mes.split('-').map(Number)
  const primero = `${mes}-01`
  const desfase = (new Date(Date.UTC(anio, mesNum - 1, 1)).getUTCDay() + 6) % 7 // lunes = 0
  const diasEnMes = new Date(Date.UTC(anio, mesNum, 0)).getUTCDate()
  const titulo = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(anio, mesNum - 1, 1)),
  )
  const cambiarMes = (delta: number) => setMes(sumarDias(primero, delta > 0 ? 32 : -1).slice(0, 7))
  const puedeAtras = mes > hoy.slice(0, 7)
  const ultimaFecha = tandas.at(-1)?.fecha ?? hoy
  const puedeAdelante = mes < ultimaFecha.slice(0, 7)

  return (
    <div className="rounded-2xl border border-gold-500/20 bg-carbon-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => cambiarMes(-1)}
          disabled={!puedeAtras}
          aria-label="Mes anterior"
          className="grid size-11 place-items-center rounded-full text-gold-300 disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-display text-lg capitalize text-ivory-50">{titulo}</span>
        <button
          type="button"
          onClick={() => cambiarMes(1)}
          disabled={!puedeAdelante}
          aria-label="Mes siguiente"
          className="grid size-11 place-items-center rounded-full text-gold-300 disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ivory-500">
        {DIAS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: desfase }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: diasEnMes }, (_, i) => {
          const dia = i + 1
          const fecha = `${mes}-${String(dia).padStart(2, '0')}`
          const libres = porFecha.get(fecha)
          const hayTandas = libres !== undefined
          const lleno = hayTandas && libres === 0
          const elegido = seleccion === fecha
          const habilitado = hayTandas && !lleno
          return (
            <button
              key={fecha}
              type="button"
              disabled={!habilitado}
              onClick={() => onElegir(fecha)}
              aria-pressed={elegido}
              className={[
                'relative grid aspect-square place-items-center rounded-lg text-sm transition',
                elegido
                  ? 'bg-gold-500 font-bold text-carbon-950'
                  : habilitado
                    ? 'bg-carbon-800 text-ivory-50 hover:border-gold-500 border border-gold-500/30'
                    : 'text-ivory-500/50',
                fecha === hoy && !elegido ? 'ring-1 ring-gold-500/60' : '',
              ].join(' ')}
            >
              {dia}
              {lleno && <span className="absolute bottom-0.5 text-[8px] uppercase text-lacquer-500">lleno</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
