# Plan de Alcance — Sistema de reservas Okimaki369 (v1.2)

Versión 1.2: incorpora las rondas 1 y 2 con el socio (19 de octubre de 2026). Queda pendiente la información que debe entregar el cliente.

## El problema real

El sistema actual toma la reserva, pero todo lo que pasa después se resuelve a mano por WhatsApp y en la cabeza del admin. Con 652 reservas registradas y $8.058.000 en saldo pendiente, ese hueco ya cuesta plata y tiempo.

Así funciona hoy, paso a paso:

1. El cliente reserva en la web y recibe un código y la llave BBVA en texto.
2. Transfiere desde su app y manda la captura a un WhatsApp. El chat no queda conectado con la reserva.
3. El admin busca la reserva por nombre o código, compara la captura a ojo y la marca como pagada.
4. El cupo sigue ocupado aunque nunca llegue el pago: el sistema solo pinta "tiempo de espera vencido".
5. El día del servicio no hay check-in, ni registro de quién llegó o quién no.
6. Cancelar borra la fila, así que no queda historia de cancelaciones ni de quién no se presentó.

Donde se rompe:

- **Cupos fantasma.** Reservas pendientes vencidas bloquean tandas hasta que alguien las borre a mano.
- **Verificación lenta y sin trazabilidad.** No hay bandeja de "pagos por revisar" ni referencia de la transferencia guardada.
- **Calendario manual.** Se bloquea cada día uno por uno (hoy, del 15 de octubre al 31 de diciembre) y se acepta reservar hasta 2 años adelante.
- **Cliente a ciegas.** No puede consultar su reserva, reenviar el comprobante ni cambiarla.
- **Números engañosos.** "Total generado" suma lo reservado, no lo cobrado.
- **Riesgo de seguridad.** Clave en la URL, sin límite de intentos y sin protección contra reservas spam.

## Objetivo y principios

El objetivo es que cada cupo esté pagado, liberado o lleno de alguien que sí va a llegar, sin que el admin tenga que perseguirlo en WhatsApp. El sistema gestiona la reserva desde que se aparta hasta que el cliente se sienta en la mesa.

Principios del diseño:

- **El software es el único canal.** Todas las reservas entran por la web; no hay reservas por teléfono, Instagram ni en persona.
- **El pago sigue siendo manual y completo.** QR de la llave de pago, botón para copiarla y un botón que abre WhatsApp con el mensaje listo. Ese mismo botón le avisa al sistema que el comprobante va en camino.
- **Ninguna reserva se borra.** Todo cambio de estado queda registrado con fecha, hora y quién lo hizo.
- **El cupo se libera solo.** Si el cliente no envía el comprobante en 1 hora, la reserva vence y el cupo vuelve a estar disponible.
- **Reglas, no clics.** Tipos de servicio, días, horarios y cupos se configuran una vez; las fechas especiales se ajustan a mano.
- **El admin trabaja desde una bandeja.** Lo urgente (pagos por verificar, reservas por vencer, el servicio de hoy) aparece primero.
- **Se mide lo cobrado.** Los reportes separan lo confirmado de lo perdido por vencimientos, cancelaciones y clientes que no se presentaron.

## Roles

Cuatro tipos de usuario, cada uno con su propia vista. La restricción de datos se aplica en la base (RLS), no ocultando pantallas.

| Rol | Quién es | Acceso |
| --- | --- | --- |
| Cliente | Quien reserva desde la web | Reservar, pagar, consultar y cambiar su reserva con el código más el apellido o el celular. Sin cuenta |
| Dueño | El dueño del restaurante (uno solo) | Todo: configuración, tipos de servicio, precios, ingresos y usuarios |
| Administrador | Quien verifica los pagos | Verificar pagos, gestionar reservas y calendario, y ver ingresos. Sin gestión de usuarios |
| Host/Mesero | La mesera que recibe en la puerta | Lista del día, check-in, verificación de cumpleaños y marcar quién no se presentó. Sin configuración ni ingresos |

El WhatsApp lo atienden el administrador y la mesera por aparte. Los usuarios concretos y sus correos se definen durante el desarrollo.

## Ciclo de vida de una reserva

Cada reserva pasa por estados definidos, y solo dos de ellos liberan el cupo: vencida y cancelada.

![Ciclo de vida de una reserva](ciclo-de-vida.png)

La reserva apartada tiene 1 hora para pagar. Cuando el cliente toca "Enviar comprobante por WhatsApp", pasa a pago reportado y el plazo se detiene. El administrador tiene hasta 3 horas para verificarla; la bandeja la marca como urgente antes de que se cumplan. Si la rechaza o no la revisa a tiempo, vuelve a apartada con un plazo nuevo. Cancelar se puede desde apartada, pago reportado o confirmada, y siempre queda el motivo.

## Módulos

El sistema se divide en diez módulos con código propio. El mismo código se usa en la cotización y durante el desarrollo, para que cada línea cotizada se pueda rastrear.

