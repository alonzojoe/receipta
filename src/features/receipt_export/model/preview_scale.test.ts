import { describe, expect, it } from 'vitest'

import { preview_scale } from './preview_scale'

describe('preview_scale', () => {
  it('is 1 from 600 up, and never above 1 (criterion 55)', () => {
    for (const width of [600, 700, 768, 1280, 5000]) expect(preview_scale(width, 600)).toBe(1)
  })

  it('shrinks to fit below 600', () => {
    expect(preview_scale(300, 600)).toBe(0.5)
    expect(preview_scale(288, 600)).toBeCloseTo(0.48, 5)
  })

  it('is 1 before the container is measured, or when the width is unusable', () => {
    for (const width of [0, -10, Number.NaN, Number.POSITIVE_INFINITY * 0]) expect(preview_scale(width, 600)).toBe(1)
  })
})
