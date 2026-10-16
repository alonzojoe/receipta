import { describe, expect, it } from 'vitest'

import { group_quantity } from './quantity_text'

describe('group_quantity', () => {
  it.each([
    ['1.5', '1.5'],
    ['2', '2'],
    ['999', '999'],
    ['1000', '1,000'],
    ['9999.999', '9,999.999'],
    ['0.001', '0.001'],
  ])('%s -> %s', (plain, expected) => {
    expect(group_quantity(plain)).toBe(expected)
  })
})
