import { describe, expect, it } from 'vitest'

import { money_message, type MoneyField } from './money_messages'
import type { MoneyReason } from './money'

const reasons: MoneyReason[] = [
  'empty',
  'not_a_number',
  'exponent',
  'negative',
  'plus_sign',
  'leading_decimal',
  'trailing_decimal',
  'multiple_points',
  'bad_thousands',
  'currency_symbol',
  'inner_space',
  'non_ascii_digit',
  'too_many_decimals',
  'zero',
  'too_large',
]
const fields: MoneyField[] = ['price', 'quantity', 'discount']

describe('money_message', () => {
  it('has readable wording for every reason on every field', () => {
    for (const field of fields) {
      for (const reason of reasons) {
        expect(money_message(field, reason).length).toBeGreaterThan(10)
      }
    }
  })

  it('gives each reason its own wording within a field', () => {
    for (const field of fields) {
      const unique = new Set(reasons.map((reason) => money_message(field, reason)))
      expect(unique.size).toBe(reasons.length)
    }
  })

  it('names the field limit, so price and quantity differ', () => {
    expect(money_message('price', 'too_many_decimals')).toContain('2 decimal places')
    expect(money_message('quantity', 'too_many_decimals')).toContain('3 decimal places')
    expect(money_message('price', 'too_large')).toContain('999,999.99')
    expect(money_message('quantity', 'too_large')).toContain('9,999.999')
    expect(money_message('price', 'zero')).not.toBe(money_message('quantity', 'zero'))
  })
})
