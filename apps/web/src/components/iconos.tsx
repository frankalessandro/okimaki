import type { SVGProps } from 'react'

/** Íconos propios del sitio: trazo de 1.6 px, puntas redondas, rejilla de 24. Heredan el color del texto. */
type Props = SVGProps<SVGSVGElement> & { tam?: number }

function Svg({ tam = 20, children, ...props }: Props) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconoCalendario = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconoReloj = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)

export const IconoPersonas = (p: Props) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
    <path d="M15.5 5.6a3.1 3.1 0 0 1 0 5.8M17.6 14.6c1.8.6 3 2.2 3.4 4.4" />
  </Svg>
)

export const IconoPersona = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="7.5" r="3.5" />
    <path d="M5 20c.7-4 3.5-6.2 7-6.2s6.3 2.2 7 6.2" />
  </Svg>
)

export const IconoBebida = (p: Props) => (
  <Svg {...p}>
    <path d="M6 4h12l-1.6 15.2a1.8 1.8 0 0 1-1.8 1.6H9.4a1.8 1.8 0 0 1-1.8-1.6Z" />
    <path d="M6.6 9.5h10.8M14 4l2.5-2" />
  </Svg>
)

export const IconoPalillos = (p: Props) => (
  <Svg {...p}>
    <path d="m4 20 15-15M8 21 21 9" />
    <ellipse cx="7" cy="16.5" rx="4" ry="2.4" transform="rotate(-20 7 16.5)" />
  </Svg>
)

export const IconoDestello = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.5c.6 3.9 2.2 5.6 6 6.3-3.8.7-5.4 2.4-6 6.3-.6-3.9-2.2-5.6-6-6.3 3.8-.7 5.4-2.4 6-6.3Z" />
    <path d="M18.5 15.5c.2 1.4.8 2 2.1 2.2-1.3.3-1.9.9-2.1 2.3-.3-1.4-.9-2-2.2-2.3 1.3-.2 1.9-.8 2.2-2.2Z" />
  </Svg>
)

export const IconoLinterna = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5v2M9 4.5h6M9.5 19.5h5M12 19.5v2" />
    <path d="M8 6.5c-1.6 1.3-2.5 3.3-2.5 5.5s.9 4.2 2.5 5.5h8c1.6-1.3 2.5-3.3 2.5-5.5s-.9-4.2-2.5-5.5Z" />
    <path d="M6 12h12" opacity=".6" />
  </Svg>
)

export const IconoBarca = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 14h19l-2.3 3.6a2 2 0 0 1-1.7.9H6.5a2 2 0 0 1-1.7-.9Z" />
    <path d="M7 14v-2.2a1.2 1.2 0 0 1 1.2-1.2h1.6A1.2 1.2 0 0 1 11 11.8V14M13 14v-2.2a1.2 1.2 0 0 1 1.2-1.2h1.6a1.2 1.2 0 0 1 1.2 1.2V14" />
    <path d="M3 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" opacity=".55" />
  </Svg>
)

export const IconoPastel = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20.5h16M5 20.5V13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7.5" />
    <path d="M5 15c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0" />
    <path d="M12 11V8" />
    <path d="M12 3.5c1 1 1.4 1.9 1.2 2.6a1.2 1.2 0 0 1-2.4 0c-.2-.7.2-1.6 1.2-2.6Z" fill="currentColor" />
  </Svg>
)

export const IconoAlerta = (p: Props) => (
  <Svg {...p}>
    <path d="M10.3 4.2 2.9 17.4A2 2 0 0 0 4.6 20.4h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4.2" />
    <circle cx="12" cy="16.8" r=".9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconoInfo = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="7.9" r=".9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconoCopiar = (p: Props) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.6" />
    <path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
  </Svg>
)

/** Check que se dibuja al montarse. */
export const IconoCheck = ({ dibujar = false, ...p }: Props & { dibujar?: boolean }) => (
  <Svg {...p}>
    <path d="m4.5 12.5 4.6 4.6L19.5 6.7" pathLength={1} className={dibujar ? 'trazo' : undefined} />
  </Svg>
)

export const IconoQr = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.4" />
    <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 20.5h1.5M20.5 14v1.5" />
  </Svg>
)

export const IconoLlave = (p: Props) => (
  <Svg {...p}>
    <circle cx="8" cy="15.5" r="4.5" />
    <path d="m11.3 12.3 8.2-8.3M16.5 7l2.5 2.5M14.3 9.2l2 2" />
  </Svg>
)

export const IconoWhatsapp = ({ tam = 20, ...p }: Props) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5.1.2 1.7 2.6 4.2 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.5-.2Z" />
  </svg>
)

export const IconoInstagram = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.9" />
    <circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconoCompartir = (p: Props) => (
  <Svg {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
  </Svg>
)

export const IconoUbicacion = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
)

export const IconoChevron = ({ dir = 'der', ...p }: Props & { dir?: 'izq' | 'der' | 'abajo' | 'arriba' }) => {
  const rot = { der: 0, abajo: 90, izq: 180, arriba: 270 }[dir]
  return (
    <Svg {...p} style={{ transform: `rotate(${rot}deg)`, transition: 'transform .35s var(--ease-suave)', ...p.style }}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Svg>
  )
}

export const IconoFlecha = (p: Props) => (
  <Svg {...p}>
    <path d="M4 12h15.5M13.5 6l6 6-6 6" />
  </Svg>
)

export const IconoPlay = (p: Props) => (
  <Svg {...p}>
    <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.4-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" />
  </Svg>
)

export const IconoCerrar = (p: Props) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

export const IconoMenos = (p: Props) => (
  <Svg {...p}>
    <path d="M5.5 12h13" />
  </Svg>
)

export const IconoMas = (p: Props) => (
  <Svg {...p}>
    <path d="M5.5 12h13M12 5.5v13" />
  </Svg>
)

export const IconoBuscar = (p: Props) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Svg>
)

export const IconoRecargar = (p: Props) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4v4.5H15" />
  </Svg>
)

/** Ensō: círculo zen de pincel, abierto arriba a la derecha. */
export function Enso({ className = '', dibujar = true, grosor = 6 }: { className?: string; dibujar?: boolean; grosor?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true" focusable="false">
      <path
        d="M78 22C69.5 13.5 55.4 10 43 13.6 25.4 18.7 13.4 36.4 15.8 54.6c2.4 18.4 19.5 32 38 30.9 17.6-1 31.7-15.5 32.4-33.1.3-7.3-1.8-14.4-5.8-20.3"
        stroke="currentColor"
        strokeWidth={grosor}
        strokeLinecap="round"
        pathLength={1}
        className={dibujar ? 'trazo' : undefined}
      />
    </svg>
  )
}
