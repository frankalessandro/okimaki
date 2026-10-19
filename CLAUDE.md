# CLAUDE.md — okimaki-reservas

Sistema de reservas para Okimaki369 (sushi flotante, Palmira): sitio público donde el cliente reserva y reporta su pago, y panel donde el restaurante verifica pagos, configura tipos de servicio y eventos, atiende el servicio del día y consulta reportes. Reemplaza un sistema hecho en Google Apps Script + Google Sheets.

- **Alcance y reglas de negocio:** `docs/plan-de-alcance.md` (Plan de Alcance v1.2). Es la fuente de verdad del *qué*.
- **Cotización:** COT-2026-034 — módulos M1–M10 y bloques transversales T1–T4 (ver "Módulos" abajo).
- **Detalle técnico feature por feature** (RPCs, esquema, decisiones puntuales): `docs/historial-tecnico.md`. Este archivo es la referencia de convenciones y reglas vigentes, no el changelog.

## Stack

Monorepo con pnpm workspaces + Turborepo.

| Pieza | Tecnología |
|---|---|
| `apps/web` — sitio cliente | Astro + islas React (solo calendario, formulario, pago y Mi reserva). Tailwind CSS 4 |
| `apps/admin` — panel | React 19 + TypeScript 5.9, Vite 8 (rolldown-babel + React Compiler vía `babel-plugin-react-compiler`), TanStack Router (file-based) + TanStack Query, Tailwind CSS 4 |
| `packages/db` | Cliente Supabase, `types.gen.ts` generado, wrappers tipados de cada RPC |
| `packages/core` | Schemas Zod 4, celular (+57), dinero (es-CO), fechas en `America/Bogota`, plantillas de WhatsApp, etiquetas de estado |
| `packages/ui` | Componentes propios compartidos + tokens de diseño (`@theme`) |
| Backend | Supabase: Postgres, Auth, RLS, Realtime, Storage (logo y QR), pg_cron, Edge Functions solo si algo no cabe en SQL |
| Íconos | `lucide-react` (import nombrado por ícono) |
| Exportación | `exceljs`, `jspdf` + `jspdf-autotable`, cargados solo al exportar |
| Gráficas | Chart.js vía un único componente `BarChart` |
| Pruebas | Vitest para lógica pura de `packages/core` y del panel; pgTAP para cupos y estados en SQL |
| Despliegue | Vercel free (dos proyectos: `reservas.` y `admin.`) |
| Paquetes | pnpm — nunca npm/yarn, respetar `pnpm-lock.yaml` |

TypeScript estricto en todo el repo; nada de `any` salvo justificación explícita en comentario.

## Comandos

```bash
pnpm install
pnpm dev              # turbo: web + admin en paralelo
pnpm dev --filter admin
pnpm build            # turbo build de todas las apps
pnpm lint             # eslint
pnpm typecheck        # tsc -b sin emitir (el build de Vite no corre tsc)
pnpm test             # vitest run
pnpm db:types         # regenera packages/db/src/types.gen.ts desde Supabase
supabase db push      # aplica migraciones pendientes a producción
```

## Reglas de trabajo con Claude

- **No hacer `git commit`, `merge` ni `push` sin autorización explícita de Alessandro en ese momento.** Hacer los cambios, verificar (build, lint, tipos, tests) y dejarlos en el working tree. La autorización de un paso no se extiende al siguiente: cada commit se pide aparte.
- **Los commits los firma el usuario configurado en `git config`, nunca Claude.** Sin trailer `Co-Authored-By: Claude`, sin línea `Claude-Session:`, sin "Generated with Claude Code" en commits ni PRs.
- **No abrir el navegador para probar** (`pnpm dev` + abrir URL, `open`, `xdg-open`). Verificar con build, lint, tipos y tests. Si algo necesita verificación visual, pedírsela a Alessandro.
- **Jamás se commitea un `.env*`** (solo `.env.example`, sin valores). Revisar `git status` antes de cada commit.
- **Diagnosticar primero, actuar después:** ante un cambio grande o una duda de negocio, proponer el plan y esperar aprobación antes de tocar código.
- **Las reglas de negocio de abajo no se infieren ni se "mejoran" sin confirmación.** Si una tarea las contradice, se pregunta.
- **Commits con el código del módulo** (conventional commits): `feat(M6): rechazo de pago con motivo`, `fix(M2): cupo por evento`. Ramas por feature.
- Mantener este archivo corto y vigente. El detalle de cada feature grande va en `docs/historial-tecnico.md`; aquí solo el resumen y la restricción que hay que respetar.