### M1 — Configuración y maestros

- Datos del restaurante: nombre, logo y términos y condiciones.
- Medios de pago configurables: la llave BBVA u otra que defina el dueño, imagen del QR y número de WhatsApp.
- Mensaje de WhatsApp prellenado y mensaje de confirmación, ambos editables.
- Parámetros: plazo de pago (1 h), límite de pago reportado (3 h), ventana de reserva (3 meses), anticipación mínima y máximo de reservas por persona al día (3).
- Usuarios del panel y sus roles.

### M2 — Tipos de servicio y calendario

- Tipos de servicio totalmente configurables: nombre, menú, precio por persona, horario de tandas, duración y cupo por tanda.
- Asignación por día de la semana (por ejemplo, martes y miércoles un tipo; jueves y viernes otro).
- Eventos: el admin crea eventos con fecha, menú, precio y cupo propios, y se reservan con el mismo flujo que el servicio normal.
- Cupo ajustable por el admin en general, por evento o por tanda puntual.
- Bloqueo manual de fechas con motivo.
- Agenda abierta hasta 3 meses adelante y anticipación mínima opcional (por ejemplo, 1 hora antes de la tanda).

### M3 — Reserva web

- Calendario con disponibilidad por color; al elegir el día se ven el tipo de servicio, su menú, su precio y las tandas con cupos.
- Formulario: nombre, apellido, celular (+57 validado), personas y alergias (opcional).
- Cumpleaños opcional: nombre del cumpleañero, que puede ser cualquiera del grupo, y su fecha.
- Aceptación de términos y autorización de datos (Ley 1581).
- Captcha invisible y máximo 3 reservas por persona al día.
- Un QR en la puerta del local lleva a esta misma página para quien llega sin reserva.

### M4 — Pago manual

- Pantalla de pago con el monto exacto y un contador de 1 hora.
- Popup o modal con el QR de pago y botón "Copiar llave".
- Botón "Enviar comprobante por WhatsApp": abre el chat con el mensaje prellenado ("Hola, soy [nombre], tengo la reserva OKIMAKI-000001 para el [fecha] a las [tanda], [personas] personas, por $[valor]. Adjunto mi comprobante.") y al mismo tiempo pasa la reserva a pago reportado.
- Vencimiento automático de reservas apartadas sin pago, liberando el cupo.

### M5 — Mi reserva

- Consulta con el código de reserva más el apellido o el celular, como en las aerolíneas.
- Estado de la reserva y acceso de nuevo a la pantalla de pago.
- Cambio de fecha según los términos y condiciones.
- Cancelación según la política básica inicial (regla 16).
- Agregar al calendario del celular.

### M6 — Bandeja de verificación

- Pagos reportados por verificar, en orden de llegada y en tiempo real, marcados como urgentes antes de cumplir 3 horas.
- Acceso directo al chat de WhatsApp del cliente.
- Confirmar el pago completo con la referencia de la transferencia, o rechazarlo con motivo.
- Reservas apartadas por vencer.
- Mensaje de confirmación listo para enviar.

### M7 — Gestión de reservas

- Crear una reserva desde el panel solo en casos excepcionales (cliente sin smartphone, falla del sistema).
- Mover de fecha o tanda, editar personas, alergias y nota interna.
- Cancelar con motivo, sin borrar.
- Buscador por código, apellido o celular.

### M8 — Servicio del día

- Lista por tanda con personas, alergias y cumpleañeros, pensada para el celular de la mesera.
- Check-in: llegó, llegó incompleto o no se presentó.
- Verificación del documento del cumpleañero.

### M9 — Clientes

- Ficha por celular con el historial completo, incluidas las reservas migradas del sistema actual.
- Visitas, cancelaciones, veces que no se presentó y total pagado.
- Cumpleaños, alergias, etiquetas y notas internas.

### M10 — Reportes y auditoría

- Ingresos confirmados por día, semana y mes, y por tipo de servicio o evento.
- Ocupación por tanda y por día de la semana.
- Reservas perdidas (vencidas, canceladas, no se presentó) con su valor.
- Ticket promedio y personas por reserva.
- Clientes nuevos frente a recurrentes.
- Tiempo promedio de verificación de pagos.
- Bitácora de cambios (quién, cuándo, qué cambió).
- Exportación a PDF y Excel.

## Reglas de negocio

Estas reglas son la fuente de verdad del sistema; durante el desarrollo no se cambian sin aprobación. La regla 16 es una propuesta inicial que se ajusta con el dueño.

