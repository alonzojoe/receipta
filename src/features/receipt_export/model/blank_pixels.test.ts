import { describe, expect, it, vi } from 'vitest'

import { has_paper_margins, is_canvas_blank, is_strip_blank, strip_pixels, strip_ranges } from './blank_pixels'

function strip(pixels: number, rgba: [number, number, number, number] = [255, 255, 255, 255]) {
  const data = new Uint8ClampedArray(pixels * 4)
  for (let index = 0; index < pixels; index += 1) data.set(rgba, index * 4)
  return data
}

describe('is_strip_blank', () => {
  it('is true for opaque white throughout', () => {
    expect(is_strip_blank(strip(1000))).toBe(true)
  })

  it('is false for a single pixel at 254', () => {
    const data = strip(1000)
    data[2000 * 1 + 1] = 254
    expect(is_strip_blank(data)).toBe(false)
  })

  it.each([
    ['red', [254, 255, 255, 255]],
    ['green', [255, 254, 255, 255]],
    ['blue', [255, 255, 254, 255]],
    ['alpha', [255, 255, 255, 254]],
  ] as const)('is false when only the %s channel of the last pixel is off', (_, rgba) => {
    const data = strip(10)
    data.set(rgba, 9 * 4)
    expect(is_strip_blank(data)).toBe(false)
  })

  it('is false for transparent white: that is not paper', () => {
    expect(is_strip_blank(strip(100, [255, 255, 255, 0]))).toBe(false)
  })

  it('is false for black', () => {
    expect(is_strip_blank(strip(100, [0, 0, 0, 255]))).toBe(false)
  })

  it('reports an empty strip, and a torn pixel, as blank so the file is refused', () => {
    expect(is_strip_blank(new Uint8ClampedArray(0))).toBe(true)
    expect(is_strip_blank(new Uint8ClampedArray([255, 255, 255, 255, 0, 0]))).toBe(true)
  })
})

describe('strip_ranges', () => {
  it('covers every row exactly once, the last strip short', () => {
    expect(strip_ranges(10, 4)).toEqual([
      { top: 0, rows: 4 },
      { top: 4, rows: 4 },
      { top: 8, rows: 2 },
    ])
  })

  it('is one strip when it fits, and none for no rows', () => {
    expect(strip_ranges(3, 10)).toEqual([{ top: 0, rows: 3 }])
    expect(strip_ranges(0, 10)).toEqual([])
    expect(strip_ranges(Number.NaN, 10)).toEqual([])
  })

  it('does not loop forever on a bad strip size', () => {
    expect(strip_ranges(5, 0)).toEqual([{ top: 0, rows: 5 }])
    expect(strip_ranges(5, Number.NaN)).toEqual([{ top: 0, rows: 5 }])
  })
})

describe('is_canvas_blank', () => {
  const white_reader = () => vi.fn((_top: number, rows: number) => strip(rows * 600))

  it('is true when every strip is white, and reads all of them', () => {
    const read = white_reader()
    expect(is_canvas_blank(600, 5000, read)).toBe(true)
    const rows_per_strip = Math.floor(strip_pixels / 600)
    expect(read).toHaveBeenCalledTimes(Math.ceil(5000 / rows_per_strip))
    const covered = read.mock.calls.reduce((total, [, rows]) => total + rows, 0)
    expect(covered).toBe(5000)
  })

  it('stops at the first strip with content (a normal receipt costs one read)', () => {
    const read = vi.fn((_top: number, rows: number) => strip(rows * 600, [0, 0, 0, 255]))
    expect(is_canvas_blank(600, 5000, read)).toBe(false)
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('finds content in the last strip', () => {
    const rows_per_strip = Math.floor(strip_pixels / 600)
    const height = rows_per_strip * 3 + 10
    const read = vi.fn((top: number, rows: number) => {
      const data = strip(rows * 600)
      if (top + rows === height) data.set([10, 10, 10, 255], 0)
      return data
    })
    expect(is_canvas_blank(600, height, read)).toBe(false)
    expect(read).toHaveBeenCalledTimes(4)
  })

  it('is blank for a canvas with no rows, and never reads', () => {
    const read = white_reader()
    expect(is_canvas_blank(600, 0, read)).toBe(true)
    expect(read).not.toHaveBeenCalled()
  })

  it('never asks for more than about a million pixels at once', () => {
    const read = white_reader()
    is_canvas_blank(1800, 2547, read)
    for (const [, rows] of read.mock.calls) expect(rows * 1800).toBeLessThanOrEqual(strip_pixels)
  })
})

describe('has_paper_margins', () => {
  const width = 4
  const height = 10
  const rows = (paint: (top: number) => [number, number, number, number]) => (top: number, count: number) => {
    const data = new Uint8ClampedArray(width * count * 4)
    for (let row = 0; row < count; row += 1) for (let x = 0; x < width; x += 1) data.set(paint(top + row), (row * width + x) * 4)
    return data
  }

  it('is true when the first and last rows are opaque white', () => {
    expect(has_paper_margins(width, height, rows((row) => (row === 5 ? [0, 0, 0, 255] : [255, 255, 255, 255])))).toBe(true)
  })

  it('is false for a transparent canvas, which is_canvas_blank would call content', () => {
    const transparent = rows(() => [0, 0, 0, 0])
    expect(has_paper_margins(width, height, transparent)).toBe(false)
    expect(is_canvas_blank(width, height, transparent)).toBe(false)
  })

  it('is false when either edge row is off-white or ink', () => {
    expect(has_paper_margins(width, height, rows((row) => (row === 0 ? [254, 255, 255, 255] : [255, 255, 255, 255])))).toBe(false)
    expect(has_paper_margins(width, height, rows((row) => (row === height - 1 ? [0, 0, 0, 255] : [255, 255, 255, 255])))).toBe(false)
  })

  it('reads only the first and the last row', () => {
    const read = vi.fn(rows(() => [255, 255, 255, 255]))
    has_paper_margins(width, height, read)
    expect(read.mock.calls).toEqual([[0, 1], [9, 1]])
  })

  it('is false for a canvas with no size', () => {
    expect(has_paper_margins(0, 10, () => new Uint8ClampedArray(0))).toBe(false)
    expect(has_paper_margins(4, 0, () => new Uint8ClampedArray(0))).toBe(false)
  })
})