## Arquitectura y convenciones

### Límites del monorepo

- **Ninguna app escribe directo en una tabla.** Toda escritura pasa por una RPC de `packages/db`. Las lecturas del panel pueden ir a vistas o tablas protegidas por RLS; las del sitio público, solo a RPC públicas.
- `apps/web` nunca importa nada de `apps/admin`. Lo compartido vive en `packages/*`.
- `pnpm db:types` después de cada migración; el CI falla si `types.gen.ts` quedó desactualizado.
- Un schema Zod por entidad (`Reserva`, `TipoServicio`, `Tanda`, `Pago`, `Cliente`…) en `packages/core`; los tipos TS salen de `z.infer<...>`, no se duplican a mano. El mismo schema valida el formulario y documenta lo que espera la RPC.

### Base de datos ↔ código

- **Columnas snake_case en Postgres, camelCase en TypeScript.** El puente es el alias en el `select` (`select('id, tipoServicioId:service_type_id, ...')`), no una capa de mapeo aparte. Los argumentos de RPC van en snake_case.
- **Fechas:** todo "hoy" o fecha del negocio se calcula en `America/Bogota` con el helper de `packages/core` (`fechaLocalISO`). Nunca `new Date().toISOString().slice(0, 10)`: después de las 7 pm en Colombia eso da el día siguiente. En la base, `timestamptz` siempre; `date` solo para la fecha de servicio.
- **Paginar toda lectura por rango que alimente una cifra** (helper `paginar`): Supabase corta en 1.000 filas y el total se trunca en silencio.
- **Dinero en pesos enteros** (`integer`/`bigint`), nunca `float`. En pantalla con separador de miles es-CO; en formularios, `CurrencyInput`.
- El consecutivo `OKIMAKI-000001` lo genera Postgres (secuencia) al crear la reserva; el frontend nunca lo calcula. Las reservas migradas conservan su código viejo (`AAA-025`…).

### Sitio cliente (`apps/web`)

- La mayoría de clientes llega desde el navegador interno de Instagram/TikTok, en celular y con datos lentos. **Astro manda HTML; solo se hidrata lo interactivo** (`client:load` en el flujo de reserva, `client:visible` en lo demás). Revisar el peso del JS en cada build.
- Flujo de reserva en una sola columna, mobile-first: calendario → tanda → datos → pago. Sin pasos ocultos ni modales en el camino crítico salvo el QR.
- **Pantalla de pago (M4):** monto exacto, contador de 1 hora, modal con el QR, botón "Copiar llave" (Clipboard API con respaldo de selección manual si falla dentro del navegador de Instagram) y botón "Enviar comprobante por WhatsApp": abre `https://wa.me/<numero>?text=<encodeURIComponent(mensaje)>` y **en el mismo clic** llama `report_payment(code)`. Si la RPC falla, igual se abre WhatsApp y se reintenta en segundo plano.
- La plantilla del mensaje sale de `settings.whatsapp_template` (editable en M1); `packages/core` la rellena. Nunca escribir el texto del mensaje en un componente.
- **Mi reserva (M5):** código + apellido o celular. Nunca mostrar una reserva con solo el celular.
- Captcha invisible (Cloudflare Turnstile) antes de `create_reservation`, validado en Edge Function.
- SEO local básico: título, descripción, Open Graph y datos estructurados del restaurante.

### Panel (`apps/admin`)

