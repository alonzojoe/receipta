import { describe, expect, it } from 'vitest'

import { payment_method_icon, payment_method_name } from './payment_method'

describe('payment method display', () => {
  it('names an institution, Cash, and the Other text', () => {
    expect(payment_method_name('gcash', '')).toBe('GCash')
    expect(payment_method_name('cash', 'stale')).toBe('Cash')
    expect(payment_method_name('other', '  Barter  ')).toBe('Barter')
    expect(payment_method_name('', '')).toBe('')
  })

  it('has a local logo only for an institution', () => {
    expect(payment_method_icon('gcash')).toBe('/institutions/gcash.png')
    expect(payment_method_icon('cash')).toBeUndefined()
  })
})
