import { createFileRoute, Link, Outlet, redirect, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Boton } from '../components/ui'
import { adminNav } from '../lib/adminNav'
import { cargarPerfil } from '../lib/auth'
import { db } from '../lib/db'

const INACTIVIDAD_MS = 30 * 60 * 1000

export const Route = createFileRoute('/_panel')({
  // La guardia evita pantallas vacías; la restricción real es RLS en la base.
  beforeLoad: async () => {
    const perfil = await cargarPerfil()
    if (!perfil) throw redirect({ to: '/login' })
    return { perfil }
  },
  component: Panel,
})

function Panel() {
  const { perfil } = Route.useRouteContext()
  const navegar = useNavigate()
  const coincide = useMatchRoute()

  async function salir() {
    await db.auth.signOut()
    await navegar({ to: '/login' })
  }

  // Cierre de sesión por inactividad.
  useEffect(() => {
    const cerrar = () => void db.auth.signOut().then(() => navegar({ to: '/login' }))
    let id = setTimeout(cerrar, INACTIVIDAD_MS)
    const reiniciar = () => {
      clearTimeout(id)
      id = setTimeout(cerrar, INACTIVIDAD_MS)
    }
    const eventos = ['pointerdown', 'keydown', 'scroll'] as const
    eventos.forEach((e) => window.addEventListener(e, reiniciar))
    return () => {
      clearTimeout(id)
      eventos.forEach((e) => window.removeEventListener(e, reiniciar))
    }
  }, [navegar])

  const actual = adminNav.find((s) => coincide({ to: s.ruta, fuzzy: s.ruta !== '/' })) ?? adminNav[0]
  const grupos = [...new Set(adminNav.map((s) => s.grupo))]

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <aside className="hidden border-r border-gold-500/20 bg-carbon-900 p-4 md:block">
        <div className="mb-6 text-center">
          <p className="font-display text-xl tracking-[0.35em] text-ivory-50">OKI MAKI</p>
          <p className="mt-1 text-[10px] tracking-[0.6em] text-gold-500">3 6 9</p>
        </div>
        {grupos.map((g) => (
          <nav key={g} className="mb-4">
            <p className="mb-1 text-xs uppercase tracking-widest text-ivory-500">{g}</p>
            {adminNav
              .filter((s) => s.grupo === g)
              .map((s) => (
                <Link
                  key={s.ruta}
                  to={s.ruta}
                  className="block rounded-lg px-3 py-2 text-ivory-300 hover:bg-carbon-800 data-[status=active]:bg-gold-500/10 data-[status=active]:text-gold-300"
                  activeOptions={{ exact: s.ruta === '/' }}
                >
                  {s.titulo}
                </Link>
              ))}
          </nav>
        ))}
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-gold-500/20 px-4 py-3">
          <h1 className="text-xl text-ivory-50">{actual.titulo}</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ivory-300 sm:block">{perfil.nombre}</span>
            <Boton variante="secundario" onClick={salir}>
              Salir
            </Boton>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-carbon-700 px-4 py-2 md:hidden">
          {adminNav.map((s) => (
            <Link
              key={s.ruta}
              to={s.ruta}
              activeOptions={{ exact: s.ruta === '/' }}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ivory-300 data-[status=active]:bg-gold-500/10 data-[status=active]:text-gold-300"
            >
              {s.titulo}
            </Link>
          ))}
        </nav>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