- **Menú organizado por pregunta de negocio, no por tabla** (lección de lavadero-SM). Fuente única del menú en `src/lib/adminNav.ts`: de ahí salen el sidebar, las pestañas y el título del Topbar.

  | Grupo | Sección | Pestañas |
  |---|---|---|
  | Hoy | Bandeja (`/`) | Pagos por verificar · Por vencer |
  | Hoy | Servicio del día (`/servicio`) | — |
  | Reservas | Reservas (`/reservas`) | Lista · Buscar · Clientes |
  | Agenda | Calendario (`/agenda`) | Tipos de servicio · Horario semanal · Eventos y fechas |
  | Análisis | Reportes (`/reportes`) | — |
  | Ajustes | Configuración (`/configuracion`) | General · Pago y mensajes · Usuarios |

  Una pantalla nueva va como pestaña de una sección existente, no como ítem nuevo del sidebar.
- **Rutas por rol con guard en el loader**, pero la restricción real es RLS: nunca confiar en ocultar UI. Datos que un rol no puede ver no deben llegar al bundle ni al estado del cliente.
- **Servicio del día (M8) es la pantalla de la mesera:** mobile-first, botones grandes, tarjetas en vez de tablas.
- **La bandeja (M6) se actualiza con Realtime** (suscripción a `reservations` y `payments`), sin recargar. Las reservas en `payment_reported` cerca de las 3 horas se marcan como urgentes.
- `src/routeTree.gen.ts` es generado por `@tanstack/router-plugin`: no se edita a mano y va en `globalIgnores` de ESLint. En `vite.config.ts`, `tanstackRouter()` va antes que `@vitejs/plugin-react`.
- TanStack Query para todo dato remoto, con las query keys centralizadas en `src/lib/queryKeys.ts`. Mutación → `invalidateQueries` de las keys afectadas.
- Router con `defaultPendingComponent` (aparece a los 200 ms) y `defaultErrorComponent`: ninguna pantalla queda en blanco con un loader lento.

### UI y diseño (ambas apps)

- Tokens en el bloque `@theme` de `packages/ui` (Tailwind v4, sin `tailwind.config`). Usar los tokens del proyecto, no la paleta por defecto de Tailwind suelta. Semánticos (`success`, `warning`, `danger`) solo en los tonos que existan; para tintes suaves, modificador de opacidad (`bg-success-600/10`).
- **Nada de scroll horizontal en el `<body>`.** Tablas anchas, dentro de su propio `overflow-x-auto`. Todo debe funcionar desde 360 px.
- Modales con `Modal` de `packages/ui`: hoja anclada abajo en celular, centrada en escritorio, encabezado y pie fijos (`shrink-0`) con cuerpo con scroll.
- Una sola acción `primary` por bloque. Confirmaciones de un clic con `ConfirmModal`.
- Controles propios en vez de `<select>`/`<details>` nativos (`CustomSelect`, `DatePicker`, segmented controls para 2–3 opciones).
- **Trampa de cascade layers:** cualquier CSS con selector de elemento bare (`h2 {}`, `button {}`) va dentro de `@layer base`; si no, le gana a las utilidades de Tailwind sin importar especificidad.
- **Tablas largas en modales:** `sticky` y `bg-*` van en `<th>`/`<td>`, no en `<thead>`/`<tr>`; si se define `::-webkit-scrollbar`, declarar `width` y `height`.
- Gráficas: solo con más de 2 categorías dinámicas; 1–2 valores van en KPI. Una serie = un color, salvo que el color codifique un estado real.

## Base de datos

