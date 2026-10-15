import { describe, expect, it } from 'vitest'

import {
  make_default_values,
  make_empty_item,
  make_item_id,
  party_name_label,
} from './receipt_form_values'

describe('make_default_values', () => {
  const now = new Date(2026, 0, 5, 0, 5, 9)
  const values = make_default_values(now)

  it('starts both parties as Individual with empty names', () => {
    expect(values.issuer_type).toBe('individual')
    expect(values.recipient_type).toBe('individual')
    expect(values.issuer_name).toBe('')
    expect(values.recipient_name).toBe('')
  })

  it('has one item with an id, quantity pre-set to 1', () => {
    expect(values.items).toHaveLength(1)
    expect(values.items[0]).toMatchObject({
      name: '',
      quantity: '1',
      price: '',
      image: null,
    })
    expect(values.items[0].id.length).toBeGreaterThan(0)
  })

  it('takes the Receipt No. and date from the clock, in local time', () => {
    expect(values.receipt_no).toBe('REF-20260105-000509')
    expect(values.receipt_date).toBe('2026-01-05')
  })

  it('leaves payment, discount and notes empty, and never prefills a reference', () => {
    expect(values.payment_method).toBe('')
    expect(values.other_method).toBe('')
    expect(values.reference_no).toBe('')
    expect(values.discount).toBe('')
    expect(values.notes).toBe('')
  })

  it('gives every item a different id', () => {
    const ids = new Set(Array.from({ length: 500 }, () => make_item_id()))
    expect(ids.size).toBe(500)
    expect(make_empty_item().id).not.toBe(make_empty_item().id)
  })
})

describe('party_name_label', () => {
  it('only the label changes with the type', () => {
    expect(party_name_label('individual')).toBe('Full name')
    expect(party_name_label('organization')).toBe('Business name')
  })
})
