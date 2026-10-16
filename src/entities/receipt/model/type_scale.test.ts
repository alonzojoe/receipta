import { describe, expect, it } from 'vitest'

import {
  content_width,
  line_height,
  page_height,
  page_margin,
  page_usable_height,
  page_width,
  photo_row_height,
  thumbnail_size,
  description_width,
  table_columns,
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

  it('keeps the table columns and the description inside the content column', () => {
    expect(table_columns).toEqual({ qty: 64, unit_price: 96, amount: 112 })
    expect(description_width + table_columns.qty + table_columns.unit_price + table_columns.amount).toBe(content_width)
    expect(description_width).toBeGreaterThan(thumbnail_size * 3)
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