- **Supabase es producción.** Proyecto creado con el correo del restaurante. Las pruebas contra producción crean el registro, lo verifican y lo borran después por `psql`; el frontend no tiene DELETE.
- **Migraciones en `supabase/migrations/000N_nombre.sql`**, numeradas. Nunca editar una migración ya aplicada: se crea la siguiente. Toda migración que cambie datos o políticas lleva su script de reversa en `supabase/rollback/000N_nombre_rollback.sql`.
- **RLS activo en todas las tablas.** El rol `anon` no tiene `select` sobre ninguna tabla: solo ejecuta las RPC públicas. `has_role(min_role)` se usa en las políticas y dentro de cada RPC del panel.
- **Toda RPC que cambie una reserva** es `security definer`, valida, bloquea la fila de la tanda con `select … for update` y escribe en `audit_log`. `search_path` fijado en cada función.
- **Lista blanca de columnas:** `update_reservation` solo acepta `party_size`, `allergies`, `internal_note`. Nunca un UPDATE genérico con un `patch` libre (era el hueco de `updateReservationPayment` en el sistema viejo).
- **Las tandas son filas** (`service_slots`), generadas desde el tipo de servicio de cada día o evento. Cambiar un tipo de servicio no toca reservas ya hechas; cada reserva guarda su precio.
- `paid_amount` no se guarda: se calcula de `payments` verificados. La disponibilidad sale de la vista `slot_availability`.
- **Bitácora por trigger**, append-only, no desde el cliente. Cualquier tabla con columna `cancelled`/`anulada` booleana o cambio de `status` queda registrada.
- **pg_cron:** `expire_holds()` cada minuto (held > 1 h → `expired`; `payment_reported` > 3 h → vuelve a `held` con plazo nuevo), `generate_slots()` cada madrugada (90 días adelante), `close_service_day()` al cierre.

### Tablas

`settings` (una fila) · `service_types` · `weekly_schedule` · `special_dates` (eventos y cierres) · `service_slots` · `customers` · `reservations` · `payments` · `staff` · `audit_log`. Esquema completo en `docs/historial-tecnico.md` y en las migraciones.

Estados de `reservations.status`: `held` → `payment_reported` → `confirmed` → `attended`, más los finales `expired`, `cancelled`, `no_show`. En pantalla: Apartada, Pago reportado, Confirmada, Asistió, Vencida, Cancelada, **No se presentó** (nunca "no-show" en la UI).

## Roles y visibilidad

| Rol | Acceso |
|---|---|
| Cliente (`anon`) | Solo RPC públicas: disponibilidad, reservar, reportar pago, Mi reserva |
| Dueño (`owner`) | Todo, incluidos usuarios del panel |
| Administrador (`admin`) | Verificar pagos, gestionar reservas, calendario, tipos de servicio, configuración e ingresos. Sin gestión de usuarios |
| Host/Mesero (`host`) | Servicio del día: check-in, no se presentó, verificación de cumpleaños. Sin configuración ni ingresos |

Cuentas individuales por persona, sin cuentas compartidas; el dueño invita usuarios (sin registro abierto). Cierre de sesión por inactividad.

## Reglas de negocio (no romper sin confirmación explícita)

1. El precio depende del tipo de servicio; cada reserva guarda el precio vigente al crearla.
2. Cada tanda tiene su propio cupo, definido por el admin en general, por evento o por tanda. Las personas incluyen a quien reserva.
3. Una sola reserva puede ocupar la tanda completa.
4. Ocupan cupo las reservas `held` sin vencer, `payment_reported`, `confirmed` y `attended`.
5. Una reserva apartada tiene 1 hora para pagar; al vencer pasa a vencida y libera el cupo.
6. El botón "Enviar comprobante por WhatsApp" pasa la reserva a pago reportado y detiene el plazo. Si en 3 horas el admin no la confirma, o la rechaza, vuelve a apartada con plazo nuevo.
7. El pago es completo y manual, a la llave configurada. No hay abonos ni pasarela.
8. Una reserva queda confirmada cuando el admin verifica el pago (con referencia de la transferencia).
9. Ninguna reserva se borra: toda cancelación queda registrada con motivo y responsable.
10. El software es el único canal. Las reservas desde el panel son solo para excepciones.
11. Máximo 3 reservas por celular al día.
12. Agenda abierta hasta 3 meses adelante; anticipación mínima opcional y configurable.
13. Fechas especiales y cierres se configuran o bloquean a mano.
14. La duración la fija el tipo de servicio; el cliente no la elige.
15. Quien no se presenta pierde el pago; no se bloquea al cliente.
16. Cambio de fecha según términos y condiciones. Cancelación: hasta 24 h antes con devolución o cambio de fecha; con menos de 24 h no hay devolución. **Política provisional, se ajusta con el dueño** — dejarla en `settings`, no en código.
17. El cumpleañero puede ser cualquiera del grupo; se verifica con documento al llegar.
18. Consultar o cambiar una reserva exige código + apellido o celular.

