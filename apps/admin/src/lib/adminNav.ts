/** Fuente única del menú: de aquí salen el sidebar, las pestañas y el título del Topbar. */
export type SeccionNav = {
  grupo: string
  titulo: string
  ruta: '/' | '/reservas'
  pestanas?: { clave: string; titulo: string }[]
}

export const adminNav: SeccionNav[] = [
  {
    grupo: 'Hoy',
    titulo: 'Bandeja',
    ruta: '/',
    pestanas: [
      { clave: 'verificar', titulo: 'Pagos por verificar' },
      { clave: 'vencer', titulo: 'Por vencer' },
    ],
  },
  { grupo: 'Reservas', titulo: 'Reservas', ruta: '/reservas' },
]
