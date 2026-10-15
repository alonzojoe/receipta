import { describe, expect, it } from 'vitest'

import { make_item, make_valid_values } from '@/test/receipt_fixtures'

import { timeline_details } from './timeline_details'

describe('timeline_details', () => {
  it('names both parties, counts the items, names the method and totals the receipt', () => {
    const values = make_valid_values({
      items: [make_item({ id: 'a' }), make_item({ id: 'b' })],
      discount: '500',
    })
    expect(timeline_details(values)).toEqual({
      parties: 'Juan Dela Cruz → Acme Trading',
      items: '2 items',
      payment: 'GCash',
      review: '₱2,500.00',
    })
  })

  it('says "1 item" and leaves out what there is not yet', () => {
    const values = make_valid_values({
      issuer_name: '  ',
      recipient_name: '',
      payment_method: '',
      items: [make_item({ price: '' })],
    })
    expect(timeline_details(values)).toEqual({
      parties: undefined,
      items: '1 item',
      payment: undefined,
      review: undefined,
    })
  })

  it('shows one name when only one is entered, and no total while the discount is unusable', () => {
    const values = make_valid_values({ recipient_name: '', discount: '999999' })
    const details = timeline_details(values)
    expect(details.parties).toBe('Juan Dela Cruz')
    expect(details.review).toBeUndefined()
  })
})
