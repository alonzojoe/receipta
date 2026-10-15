import { describe, expect, it } from 'vitest'

import { make_item, make_valid_values, tiny_jpeg } from '@/test/receipt_fixtures'

import { attach_budget } from './image_budget'

describe('attach_budget', () => {
  it('counts the photos already on the receipt', () => {
    const values = make_valid_values({
      items: [make_item({ id: 'a', image: tiny_jpeg }), make_item({ id: 'b' })],
    })
    expect(attach_budget(values, 1).image_count).toBe(1)
  })

  it('leaves out the photo being replaced, in the count and the length', () => {
    const values = make_valid_values({ items: [make_item({ id: 'a', image: tiny_jpeg })] })
    const replacing = attach_budget(values, 0)
    expect(replacing.image_count).toBe(0)
    const bare = attach_budget(make_valid_values({ items: [make_item({ id: 'a' })] }), 0)
    expect(replacing.draft_length).toBe(bare.draft_length)
  })

  it('grows by exactly the length of a stored photo', () => {
    const without = make_valid_values({ items: [make_item({ id: 'a' }), make_item({ id: 'b' })] })
    const with_photo = make_valid_values({
      items: [make_item({ id: 'a', image: tiny_jpeg }), make_item({ id: 'b' })],
    })
    const grown = attach_budget(with_photo, 1).draft_length - attach_budget(without, 1).draft_length
    // `"image":null` (4 characters) becomes `"image":"<data url>"` (data url + 2 quotes).
    expect(grown).toBe(tiny_jpeg.length + 2 - 4)
  })
})
