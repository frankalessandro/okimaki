import { createClient } from '@okimaki/db'

/** Cliente anónimo: el sitio público solo ejecuta RPC públicas, sin sesión. */
export const db = createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
