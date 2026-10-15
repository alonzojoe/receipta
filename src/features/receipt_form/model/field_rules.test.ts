import { describe, expect, it } from 'vitest'

import {
  discount_cap_rule,
  discount_rule,
  item_name_rule,
  items_count_rule,
  normalise_notes,
  notes_rule,
  other_method_rule,
  party_name_rule,
  payment_method_rule,
  price_rule,
  quantity_rule,
  receipt_date_rule,
  reference_rule,
} from './field_rules'

const now = new Date(2026, 5, 15, 12, 0, 0)

describe('party and item names', () => {
  it('requires a trimmed name and names the field in the message', () => {
    expect(party_name_rule('', 'Full name')).toBe('Full name is required')
    expect(party_name_rule('   ', 'Business name')).toBe('Business name is required')
    expect(item_name_rule('')).toBe('Item name is required')
  })

  it('accepts 100 characters and rejects 101', () => {
    expect(party_name_rule('a'.repeat(100), 'Full name')).toBeUndefined()
    expect(party_name_rule('a'.repeat(101), 'Full name')).toContain('100')
  })

  it('trims before counting', () => {
    expect(party_name_rule(`  ${'a'.repeat(100)}  `, 'Full name')).toBeUndefined()
  })

  it('counts by code point', () => {
    expect(party_name_rule('\u{1F600}'.repeat(100), 'Full name')).toBeUndefined()
    expect(party_name_rule('\u{1F600}'.repeat(101), 'Full name')).toContain('100')
  })

  it('rejects any control character, newline and tab included', () => {
    expect(party_name_rule('Juan\nDela Cruz', 'Full name')).toContain('single line')
    expect(party_name_rule('Juan\tDela Cruz', 'Full name')).toContain('single line')
    expect(party_name_rule('Juan\0Dela Cruz', 'Full name')).toContain('single line')
    expect(item_name_rule('a\r\nb')).toContain('single line')
  })
})

describe('other method', () => {
  it('is 1 to 50 characters', () => {
    expect(other_method_rule('')).toContain('required')
    expect(other_method_rule('Barter')).toBeUndefined()
    expect(other_method_rule('a'.repeat(50))).toBeUndefined()
    expect(other_method_rule('a'.repeat(51))).toContain('50')
  })
})

describe('reference no', () => {
  it('is optional', () => {
    expect(reference_rule('')).toBeUndefined()
    expect(reference_rule('   ')).toBeUndefined()
  })

  it('allows 40 characters and rejects 41', () => {
    expect(reference_rule('1'.repeat(40))).toBeUndefined()
    expect(reference_rule('1'.repeat(41))).toContain('40')
  })

  it('trims a pasted value before counting', () => {
    expect(reference_rule(`  ${'1'.repeat(40)}  `)).toBeUndefined()
  })

  it('rejects control characters', () => {
    expect(reference_rule('12\n34')).toBeDefined()
  })
})

describe('money fields', () => {
  it('reports the parser reason for price and quantity in the field wording', () => {
    expect(price_rule('')).toBe('Enter unit price')
    expect(price_rule('12.345')).toContain('2 decimal places')
    expect(quantity_rule('1.2345')).toContain('3 decimal places')
    expect(price_rule('1.5')).toBeUndefined()
    expect(quantity_rule('1.5')).toBeUndefined()
  })

  it('lets the discount be blank or zero', () => {
    expect(discount_rule('')).toBeUndefined()
    expect(discount_rule('0')).toBeUndefined()
    expect(discount_rule('-1')).toContain('negative')
  })

  it('caps the discount at the subtotal and quotes the subtotal', () => {
    expect(discount_cap_rule(5000, 5000)).toBeUndefined()
    expect(discount_cap_rule(5001, 5000)).toContain('₱50.00')
  })
})

describe('items count', () => {
  it('needs at least one and allows at most 50', () => {
    expect(items_count_rule(0)).toBeDefined()
    expect(items_count_rule(1)).toBeUndefined()
    expect(items_count_rule(50)).toBeUndefined()
    expect(items_count_rule(51)).toContain('50')
  })
})

describe('payment method', () => {
  it('requires a choice', () => {
    expect(payment_method_rule('')).toBe('Choose a payment method')
  })

  it('accepts cash, other and a known institution, and refuses an unknown id', () => {
    expect(payment_method_rule('cash')).toBeUndefined()
    expect(payment_method_rule('other')).toBeUndefined()
    expect(payment_method_rule('gcash')).toBeUndefined()
    expect(payment_method_rule('not-a-bank')).toBeDefined()
  })
})

describe('receipt date', () => {
  it('accepts today and a past date', () => {
    expect(receipt_date_rule('2026-06-15', now)).toBeUndefined()
    expect(receipt_date_rule('2026-06-14', now)).toBeUndefined()
  })

  it('rejects empty, a future date and a non-date, each differently', () => {
    const empty = receipt_date_rule('', now)
    const future = receipt_date_rule('2026-06-16', now)
    const fake = receipt_date_rule('2026-02-30', now)
    expect(empty).toBeDefined()
    expect(future).toContain('future')
    expect(fake).toContain('real')
    expect(new Set([empty, future, fake]).size).toBe(3)
  })
})

describe('notes', () => {
  it('accepts empty and whitespace-only, which normalise to empty', () => {
    expect(notes_rule('')).toBeUndefined()
    expect(notes_rule('   \n \t ')).toBeUndefined()
    expect(normalise_notes('  \r\n  ')).toBe('')
  })

  it('accepts exactly 300 characters and rejects 301 naming the limit', () => {
    expect(notes_rule('a'.repeat(300))).toBeUndefined()
    expect(notes_rule('a'.repeat(301))).toContain('300')
  })

  it('counts 300 emoji as 300', () => {
    expect(notes_rule('\u{1F600}'.repeat(300))).toBeUndefined()
    expect(notes_rule('\u{1F600}'.repeat(301))).toContain('300')
  })

  it('accepts five lines and rejects six', () => {
    expect(notes_rule('a\nb\nc\nd\ne')).toBeUndefined()
    expect(notes_rule('a\nb\nc\nd\ne\nf')).toContain('5 lines')
  })

  it('counts blank lines as lines', () => {
    expect(notes_rule('a\n\n\n\n\nb')).toContain('5 lines')
  })

  it('normalises CRLF to LF, so a\\r\\nb is two lines, not three', () => {
    expect(normalise_notes('a\r\nb')).toBe('a\nb')
    expect(notes_rule('a\r\nb\r\nc\r\nd\r\ne')).toBeUndefined()
    expect(notes_rule('a\r\nb\r\nc\r\nd\r\ne\r\nf')).toContain('5 lines')
  })

  it('counts a CRLF pair as one character, not two', () => {
    const text = `${'a'.repeat(100)}\r\n${'b'.repeat(100)}\r\n${'c'.repeat(96)}`
    // 100 + 1 + 100 + 1 + 96 = 298 once normalised, 300 if each CRLF counted twice.
    expect(notes_rule(text)).toBeUndefined()
  })

  it('rejects a tab and NUL but allows a newline', () => {
    expect(notes_rule('a\tb')).toContain('line breaks')
    expect(notes_rule('a\0b')).toContain('line breaks')
    expect(notes_rule('a\nb')).toBeUndefined()
  })

  it('trims before counting', () => {
    expect(notes_rule(`  ${'a'.repeat(300)}  `)).toBeUndefined()
  })
})
