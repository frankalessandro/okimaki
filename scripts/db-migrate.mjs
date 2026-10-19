// Aplica supabase/migrations/*.sql en orden contra el contenedor local.
import { readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const dir = 'supabase/migrations'
for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  console.log('→', f)
  execFileSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-U', 'postgres', '-d', 'okimaki', '-v', 'ON_ERROR_STOP=1', '-f', `/migrations/${f}`], { stdio: 'inherit' })
}
