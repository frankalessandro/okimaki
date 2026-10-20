/** Indicativos para el celular. Colombia va primero y es el predeterminado; el resto en orden alfabético. */
export type Pais = { iso: string; nombre: string; indicativo: string }

export const COLOMBIA: Pais = { iso: 'CO', nombre: 'Colombia', indicativo: '57' }

const OTROS: Pais[] = [
  { iso: 'DE', nombre: 'Alemania', indicativo: '49' },
  { iso: 'AR', nombre: 'Argentina', indicativo: '54' },
  { iso: 'AU', nombre: 'Australia', indicativo: '61' },
  { iso: 'BO', nombre: 'Bolivia', indicativo: '591' },
  { iso: 'BR', nombre: 'Brasil', indicativo: '55' },
  { iso: 'CA', nombre: 'Canadá', indicativo: '1' },
  { iso: 'CL', nombre: 'Chile', indicativo: '56' },
  { iso: 'CN', nombre: 'China', indicativo: '86' },
  { iso: 'KR', nombre: 'Corea del Sur', indicativo: '82' },
  { iso: 'CR', nombre: 'Costa Rica', indicativo: '506' },
  { iso: 'CU', nombre: 'Cuba', indicativo: '53' },
  { iso: 'EC', nombre: 'Ecuador', indicativo: '593' },
  { iso: 'SV', nombre: 'El Salvador', indicativo: '503' },
  { iso: 'ES', nombre: 'España', indicativo: '34' },
  { iso: 'US', nombre: 'Estados Unidos', indicativo: '1' },
  { iso: 'FR', nombre: 'Francia', indicativo: '33' },
  { iso: 'GT', nombre: 'Guatemala', indicativo: '502' },
  { iso: 'HN', nombre: 'Honduras', indicativo: '504' },
  { iso: 'IT', nombre: 'Italia', indicativo: '39' },
  { iso: 'JP', nombre: 'Japón', indicativo: '81' },
  { iso: 'MX', nombre: 'México', indicativo: '52' },
  { iso: 'NI', nombre: 'Nicaragua', indicativo: '505' },
  { iso: 'NL', nombre: 'Países Bajos', indicativo: '31' },
  { iso: 'PA', nombre: 'Panamá', indicativo: '507' },
  { iso: 'PY', nombre: 'Paraguay', indicativo: '595' },
  { iso: 'PE', nombre: 'Perú', indicativo: '51' },
  { iso: 'PT', nombre: 'Portugal', indicativo: '351' },
  { iso: 'PR', nombre: 'Puerto Rico', indicativo: '1' },
  { iso: 'GB', nombre: 'Reino Unido', indicativo: '44' },
  { iso: 'DO', nombre: 'República Dominicana', indicativo: '1' },
  { iso: 'CH', nombre: 'Suiza', indicativo: '41' },
  { iso: 'UY', nombre: 'Uruguay', indicativo: '598' },
  { iso: 'VE', nombre: 'Venezuela', indicativo: '58' },
]

export const PAISES: Pais[] = [COLOMBIA, ...OTROS]

/** Une indicativo y número para la RPC: Colombia va tal cual (la regla local ya lo acepta), el resto con "+". */
export function celularCompleto(pais: Pais, numero: string) {
  // Si lo escribieron ya con "+", manda lo que escribieron.
  if (pais.iso === COLOMBIA.iso || numero.trim().startsWith('+')) return numero
  return `+${pais.indicativo}${numero.replace(/\D/g, '')}`
}

/** Para buscar sin tildes ni mayúsculas: "japon" encuentra "Japón". */
export function normalizarBusqueda(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}
