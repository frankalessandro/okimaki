import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Boton, Campo } from '../components/ui'
import { cargarPerfil } from '../lib/auth'
import { db } from '../lib/db'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (await cargarPerfil()) throw redirect({ to: '/' })
  },
  component: Login,
})

function Login() {
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    const { error: fallo } = await db.auth.signInWithPassword({ email: correo, password: clave })
    if (fallo) {
      setError('Correo o clave incorrectos.')
      setCargando(false)
      return
    }
    if (!(await cargarPerfil())) {
      setError('Tu cuenta no tiene acceso al panel.')
      setCargando(false)
      return
    }
    await navegar({ to: '/' })
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4 rounded-2xl border border-gold-500/20 bg-carbon-900 p-6">
        <div className="text-center">
          <p className="font-display text-2xl tracking-[0.35em] text-ivory-50">OKI MAKI</p>
          <p className="mt-1 text-[10px] tracking-[0.6em] text-gold-500">3 6 9 · PANEL</p>
        </div>
        <Campo etiqueta="Correo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <Campo etiqueta="Clave" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
        {error && <p className="text-sm text-danger-500">{error}</p>}
        <Boton type="submit" disabled={cargando} className="w-full">
          {cargando ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>
    </main>
  )
}
