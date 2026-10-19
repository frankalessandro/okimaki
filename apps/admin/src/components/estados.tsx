import type { ErrorComponentProps } from '@tanstack/react-router'

export function Pendiente() {
  return <p className="p-8 text-center text-ivory-300">Cargando…</p>
}

export function ErrorPantalla({ error }: ErrorComponentProps) {
  return (
    <div className="p-8 text-center">
      <p className="text-danger-500">Algo salió mal.</p>
      <p className="mt-1 text-sm text-ivory-300">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  )
}
