import { describe, expect, it, vi } from 'vitest'

import { paint_on_white, type PaintContext } from './paint_on_white'

describe('paint_on_white', () => {
  it('fills an opaque white backing before it draws the image', () => {
    const order: string[] = []
    const backing = { data: new Uint8ClampedArray(2 * 2 * 4) } as ImageData
    const context: PaintContext = {
      createImageData: vi.fn(() => backing),
      putImageData: vi.fn(() => order.push('fill')),
      drawImage: vi.fn(() => order.push('draw')),
    }
    const source = {} as CanvasImageSource

    paint_on_white(context, source, 2, 2)

    expect(order).toEqual(['fill', 'draw'])
    expect(context.createImageData).toHaveBeenCalledWith(2, 2)
    // Every channel, alpha included, is 255: opaque white.
    expect(Array.from(backing.data).every((value) => value === 255)).toBe(true)
    expect(context.putImageData).toHaveBeenCalledWith(backing, 0, 0)
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0, 2, 2)
  })
})
