// Crea una cuenta de Supabase Auth y su fila en `staff`. No hay registro abierto: el dueño invita.
// Uso: SUPABASE_URL=… SUPABASE_SECRET_KEY=… ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NOMBRE=… node scripts/crear-admin.mjs
const { SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE, ADMIN_ROL = 'admin' } = process.env
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE })) {
  if (!v) throw new Error(`Falta ${k}`)
}

const cabeceras = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  'Content-Type': 'application/json',
}

const auth = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: cabeceras,
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true }),
})
const usuario = await auth.json()
if (!auth.ok) throw new Error(`Auth: ${usuario.msg ?? usuario.message ?? auth.status}`)

const staff = await fetch(`${SUPABASE_URL}/rest/v1/staff`, {
  method: 'POST',
  headers: cabeceras,
  body: JSON.stringify({ user_id: usuario.id, full_name: ADMIN_NOMBRE, role: ADMIN_ROL }),
})
if (!staff.ok) throw new Error(`staff: ${await staff.text()}`)
console.log(`Listo: ${ADMIN_EMAIL} (${ADMIN_ROL})`)
