import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cx } from './ui'

/** Largo del código de reserva (clave aleatoria, ver migración 0005). */
export const LARGO_CODIGO = 8

/**
 * Deja solo los caracteres del código: mayúsculas y números, sin espacios ni guiones.
 * Si pegan el formato largo anterior (OKIMAKI-000007-K3QX9P) le quita el consecutivo.
 */
export function limpiarCodigo(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/^\s*[A-Z]+-[0-9]+-/, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, LARGO_CODIGO)
}

/** El valor guarda un espacio en las casillas vacías, para que borrar una del medio no corra las demás. */
const VACIA = ' '

export const codigoCompleto = (valor: string) => valor.length === LARGO_CODIGO && !valor.includes(VACIA)
export const codigoDe = (valor: string) => valor.replaceAll(VACIA, '')

/**
 * El código de reserva, carácter por carácter como un código de verificación: una casilla por carácter, avanza solo,
 * borra hacia atrás y acepta pegar el código completo. `onCompleto` se llama cuando se llena la última casilla.
 */
export function CodigoReserva({
  valor,
  onCambio,
  onCompleto,
  error,
  disabled,
}: {
  valor: string
  onCambio: (valor: string) => void
  onCompleto?: (codigo: string) => void
  error?: boolean
  disabled?: boolean
}) {
  const casillas = useRef<(HTMLInputElement | null)[]>([])
  const celdas = Array.from({ length: LARGO_CODIGO }, (_, i) => (valor[i] && valor[i] !== VACIA ? valor[i] : ''))

  const enfocar = (i: number) => {
    const el = casillas.current[Math.min(Math.max(i, 0), LARGO_CODIGO - 1)]
    el?.focus()
    el?.select()
  }

  function aplicar(nuevas: string[], siguiente: number) {
    const texto = nuevas.map((c) => c || VACIA).join('')
    onCambio(texto)
    if (codigoCompleto(texto)) onCompleto?.(texto)
    else enfocar(siguiente)
  }

  // También entra por aquí lo que el teclado del celular autocompleta o pega de golpe: se reparte desde la casilla actual.
  function escribir(i: number, texto: string) {
    // Escribir sobre una casilla con carácter deja dos: vale el nuevo, no se reparte.
    const tecleo = celdas[i] && texto.length === 2 ? texto.replace(celdas[i], '') : texto
    const limpio = limpiarCodigo(tecleo)
    const nuevas = [...celdas]
    if (!limpio) {
      // Borró la casilla, o escribió un carácter que no vale (la casilla queda como estaba si no tenía nada).
      if (texto === '') nuevas[i] = ''
      aplicar(nuevas, i)
      return
    }
    for (let k = 0; k < limpio.length && i + k < LARGO_CODIGO; k++) nuevas[i + k] = limpio[k]
    aplicar(nuevas, i + limpio.length)
  }

  function teclear(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !celdas[i]) {
      e.preventDefault()
      const nuevas = [...celdas]
      if (i > 0) nuevas[i - 1] = ''
      aplicar(nuevas, i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      enfocar(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      enfocar(i + 1)
    }
  }

  function pegar(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const limpio = limpiarCodigo(e.clipboardData.getData('text'))
    if (!limpio) return
    const nuevas = Array.from({ length: LARGO_CODIGO }, (_, k) => limpio[k] ?? '')
    aplicar(nuevas, limpio.length)
  }

  return (
    <div>
      <p id="codigo-reserva-rotulo" className="mb-2 text-[0.66rem] font-bold tracking-[0.14em] text-gold-300 uppercase">
        Código de reserva
      </p>
      <div
        key={error ? 'error' : 'ok'}
        role="group"
        aria-labelledby="codigo-reserva-rotulo"
        className={cx('flex items-center gap-1.5 sm:gap-2', error && '[animation:sacudir_.4s]')}
      >
        {celdas.map((c, i) => (
          <span key={i} className={cx('contents', i === LARGO_CODIGO / 2 && '[&>input]:ml-1.5 sm:[&>input]:ml-2')}>
            <input
              ref={(el) => {
                casillas.current[i] = el
              }}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={disabled}
              value={c}
              aria-label={`Carácter ${i + 1} de ${LARGO_CODIGO}`}
              aria-invalid={error || undefined}
              onChange={(e) => escribir(i, e.target.value)}
              onKeyDown={(e) => teclear(i, e)}
              onPaste={pegar}
              onFocus={(e) => e.currentTarget.select()}
              className={cx(
                'h-13 min-w-0 flex-1 rounded-xl border bg-carbon-900/80 text-center font-mono text-xl font-bold text-ivory-50 uppercase caret-transparent outline-none transition-colors duration-200 sm:h-14 sm:text-2xl',
                error ? 'border-danger-500/60' : c ? 'border-gold-500/40' : 'border-carbon-700',
                'focus:border-gold-400 focus:bg-carbon-950/70 disabled:opacity-50',
              )}
            />
          </span>
        ))}
      </div>
    </div>
  )
}
