import { describe, expect, it } from 'vitest'

import { make_input, make_item } from '@/test/document_fixtures'

import { build_receipt_view } from './receipt_view'

import {
  content_width,
  line_height,
  page_height,
  page_margin,
  page_usable_height,
  page_width,
  photo_row_height,
  thumbnail_size,
  description_width_floor,
  numeric_cell_padding,
  table_column_chars,
  type_scale,
} from './type_scale'

describe('type_scale', () => {
  it('is the Stripe-style scale: title 28, lead 18, body 14, label 13', () => {
    expect(type_scale).toEqual({ title: 28, lead: 18, body: 14, label: 13 })
    expect(line_height).toEqual({ title: 36, lead: 26, body: 20, label: 18 })
  })

  it('makes the word Receipt the biggest text on the page', () => {
    const { title, lead, body, label } = type_scale
    expect(title).toBeGreaterThan(Math.max(lead, body, label))
    expect(lead).toBeGreaterThan(body)
  })

  it('leaves the description a real column even when every numeric column is at its widest', () => {
    expect(table_column_chars).toEqual({ qty: 9, unit_price: 11, amount: 17 })
    expect(numeric_cell_padding).toBe(12)
    expect(description_width_floor).toBeGreaterThan(thumbnail_size * 2)
    expect(description_width_floor).toBeLessThan(content_width)
  })

  it('makes each numeric column at least as many characters wide as the widest value the limits allow', () => {
    // Price 999,999.99 x quantity 9,999.999: the largest line the form accepts.
    const view = build_receipt_view(
      make_input({ items: [make_item({ quantity: '9999.999', price: '999999.99' })], discount: '' }),
    )
    const [line] = view.items
    expect(line.quantity).toBe('9,999.999')
    expect(line.unit_price).toBe('₱999,999.99')
    expect(line.amount).toBe('₱9,999,998,900.00')
    expect(table_column_chars.qty).toBeGreaterThanOrEqual(line.quantity.length)
    expect(table_column_chars.unit_price).toBeGreaterThanOrEqual(line.unit_price.length)
    expect(table_column_chars.amount).toBeGreaterThanOrEqual(line.amount.length)
  })

  it('has nothing below 13 px', () => {
    expect(Math.min(...Object.values(type_scale))).toBe(13)
  })

  it('has a whole-pixel line height at least the size, for every size', () => {
    for (const key of Object.keys(type_scale) as (keyof typeof type_scale)[]) {
      expect(Number.isInteger(line_height[key])).toBe(true)
      expect(line_height[key]).toBeGreaterThanOrEqual(type_scale[key])
    }
  })

  it('derives the usable height and the column from the page, not from typed numbers', () => {
    expect([page_width, page_height, page_margin]).toEqual([600, 849, 40])
    expect(page_usable_height).toBe(769)
    expect(content_width).toBe(520)
  })

  it('makes a photo row the thumbnail plus 8 px above and below', () => {
    expect(thumbnail_size).toBe(56)
    expect(photo_row_height).toBe(72)
  })
})