Valores configurables por el admin (no escribirlos en código): plazo de pago (60 min), límite de pago reportado (180 min), ventana de reserva (90 días), anticipación mínima, máximo de reservas por día (3), horas de la política de cancelación (24).

## Control antifraude (no negociable)

- Consecutivo continuo de reservas con alerta ante huecos.
- Todo pago verificado guarda referencia, quién lo verificó y cuándo; el rechazo exige motivo.
- Bitácora de auditoría por trigger en toda creación, cancelación, cambio de estado, cambio de precio y edición.
- Registros inmutables: nada se borra, todo se anula con motivo. Reforzado en RLS/RPC, no solo en la UI.
- Datos del cliente siempre escapados al pintarlos (React lo hace; nunca `dangerouslySetInnerHTML` con datos de usuario). El sistema viejo permitía inyección de HTML desde el formulario público.
- Login con límite de intentos; la clave nunca viaja en una URL.

## Módulos (COT-2026-034)

M1 Configuración y maestros · M2 Tipos de servicio, eventos y calendario · M3 Reserva web · M4 Pago manual · M5 Mi reserva · M6 Bandeja de verificación · M7 Gestión de reservas · M8 Servicio del día · M9 Clientes · M10 Reportes y auditoría (indicadores + exportación a PDF y Excel) · T1 Seguridad y roles · T2 Migración del historial · T3 Infraestructura y respaldos · T4 Capacitación.

Orden de construcción: base y RLS → tipos de servicio y RPC de reserva → migración a un proyecto de prueba → sitio cliente → panel → salida a producción → ficha de cliente, reportes y auditoría en pantalla.

## Fuera de alcance (no implementar sin que Alessandro lo confirme como adicional)

Pasarela de pagos en línea, mensajes automáticos por WhatsApp Business API, facturación electrónica DIAN, app móvil nativa, operación sin internet, varias sedes, lista de espera, abonos.

## Migración del sistema actual

- Origen: hoja `Reservas` (652 filas, 18 columnas) + `PropertiesService` del Apps Script (`blockedDates`, `dateOverrides`, `config`). Script: `scripts/migrate-from-sheets.ts`.
- Celulares normalizados a +57; los inválidos van a una lista de revisión, no se descartan.
- Tandas históricas (13:00, 15:30) entran con un tipo de servicio "Histórico". `pagado`/`abono` → `confirmed` (pasadas → `attended`); `pendiente` pasada → `expired`.
- Se corre primero contra un proyecto de prueba; al final, una consulta compara conteos y sumas de `total`/`paidAmount` contra el Excel.

## Infraestructura

- Todo en planes gratuitos (Vercel free, Supabase free) a nombre del restaurante. Supabase free se pausa tras 7 días sin actividad: tenerlo en cuenta en el proyecto de prueba.
- **Respaldos** (mismo esquema que lavadero-SM): no se usan los backups de Supabase (son del plan pago). `.github/workflows/respaldo-diario.yml` hace `pg_dump` por el Session pooler, cifra con AES-256 y sube con rclone al Google Drive del correo del restaurante (rotación 7 diarios / 4 semanales / 12 mensuales). `prueba-restauracion.yml` restaura cada mes en un `supabase start` desechable y compara conteos. Secrets: `SUPABASE_DB_URL`, `RCLONE_DRIVE_TOKEN`, `RESPALDO_CLAVE`. Si el repo es público, ningún script puede imprimir datos del negocio en el log. El bucket de Storage (logo, QR) también entra al respaldo.
- Variables de entorno documentadas en `.env.example` de cada app (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` en web; `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en admin). La service role key nunca va a un front.

## Pendiente de confirmación con el cliente

- Política final de cancelación y devoluciones (regla 16 es provisional).
- Tipos de servicio reales (menú, precio, tandas y cupo de cada uno) y textos de términos y condiciones.
