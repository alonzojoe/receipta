import { describe, expect, it } from 'vitest'

import {
  choose_pixel_ratio,
  image_ratio_floor,
  image_ratio_preferred,
  max_canvas_pixels,
  page_ratio_preferred,
  scaled_size,
} from './canvas_budget'

const width = 600
const image = { width, preferred: image_ratio_preferred, floor: image_ratio_floor }

function area(w: number, h: number, ratio: number) {
  const size = scaled_size(w, h, ratio)
  return size.width * size.height
}

describe('choose_pixel_ratio: the image', () => {
  it('uses exactly 2 for the worst receipt the limits allow (10,800 px tall at 2x, 12.96 M)', () => {
    expect(choose_pixel_ratio({ ...image, height: 5400 })).toEqual({ ok: true, ratio: 2 })
    expect(area(width, 5400, 2)).toBe(12_960_000)
  })

  it('keeps 2 right up to the limit and lowers it one document pixel past', () => {
    // 1200 x 13332 = 15,998,400 fits; 1200 x 13334 = 16,000,800 does not.
    expect(choose_pixel_ratio({ ...image, height: 6666 })).toEqual({ ok: true, ratio: 2 })
    const past = choose_pixel_ratio({ ...image, height: 6667 })
    expect(past.ok).toBe(true)
    if (past.ok) {
      expect(past.ratio).toBeLessThan(2)
      expect(area(width, 6667, past.ratio)).toBeLessThanOrEqual(max_canvas_pixels)
    }
  })

  it('never rounds up: the area fits at every height in a sweep, and the ratio is in hundredths', () => {
    for (let height = 1; height <= 12_000; height += 7) {
      const choice = choose_pixel_ratio({ ...image, height })
      if (!choice.ok) continue
      expect(area(width, height, choice.ratio), `height ${height}`).toBeLessThanOrEqual(max_canvas_pixels)
      expect(Math.round(choice.ratio * 100) / 100).toBe(choice.ratio)
      expect(choice.ratio).toBeGreaterThanOrEqual(image_ratio_floor)
      expect(choice.ratio).toBeLessThanOrEqual(2)
    }
  })

  it('is the largest hundredth that fits: one more hundredth would not', () => {
    for (const height of [6700, 8000, 9500, 11_000, 11_800]) {
      const choice = choose_pixel_ratio({ ...image, height })
      expect(choice.ok).toBe(true)
      if (choice.ok) expect(area(width, height, choice.ratio + 0.01)).toBeGreaterThan(max_canvas_pixels)
    }
  })

  it('returns a ratio between the floor and 2 when that is what fits', () => {
    // sqrt(16,000,000 / (600 x 10,416)) is about 1.6.
    const choice = choose_pixel_ratio({ ...image, height: 10_416 })
    expect(choice.ok && choice.ratio >= 1.59 && choice.ratio <= 1.6).toBe(true)
  })

  it('stops exactly at the floor: 1.5 fits to 11,850 px, 11,900 does not', () => {
    expect(choose_pixel_ratio({ ...image, height: 11_850 })).toEqual({ ok: true, ratio: 1.5 })
    expect(choose_pixel_ratio({ ...image, height: 11_900 })).toEqual({ ok: false, reason: 'too_large' })
  })

  it('succeeds on the same input once the limit is larger', () => {
    expect(choose_pixel_ratio({ ...image, height: 11_900 }).ok).toBe(false)
    expect(choose_pixel_ratio({ ...image, height: 11_900, max_pixels: 17_000_000 }).ok).toBe(true)
  })

  it('makes the PNG 1200 px wide at 2, and follows the ratio when it is lowered', () => {
    expect(scaled_size(width, 5400, 2)).toEqual({ width: 1200, height: 10_800 })
    expect(scaled_size(width, 7000, 1.55).width).toBe(930)
  })
})

describe('choose_pixel_ratio: a PDF page', () => {
  const page = { width, preferred: page_ratio_preferred, floor: image_ratio_floor }

  it('uses 3 for an A4 page (1800 x 2547, about 4.6 M pixels)', () => {
    expect(choose_pixel_ratio({ ...page, height: 849 })).toEqual({ ok: true, ratio: 3 })
    expect(scaled_size(width, 849, 3)).toEqual({ width: 1800, height: 2547 })
  })

  it('is lowered below 3, and refused under the floor, when the limit is forced small (task 12)', () => {
    expect(choose_pixel_ratio({ ...page, height: 849, max_pixels: 3_000_000 }).ok).toBe(true)
    expect(choose_pixel_ratio({ ...page, height: 849, max_pixels: 1_000_000 })).toEqual({
      ok: false,
      reason: 'too_large',
    })
  })
})

describe('choose_pixel_ratio: input it cannot use', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('refuses %s without throwing', (bad) => {
    for (const key of ['width', 'height', 'preferred', 'floor', 'max_pixels'] as const) {
      expect(choose_pixel_ratio({ ...image, height: 5400, [key]: bad })).toEqual({ ok: false, reason: 'invalid' })
    }
  })
})
