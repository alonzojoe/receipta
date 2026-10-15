import { describe, expect, it } from 'vitest'

import { format_thousandths, item_figures, item_line_total, summarise_receipt } from './receipt_totals'

describe('item_line_total', () => {
  it('is blank while either number is invalid', () => {
    expect(item_line_total({ quantity: '', price: '10' })).toBeUndefined()
    expect(item_line_total({ quantity: '1', price: '12.345' })).toBeUndefined()
  })

  it('rounds the line once, half up', () => {
    expect(item_line_total({ quantity: '0.5', price: '0.01' })).toBe(1)
    expect(item_line_total({ quantity: '3', price: '19.99' })).toBe(5997)
  })
})

describe('summarise_receipt', () => {
  const line = (quantity: string, price: string) => ({ id: 'x', name: 'n', quantity, price, image: null })

  it('sums per-line rounding: three 0.5 x 0.01 lines are 3 centavos, not 2', () => {
    const lines = [line('0.5', '0.01'), line('0.5', '0.01'), line('0.5', '0.01')]
    expect(summarise_receipt({ items: lines, discount: '' }).subtotal).toBe(3)
  })

  it('uses only the valid lines', () => {
    const summary = summarise_receipt({ items: [line('1', '100'), line('', '5')], discount: '' })
    expect(summary).toEqual({ subtotal: 10000, discount: 0, total: 10000 })
  })

  it('has no total when the discount is over the subtotal or invalid, never a negative one', () => {
    expect(summarise_receipt({ items: [line('1', '10')], discount: '11' }).total).toBeUndefined()
    expect(summarise_receipt({ items: [line('1', '10')], discount: 'abc' }).total).toBeUndefined()
    expect(summarise_receipt({ items: [line('1', '10')], discount: '10' }).total).toBe(0)
  })
})

describe('format_thousandths and item_figures', () => {
  it('drops trailing zeros and never rounds', () => {
    expect(format_thousandths(1500)).toBe('1.5')
    expect(format_thousandths(2000)).toBe('2')
    expect(format_thousandths(1)).toBe('0.001')
    expect(format_thousandths(9_999_999)).toBe('9999.999')
  })

  it('normalises what was typed', () => {
    expect(item_figures({ quantity: '007', price: '1,234.50' })).toEqual({
      quantity: '7',
      unit_price: 123450,
      line_total: 864150,
    })
    expect(item_figures({ quantity: 'x', price: '1' })).toBeUndefined()
  })
})
