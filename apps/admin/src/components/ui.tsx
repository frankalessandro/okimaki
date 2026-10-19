import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Boton({
  variante = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' | 'peligro' }) {
  const estilos = {
    primario: 'bg-gold-500 text-carbon-950 hover:bg-gold-400',
    secundario: 'border border-gold-500/40 text-gold-300 hover:bg-carbon-800',
    peligro: 'border border-danger-500/50 text-danger-500 hover:bg-danger-500/10',
  }[variante]
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${estilos} ${className}`}
      {...props}
    />
  )
}

export function Campo({ etiqueta, ...props }: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ivory-300">{etiqueta}</span>
      <input
        {...props}
        className="min-h-11 w-full rounded-xl border border-carbon-600 bg-carbon-950 px-4 text-ivory-50 placeholder:text-ivory-500 focus:border-gold-500"
      />
    </label>
  )
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-gold-500/20 bg-carbon-900 p-4 ${className}`}>{children}</section>
}

export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambio,
}: {
  opciones: { clave: T; titulo: string }[]
  valor: T
  onCambio: (v: T) => void
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-carbon-600 bg-carbon-900 p-1">
      {opciones.map((o) => (
        <button
          key={o.clave}
          type="button"
          onClick={() => onCambio(o.clave)}
          aria-pressed={valor === o.clave}
          className={`min-h-10 whitespace-nowrap rounded-lg px-4 text-sm transition ${
            valor === o.clave ? 'bg-gold-500 font-semibold text-carbon-950' : 'text-ivory-300 hover:text-ivory-50'
          }`}
        >
          {o.titulo}
        </button>
      ))}
    </div>
  )
}
