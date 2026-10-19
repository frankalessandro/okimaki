const formato = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Pesos enteros → "$ 15.000". */
export function formatearCOP(pesos: number): string {
  return formato.format(pesos)
}
