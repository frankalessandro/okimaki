import { createClient } from '@okimaki/db'

/** Cliente del panel: con sesión de Supabase Auth; la restricción real es RLS. */
export const db = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
