import { useId } from 'react'
import { cx } from './ui'

/** Mismo trazo del Ensō (iconos.tsx): pincelada que casi cierra el círculo. */
const TRAZO = 'M78 22C69.5 13.5 55.4 10 43 13.6 25.4 18.7 13.4 36.4 15.8 54.6c2.4 18.4 19.5 32 38 30.9 17.6-1 31.7-15.5 32.4-33.1.3-7.3-1.8-14.4-5.8-20.3'

/**
 * Espera del sitio: un ensō que se traza a pincel y se desvanece en ciclo, con un farol rojo que se mece adentro
 * (el de los aleros del yakatabune) y un halo cálido detrás. Sin movimiento queda el ensō completo y el farol quieto.
 */
export function Espera({ texto, className = '' }: { texto: string; className?: string }) {
  const id = `carga-${useId().replace(/[^\w-]/g, '')}`
  return (
    <div role="status" aria-live="polite" className={cx('flex flex-col items-center gap-5 py-8', className)}>
      <div className="relative size-28" aria-hidden="true">
        <span className="carga-halo absolute -inset-8 rounded-full bg-[radial-gradient(closest-side,rgb(243_184_102/.28),transparent)]" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" fill="none">
          {/* Huella tenue del trazo: el pincel siempre pasa por el mismo camino */}
          <path d={TRAZO} stroke="var(--color-gold-500)" strokeOpacity=".12" strokeWidth="7" strokeLinecap="round" />
          <path d={TRAZO} pathLength={1} className="carga-enso" stroke="var(--color-gold-300)" strokeWidth="7" strokeLinecap="round" />
        </svg>

        {/* Farol colgando del centro del ensō */}
        <svg viewBox="0 0 20 34" className="carga-farol absolute top-[22%] left-1/2 h-[56%] -translate-x-1/2 overflow-visible">
          <defs>
            <radialGradient id={id} cx=".45" cy=".4" r=".6">
              <stop offset="0" stopColor="#ffb08a" />
              <stop offset=".6" stopColor="#d23b2a" />
              <stop offset="1" stopColor="#7d1810" />
            </radialGradient>
          </defs>
          <path d="M10 0V9" stroke="#8a6a3a" strokeWidth=".9" />
          <ellipse cx="10" cy="21" rx="12" ry="13" fill="#d23b2a" opacity=".35" filter="blur(4px)" className="carga-brillo" />
          <ellipse cx="10" cy="20.5" rx="7.6" ry="10" fill={`url(#${id})`} />
          <path d="M3.4 11.5H16.6 M3.4 29.5H16.6" stroke="#1a110b" strokeWidth="2" />
          <path d="M5 15.5Q10 13.8 15 15.5 M4.4 20.5H15.6 M5 25.5Q10 27.2 15 25.5" stroke="#7d1810" strokeOpacity=".55" strokeWidth=".7" />
          <path d="M10 30V33" stroke="#c9a24b" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <p className="font-display text-lg text-ivory-100">
        {texto}
        <span aria-hidden="true" className="carga-puntos ml-0.5 inline-flex gap-0.5 text-gold-300">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </span>
      </p>
    </div>
  )
}
