import { describe, expect, it } from 'vitest'

import { format_centavos, format_currency } from './format_currency'

describe('format_currency', () => {
  it('renders the peso sign, comma grouping, and two decimals', () => {
    expect(format_currency(1234.5)).toBe('₱1,234.50')
    expect(format_currency(750)).toBe('₱750.00')
    expect(format_currency(0)).toBe('₱0.00')
  })

  it('always shows two decimals, even for whole amounts', () => {
    expect(format_currency(1500)).toMatch(/\.\d{2}$/)
  })

  it('groups thousands', () => {
    expect(format_currency(1000000)).toBe('₱1,000,000.00')
  })
})

describe('format_centavos', () => {
  it('formats whole and fractional pesos from integer centavos', () => {
    expect(format_centavos(123450)).toBe('₱1,234.50')
    expect(format_centavos(0)).toBe('₱0.00')
    expect(format_centavos(1)).toBe('₱0.01')
    expect(format_centavos(7)).toBe('₱0.07')
    expect(format_centavos(99_999_999)).toBe('₱999,999.99')
  })

  it('formats the maximum line', () => {
    expect(format_centavos(999_999_890_000)).toBe('₱9,999,998,900.00')
  })

  it('agrees with the integer split for every centavo in a wide sweep', () => {
    const check = (centavos: number) => {
      const pesos = Math.floor(centavos / 100)
      const cents = String(centavos % 100).padStart(2, '0')
      const grouped = String(pesos).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      expect(format_centavos(centavos)).toBe(`₱${grouped}.${cents}`)
    }
    for (let centavos = 0; centavos <= 5000; centavos += 1) check(centavos)
    for (let centavos = 49_999_994_500_000; centavos > 49_999_994_499_000; centavos -= 1) {
      check(centavos)
    }
  })
})
