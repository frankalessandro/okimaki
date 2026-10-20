/**
 * Celular → E.164 ("+573001234567"), o null si no es válido. Misma regla que `normalizar_celular` en SQL:
 * - Con "+" e indicativo distinto de 57: internacional, 8 a 15 dígitos en total.
 * - Si no: celular colombiano, 10 dígitos que empiezan por 3 (con o sin 57 delante).
 */
export function normalizarCelular(entrada: string): string | null {
  const crudo = entrada.trim()
  let digitos = crudo.replace(/\D/g, '')
  if (crudo.startsWith('+') && !digitos.startsWith('57')) {
    return digitos.length >= 8 && digitos.length <= 15 && !digitos.startsWith('0') ? `+${digitos}` : null
  }
  if (digitos.length === 12 && digitos.startsWith('57')) digitos = digitos.slice(2)
  if (digitos.length === 10 && digitos.startsWith('3')) return `+57${digitos}`
  return null
}
