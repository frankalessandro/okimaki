/**
 * Reservas recordadas en este dispositivo: después de reservar o consultar, Mi reserva abre sola la más reciente.
 * Se guarda solo el código público, en el localStorage de este navegador (no viaja en la URL ni sale del equipo).
 * Si el almacenamiento no está disponible (modo privado, navegador interno), todo funciona igual, sin recordar.
 */
const CLAVE = 'okimaki:reservas'
const MAXIMO = 5

export function reservasRecordadas(): string[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as unknown
    return Array.isArray(lista) ? lista.filter((c): c is string => typeof c === 'string') : []
  } catch {
    return []
  }
}

function guardar(lista: string[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, MAXIMO)))
  } catch {
    // Sin almacenamiento: no se recuerda, y ya.
  }
}

/** La deja de primera (la más reciente es la que se abre sola). */
export function recordarReserva(codigoPublico: string) {
  const codigo = codigoPublico.toUpperCase()
  guardar([codigo, ...reservasRecordadas().filter((c) => c !== codigo)])
}

export function olvidarReserva(codigoPublico: string) {
  guardar(reservasRecordadas().filter((c) => c !== codigoPublico.toUpperCase()))
}
