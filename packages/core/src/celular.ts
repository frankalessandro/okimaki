/** Celular colombiano → "+57XXXXXXXXXX", o null si no es válido. Misma regla que `normalizar_celular` en SQL. */
export function normalizarCelular(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, '')
  if (digitos.length === 12 && digitos.startsWith('57')) digitos = digitos.slice(2)
  if (digitos.length === 10 && digitos.startsWith('3')) return `+57${digitos}`
  return null
}
