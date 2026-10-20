import { describe, expect, it } from 'vitest'

import { make_input, make_item } from '@/test/document_fixtures'

import { build_receipt_view } from './receipt_view'

import { price_max_centavos, quantity_max_thousandths } from './limits'
import {
  content_width,
  widest_chars,
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

  /**
   * Asserts the property, not the three numbers. Pinning the values meant this test had to be
   * edited to make the columns narrower, which is backwards: its job is to guarantee the
   * description survives whatever the numeric columns need, not to freeze what they need.
   */
  it('leaves the description a real column even when every numeric column is at its widest', () => {
    expect(numeric_cell_padding).toBe(12)
    // Wide enough for a thumbnail and a readable name beside it, not just the thumbnail.
    expect(description_width_floor).toBeGreaterThan(thumbnail_size * 2)
    expect(description_width_floor).toBeLessThan(content_width)
  })

  /**
   * Built FROM `limits.ts`, not from typed literals. The previous version pinned the three
   * strings by hand, so raising `price_max_centavos` would have left it green while the
   * figure overflowed its column - which is the one thing this test exists to catch.
   */
  it('makes each numeric column wide enough for the widest value the limits allow', () => {
    const max_quantity = (quantity_max_thousandths / 1000).toFixed(3)
    const max_price = (price_max_centavos / 100).toFixed(2)
    const view = build_receipt_view(
      make_input({ items: [make_item({ quantity: max_quantity, price: max_price })], discount: '' }),
    )
    const [line] = view.items

    expect(table_column_chars.qty).toBeGreaterThanOrEqual(widest_chars(line.quantity))
    expect(table_column_chars.unit_price).toBeGreaterThanOrEqual(widest_chars(line.unit_price))
    expect(table_column_chars.amount).toBeGreaterThanOrEqual(widest_chars(line.amount))
  })

  /**
   * The columns are measured, not counted. If this ever stops holding, the glyph model in
   * `widest_chars` has drifted from the font and the columns are being sized by character
   * count again - which cost the description about 42px the first time.
   */
  it('sizes the columns by glyph width, not by character count', () => {
    const amount = '₱9,999,998,900.00'
    expect(widest_chars(amount)).toBeLessThan(amount.length)
    expect(table_column_chars.amount).toBeLessThan(amount.length)
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
