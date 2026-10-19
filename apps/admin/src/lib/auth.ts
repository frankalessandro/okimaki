import { z } from 'zod'
import { db } from './db'

const Perfil = z.object({ nombre: z.string(), rol: z.enum(['host', 'admin', 'owner']), activo: z.boolean() })
export type Perfil = z.infer<typeof Perfil>

/** Sesión + fila de `staff`. Sin fila activa, no hay acceso aunque la cuenta exista. */
export async function cargarPerfil(): Promise<Perfil | null> {
  const { data: sesion } = await db.auth.getSession()
  if (!sesion.session) return null
  const { data } = await db
    .from('staff')
    .select('nombre:full_name, rol:role, activo:active')
    .eq('user_id', sesion.session.user.id)
    .maybeSingle()
  const perfil = Perfil.safeParse(data)
  if (!perfil.success || !perfil.data.activo) {
    await db.auth.signOut()
    return null
  }
  return perfil.data
}
