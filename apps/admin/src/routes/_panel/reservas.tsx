import { etiquetaEstado, fechaLarga, formatearCOP, horaCorta, type EstadoReserva } from '@okimaki/core'
import { cancelarReserva, listarReservasPanel, type FilaReserva } from '@okimaki/db'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { InsigniaEstado, ModalTexto } from '../../components/reservas'
import { Boton, Campo, Segmentado, Tarjeta } from '../../components/ui'
import { db } from '../../lib/db'
import { claves } from '../../lib/queryKeys'

export const Route = createFileRoute('/_panel/reservas')({ component: Reservas })

type Filtro = 'todas' | EstadoReserva
const filtros: { clave: Filtro; titulo: string }[] = [
  { clave: 'todas', titulo: 'Todas' },
  { clave: 'confirmed', titulo: etiquetaEstado.confirmed },
  { clave: 'payment_reported', titulo: etiquetaEstado.payment_reported },
  { clave: 'held', titulo: etiquetaEstado.held },
  { clave: 'cancelled', titulo: etiquetaEstado.cancelled },
  { clave: 'expired', titulo: etiquetaEstado.expired },
]
const CANCELABLES: EstadoReserva[] = ['held', 'payment_reported', 'confirmed']

function Reservas() {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [aCancelar, setACancelar] = useState<FilaReserva | null>(null)
  const cliente = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: claves.lista,
    queryFn: () => listarReservasPanel(db),
  })
  const cancelar = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => cancelarReserva(db, id, texto),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.reservas }),
  })

  const q = busqueda.trim().toLowerCase()
  const filas = (data ?? [])
    .filter((r) => filtro === 'todas' || r.estado === filtro)
    .filter(
      (r) =>
        !q ||
        r.codigo.toLowerCase().includes(q) ||
        `${r.nombre} ${r.apellido}`.toLowerCase().includes(q) ||
        r.cliente.celular.includes(q),
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <Segmentado opciones={filtros} valor={filtro} onCambio={setFiltro} />
        <div className="md:w-72">
          <Campo etiqueta="Buscar" placeholder="Código, nombre o celular" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      {isPending && <p className="text-ivory-300">Cargando…</p>}
      {error && <p className="text-danger-500">{error.message}</p>}

      <Tarjeta className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-ivory-500">
                {['Código', 'Cliente', 'Tanda', 'Pers.', 'Total', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((r) => (
                <tr key={r.id} className="border-t border-carbon-700">
                  <td className="px-4 py-3 font-mono text-gold-300">{r.codigo}</td>
                  <td className="px-4 py-3">
                    <span className="block text-ivory-50">
                      {r.nombre} {r.apellido}
                    </span>
                    <span className="text-xs text-ivory-300">{r.cliente.celular}</span>
                  </td>
                  <td className="px-4 py-3 text-ivory-100">
                    {fechaLarga(r.tanda.fecha)}
                    <span className="block text-xs text-ivory-300">{horaCorta(r.tanda.hora)}</span>
                  </td>
                  <td className="px-4 py-3">{r.personas}</td>
                  <td className="px-4 py-3">{formatearCOP(r.total)}</td>
                  <td className="px-4 py-3">
                    <InsigniaEstado estado={r.estado} />
                    {r.motivoCancelacion && <span className="mt-1 block text-xs text-ivory-500">{r.motivoCancelacion}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {CANCELABLES.includes(r.estado) && (
                      <Boton variante="peligro" onClick={() => setACancelar(r)}>
                        Cancelar
                      </Boton>
                    )}
                  </td>
                </tr>
              ))}
              {!isPending && filas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ivory-300">
                    Sin reservas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <ModalTexto
        abierto={aCancelar !== null}
        titulo={`Cancelar ${aCancelar?.codigo ?? ''}`}
        etiqueta="Motivo de la cancelación"
        confirmar="Cancelar reserva"
        peligro
        onCerrar={() => setACancelar(null)}
        onConfirmar={async (texto) => void (await cancelar.mutateAsync({ id: aCancelar!.id, texto }))}
      />
    </div>
  )
}
