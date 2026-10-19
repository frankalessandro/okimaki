import { describe, expect, it } from 'vitest'
import { fechaLocalISO, formatearCOP, normalizarCelular, sumarDias, mensajeWhatsapp, enlaceWhatsapp } from './index'
import type { Reserva } from './index'

describe('normalizarCelular', () => {
  it('acepta formatos comunes', () => {
    expect(normalizarCelular('300 123 4567')).toBe('+573001234567')
    expect(normalizarCelular('+57 300-123-4567')).toBe('+573001234567')
    expect(normalizarCelular('573001234567')).toBe('+573001234567')
  })
  it('rechaza lo que no es celular', () => {
    expect(normalizarCelular('2345678')).toBeNull()
    expect(normalizarCelular('1001234567')).toBeNull()
  })
})

describe('fechaLocalISO', () => {
  it('a las 7 pm en Colombia sigue siendo el mismo día', () => {
    // 2026-10-20 00:30 UTC = 2026-10-19 19:30 en Bogotá
    expect(fechaLocalISO(new Date('2026-10-20T00:30:00Z'))).toBe('2026-10-19')
  })
})

describe('sumarDias', () => {
  it('cruza el fin de mes', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02')
  })
})

describe('formatearCOP', () => {
  it('usa separador de miles es-CO', () => {
    expect(formatearCOP(15000).replace(/\s/g, ' ')).toMatch(/15\.000/)
  })
})

describe('whatsapp', () => {
  const reserva = {
    code: 'OKIMAKI-000001', first_name: 'Ana', party_size: 2, total: 30000,
    slot_date: '2026-10-24', start_time: '15:00:00',
  } as Reserva

  it('rellena la plantilla y deja intactas las marcas desconocidas', () => {
    const msg = mensajeWhatsapp('{nombre} {codigo} {personas} {x}', reserva)
    expect(msg).toBe('Ana OKIMAKI-000001 2 {x}')
  })
  it('codifica el mensaje en el enlace', () => {
    expect(enlaceWhatsapp('+57 300 000 0000', 'hola mundo')).toBe('https://wa.me/573000000000?text=hola%20mundo')
  })
})
