import { fechaLarga, formatearCOP, horaCorta } from '@okimaki/core'
import { cancelarReserva, listarReservasPanel, rechazarPago, verificarPago, type FilaReserva } from '@okimaki/db'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { InsigniaEstado, ModalTexto, textoPlazo, useAhora } from '../../components/reservas'
import { Boton, Segmentado, Tarjeta } from '../../components/ui'
import { adminNav } from '../../lib/adminNav'
import { db } from '../../lib/db'
import { claves } from '../../lib/queryKeys'

export const Route = createFileRoute('/_panel/')({ component: Bandeja })

type Accion = { tipo: 'verificar' | 'rechazar' | 'cancelar'; reserva: FilaReserva }
const URGENTE_MIN = 30

function Bandeja() {
  const pestanas = adminNav[0].pestanas ?? []
  const [pestana, setPestana] = useState('verificar')
  const [accion, setAccion] = useState<Accion | null>(null)
  const ahora = useAhora()
  const cliente = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: claves.bandeja,
    queryFn: () => listarReservasPanel(db, ['payment_reported', 'held']),
    refetchInterval: 15_000,
  })

  const refrescar = () => cliente.invalidateQueries({ queryKey: claves.reservas })
  const verificar = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => verificarPago(db, id, texto),
    onSuccess: refrescar,
  })
  const rechazar = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => rechazarPago(db, id, texto),
    onSuccess: refrescar,
  })
  const cancelar = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => cancelarReserva(db, id, texto),
    onSuccess: refrescar,
  })

  const reservas = (data ?? []).filter((r) => r.estado === (pestana === 'verificar' ? 'payment_reported' : 'held'))
  const lista = [...reservas].sort((a, b) => (a.venceEn ?? '').localeCompare(b.venceEn ?? ''))
  const porVerificar = (data ?? []).filter((r) => r.estado === 'payment_reported').length

  return (
    <div className="space-y-4">
      <Segmentado
        opciones={pestanas.map((p) => (p.clave === 'verificar' && porVerificar ? { ...p, titulo: `${p.titulo} (${porVerificar})` } : p))}
        valor={pestana}
        onCambio={setPestana}
      />

      {isPending && <p className="text-ivory-300">Cargando…</p>}
      {error && <p className="text-danger-500">{error.message}</p>}
      {!isPending && lista.length === 0 && (
        <Tarjeta className="text-center text-ivory-300">
          {pestana === 'verificar' ? 'No hay pagos por verificar.' : 'No hay reservas apartadas pendientes.'}
        </Tarjeta>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {lista.map((r) => {
          const minutos = r.venceEn ? (new Date(r.venceEn).getTime() - ahora) / 60_000 : Infinity
          const urgente = r.estado === 'payment_reported' && minutos < URGENTE_MIN
          return (
            <Tarjeta key={r.id} className={urgente ? 'border-danger-500/60' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg tracking-wider text-gold-300">{r.codigo}</p>
                  <p className="text-ivory-50">
                    {r.nombre} {r.apellido}
                  </p>
                  <p className="text-sm text-ivory-300">{r.cliente.celular}</p>
                </div>
                <InsigniaEstado estado={r.estado} />
              </div>
              <p className="mt-2 text-sm text-ivory-300">
                {fechaLarga(r.tanda.fecha)} · {horaCorta(r.tanda.hora)} · {r.personas} {r.personas === 1 ? 'persona' : 'personas'}
              </p>
              <p className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-2xl text-ivory-50">{formatearCOP(r.total)}</span>
                <span className={`text-sm ${urgente ? 'font-semibold text-danger-500' : 'text-ivory-300'}`}>
                  {urgente && 'Urgente · '}
                  {r.estado === 'payment_reported' ? 'se libera en ' : 'vence en '}
                  {textoPlazo(r.venceEn, ahora)}
                </span>
              </p>
              {r.alergias && <p className="mt-1 text-sm text-warning-500">Alergias: {r.alergias}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {r.estado === 'payment_reported' && (
                  <>
                    <Boton onClick={() => setAccion({ tipo: 'verificar', reserva: r })}>Verificar pago</Boton>
                    <Boton variante="secundario" onClick={() => setAccion({ tipo: 'rechazar', reserva: r })}>
                      Rechazar
                    </Boton>
                  </>
                )}
                <Boton variante="peligro" onClick={() => setAccion({ tipo: 'cancelar', reserva: r })}>
                  Cancelar
                </Boton>
              </div>
            </Tarjeta>
          )
        })}
      </div>

      <ModalTexto
        abierto={accion?.tipo === 'verificar'}
        titulo="Verificar pago"
        etiqueta="Referencia de la transferencia"
        confirmar="Confirmar reserva"
        onCerrar={() => setAccion(null)}
        onConfirmar={async (texto) => void (await verificar.mutateAsync({ id: accion!.reserva.id, texto }))}
      />
      <ModalTexto
        abierto={accion?.tipo === 'rechazar'}
        titulo="Rechazar pago"
        etiqueta="Motivo del rechazo"
        confirmar="Rechazar"
        peligro
        onCerrar={() => setAccion(null)}
        onConfirmar={async (texto) => void (await rechazar.mutateAsync({ id: accion!.reserva.id, texto }))}
      />
      <ModalTexto
        abierto={accion?.tipo === 'cancelar'}
        titulo="Cancelar reserva"
        etiqueta="Motivo de la cancelación"
        confirmar="Cancelar reserva"
        peligro
        onCerrar={() => setAccion(null)}
        onConfirmar={async (texto) => void (await cancelar.mutateAsync({ id: accion!.reserva.id, texto }))}
      />
    </div>
  )
}
