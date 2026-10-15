import { describe, expect, it } from 'vitest'

import { fixture_now, make_item, make_valid_values } from '@/test/receipt_fixtures'

import { make_default_values } from './receipt_form_values'
import { clamp_step, step_fields, steps, validate_step } from './step_rules'

const now = fixture_now

describe('step_fields', () => {
  it('owns every form value exactly once, so no field is silently ungated', () => {
    const owned = Object.values(step_fields).flat()
    expect(new Set(owned).size).toBe(owned.length)
    const keys = Object.keys(make_default_values(now)).filter((key) => key !== 'receipt_no')
    expect([...owned].sort()).toEqual([...keys].sort())
  })

  it('lists the four steps in order', () => {
    expect(steps).toEqual(['parties', 'items', 'payment', 'review'])
  })
})

describe('validate_step: parties', () => {
  it('flags both empty names under their paths', () => {
    const errors = validate_step('parties', make_default_values(now), now)
    expect(Object.keys(errors).sort()).toEqual(['issuer_name', 'recipient_name'])
  })

  it('uses the label for the chosen type', () => {
    const errors = validate_step('parties', make_default_values(now), now)
    expect(errors.issuer_name).toContain('Full name')
    const org = validate_step(
      'parties',
      { ...make_default_values(now), issuer_type: 'organization' },
      now,
    )
    expect(org.issuer_name).toContain('Business name')
  })

  it('passes when both names are filled', () => {
    expect(validate_step('parties', make_valid_values(), now)).toEqual({})
  })
})

describe('validate_step: items', () => {
  it('passes a valid receipt', () => {
    expect(validate_step('items', make_valid_values(), now)).toEqual({})
  })

  it('reports each bad line field by its path', () => {
    const values = make_valid_values({
      items: [make_item(), make_item({ id: 'b', name: '', quantity: '0', price: 'abc' })],
    })
    expect(Object.keys(validate_step('items', values, now)).sort()).toEqual([
      'items[1].name',
      'items[1].price',
      'items[1].quantity',
    ])
  })

  it('needs at least one item', () => {
    expect(validate_step('items', make_valid_values({ items: [] }), now)).toHaveProperty(
      'items',
    )
  })

  it('refuses a discount over the subtotal and names the subtotal', () => {
    const errors = validate_step('items', make_valid_values({ discount: '1,500.01' }), now)
    expect(errors.discount).toContain('₱1,500.00')
  })

  it('accepts a discount equal to the subtotal', () => {
    expect(validate_step('items', make_valid_values({ discount: '1500' }), now)).toEqual({})
  })

  it('omits the discount cap message while any line is invalid', () => {
    const values = make_valid_values({
      discount: '999999',
      items: [make_item(), make_item({ id: 'b', price: '' })],
    })
    const errors = validate_step('items', values, now)
    expect(errors).toHaveProperty('items[1].price')
    expect(errors).not.toHaveProperty('discount')
  })

  it('still reports a malformed discount while a line is invalid', () => {
    const values = make_valid_values({
      discount: 'abc',
      items: [make_item({ price: '' })],
    })
    expect(validate_step('items', values, now)).toHaveProperty('discount')
  })

  it('does not evaluate the cap with no items', () => {
    const errors = validate_step('items', make_valid_values({ items: [], discount: '5' }), now)
    expect(errors).not.toHaveProperty('discount')
    expect(errors).toHaveProperty('items')
  })
})

describe('validate_step: payment', () => {
  it('passes a valid receipt', () => {
    expect(validate_step('payment', make_valid_values(), now)).toEqual({})
  })

  it('requires a method', () => {
    const errors = validate_step('payment', make_valid_values({ payment_method: '' }), now)
    expect(errors).toHaveProperty('payment_method')
  })

  it('requires the Other text only for Other', () => {
    const other = make_valid_values({ payment_method: 'other', other_method: '' })
    expect(validate_step('payment', other, now)).toHaveProperty('other_method')
    const bank = make_valid_values({ payment_method: 'bdo', other_method: '' })
    expect(validate_step('payment', bank, now)).toEqual({})
  })

  it('does not let a hidden 41-character reference block a Cash payment', () => {
    const values = make_valid_values({ payment_method: 'cash', reference_no: '1'.repeat(41) })
    expect(validate_step('payment', values, now)).toEqual({})
  })

  it('blocks the same reference once the method is a bank', () => {
    const values = make_valid_values({ payment_method: 'gcash', reference_no: '1'.repeat(41) })
    expect(validate_step('payment', values, now)).toHaveProperty('reference_no')
  })

  it('does not let stale Other text under a bank block', () => {
    const values = make_valid_values({ payment_method: 'bpi', other_method: 'x'.repeat(80) })
    expect(validate_step('payment', values, now)).toEqual({})
  })

  it('rejects a future date and accepts today', () => {
    expect(
      validate_step('payment', make_valid_values({ receipt_date: '2026-10-16' }), now),
    ).toHaveProperty('receipt_date')
    expect(
      validate_step('payment', make_valid_values({ receipt_date: '2026-10-15' }), now),
    ).toEqual({})
  })

  it('never blocks on empty or whitespace-only Notes', () => {
    expect(validate_step('payment', make_valid_values({ notes: '' }), now)).toEqual({})
    expect(validate_step('payment', make_valid_values({ notes: ' \n ' }), now)).toEqual({})
  })

  it('blocks Notes over the limit', () => {
    const values = make_valid_values({ notes: 'a'.repeat(301) })
    expect(validate_step('payment', values, now)).toHaveProperty('notes')
  })
})

describe('validate_step: review', () => {
  it('has nothing to validate', () => {
    expect(validate_step('review', make_default_values(now), now)).toEqual({})
  })
})

describe('clamp_step', () => {
  it('keeps the saved step when every predecessor validates', () => {
    expect(clamp_step(4, make_valid_values(), now)).toBe(4)
    expect(clamp_step(3, make_valid_values(), now)).toBe(3)
    expect(clamp_step(1, make_valid_values(), now)).toBe(1)
  })

  it('goes back to the items step when a line is incomplete', () => {
    const values = make_valid_values({ items: [make_item({ name: '' })] })
    expect(clamp_step(4, values, now)).toBe(2)
  })

  it('goes back to the parties step when the issuer is empty', () => {
    expect(clamp_step(3, make_valid_values({ issuer_name: '' }), now)).toBe(1)
    expect(clamp_step(4, make_valid_values({ issuer_name: '' }), now)).toBe(1)
  })

  it('goes back to the payment step when payment is invalid', () => {
    expect(clamp_step(4, make_valid_values({ payment_method: '' }), now)).toBe(3)
  })

  it('never moves a saved step forward', () => {
    expect(clamp_step(2, make_valid_values(), now)).toBe(2)
    expect(clamp_step(1, make_default_values(now), now)).toBe(1)
  })

  it('treats the step being saved on as not yet validated', () => {
    // Step 2 is the saved step and is invalid; only its predecessors must pass.
    const values = make_valid_values({ items: [make_item({ name: '' })] })
    expect(clamp_step(2, values, now)).toBe(2)
  })

  it('turns anything that is not a step number into a real step', () => {
    expect(clamp_step(0, make_valid_values(), now)).toBe(1)
    expect(clamp_step(-3, make_valid_values(), now)).toBe(1)
    expect(clamp_step(9, make_valid_values(), now)).toBe(4)
    expect(clamp_step(2.5, make_valid_values(), now)).toBe(1)
    expect(clamp_step(Number.NaN, make_valid_values(), now)).toBe(1)
  })
})
