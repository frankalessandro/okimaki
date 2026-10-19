import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Boton({
  variante = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' }) {
  const base =
    'inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-base font-semibold transition disabled:opacity-50'
  const estilos =
    variante === 'primario'
      ? 'bg-gold-500 text-carbon-950 hover:bg-gold-400'
      : 'border border-gold-500/40 text-gold-300 hover:bg-carbon-800'
  return <button type="button" className={`${base} ${estilos} ${className}`} {...props} />
}

export function Campo({ etiqueta, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ivory-300">{etiqueta}</span>
      <input
        {...props}
        className="min-h-12 w-full rounded-xl border border-carbon-600 bg-carbon-900 px-4 text-base text-ivory-50 placeholder:text-ivory-500 focus:border-gold-500"
      />
      {error && <span className="mt-1 block text-sm text-danger-500">{error}</span>}
    </label>
  )
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-gold-500/20 bg-carbon-900 p-4 ${className}`}>{children}</section>
}

export function Seccion({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 flex items-center gap-3 text-lg text-gold-300">
        <span className="grid size-7 place-items-center rounded-full border border-gold-500/50 text-sm">{numero}</span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}