1. El precio depende del tipo de servicio; cada reserva guarda el precio vigente al crearla.
2. Cada tanda tiene su propio cupo, que el admin define en general, por evento o por tanda. Las personas incluyen a quien reserva.
3. Una sola reserva puede ocupar la tanda completa.
4. Ocupan cupo las reservas apartadas sin vencer, con pago reportado, confirmadas y con asistencia.
5. Una reserva apartada tiene 1 hora para pagar; al vencer pasa a vencida y libera el cupo.
6. El botón "Enviar comprobante por WhatsApp" pasa la reserva a pago reportado y detiene el plazo. Si en 3 horas el administrador no la confirma, o la rechaza, vuelve a apartada con plazo nuevo.
7. El pago es completo y manual, a la llave configurada. No hay abonos ni pasarela.
8. Una reserva queda confirmada cuando el administrador verifica el pago.
9. Ninguna reserva se borra: toda cancelación queda registrada con motivo y responsable.
10. El software es el único canal de reservas. Las reservas desde el panel son solo para excepciones.
11. Máximo 3 reservas por persona al día.
12. La agenda se abre hasta 3 meses adelante; la anticipación mínima es opcional y configurable.
13. Las fechas especiales y los cierres se configuran o bloquean a mano.
14. La duración la fija el tipo de servicio; las condiciones de uso de la mesa están en los términos y condiciones.
15. Quien no se presenta pierde el pago, según los términos y condiciones. No se bloquea al cliente.
16. El cambio de fecha se permite según los términos y condiciones; la cancelación sigue una política básica inicial: hasta 24 horas antes se puede cancelar con devolución o cambiar de fecha; con menos de 24 horas no hay devolución. Se ajusta con el dueño.
17. El cumpleañero puede ser cualquiera del grupo y se verifica con documento de identidad al llegar.
18. Consultar o cambiar una reserva exige el código más el apellido o el celular.

## Seguridad y control antifraude

El punto débil del sistema actual es el dinero sin rastro y una clave compartida que viaja en la URL. Estas medidas no son negociables:

- Usuarios individuales por persona, sin cuentas compartidas; cierre de sesión por inactividad.
- Login con límite de intentos; la clave nunca viaja en la URL.
- Todo pago verificado guarda la referencia de la transferencia, quién lo verificó y cuándo.
- Bitácora de auditoría en toda creación, cancelación, cambio de precio, cambio de estado y edición.
- Registros inmutables: nada se borra, todo se anula con motivo.
- Código de reserva consecutivo y único (OKIMAKI-000001), independiente del id interno.
- Nadie ve una reserva ajena: la consulta pide código más apellido o celular, nunca solo el celular.
- Datos del cliente escapados en todas las vistas del panel (evita inyección de código).
- Datos personales visibles solo para usuarios autenticados (Ley 1581).

## Infraestructura

Todo arranca en planes gratuitos y queda a nombre del restaurante. El detalle técnico está en `CLAUDE.md` y `docs/historial-tecnico.md`.

- Supabase free tier creado con el correo del restaurante.
- Sitio cliente y panel en Vercel free; el dominio actual de Netlify redirige al nuevo.
- Respaldo diario automático: GitHub Actions genera un `.sql` y lo guarda en el Google Drive del correo del restaurante.
- Costo mensual de infraestructura: $0 mientras el volumen quepa en los planes gratuitos.
- La mensualidad de soporte y mantenimiento ($150.000 al mes) cubre el respaldo, el monitoreo y el soporte.

## Entrega

El proyecto se entrega en una sola fase con los módulos M1 a M10.

**Incluye**

Los diez módulos, la seguridad transversal, la migración de todo el historial actual (652 reservas y sus clientes, conservando sus códigos; las reservas nuevas usan OKIMAKI-000001), el despliegue, los respaldos y una capacitación al personal.

**Antes de arrancar**

Cambiar ya la clave del panel actual y quitar el aviso "Clave por defecto: 1234". Son 5 minutos, sin costo, y cierra el hueco más grande mientras se construye lo nuevo.

**Fuera de alcance**

Pasarela de pagos en línea (posible como proyecto aparte, con su propia cotización y la comisión que cobra la pasarela), mensajes automáticos por WhatsApp Business API, facturación electrónica DIAN, app móvil nativa, operación sin internet y varias sedes.

**Ideas a futuro** (documentadas, no cotizadas)

Pagos en línea, recordatorios automáticos por WhatsApp y campañas para cumpleaños y clientes frecuentes.

## Condiciones comerciales

- **Cotización:** la presenta el socio al cliente.
- **Forma de pago:** 50% al iniciar y 50% al entregar.
- **Mensualidad de soporte y mantenimiento:** $150.000 al mes. Incluye el respaldo diario, el monitoreo, la corrección de errores y ajustes menores.
- **Garantía:** los primeros 15 días después de la entrega, soporte sin costo para ajustes de prueba y error. La mensualidad arranca al terminar ese periodo.
- **Cambios fuera del alcance:** se cotizan aparte *(propuesta)*.

## Pendientes

- [ ] Información del cliente: accesos al sistema actual, correo del restaurante, logo, QR y llave de pago, términos y condiciones, tipos de servicio actuales y dominio
- [ ] Ajustar la política de cancelación con el dueño
- [ ] Aprobación de la cotización
