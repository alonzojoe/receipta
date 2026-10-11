import { describe, expect, it } from 'vitest'

import { format_currency } from './format_currency'

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
