import { describe, expect, it } from 'vitest'

import { draft_max_chars } from '@/entities/receipt'
import { fixture_now, make_item, make_valid_values, tiny_jpeg } from '@/test/receipt_fixtures'

import { draft_version, has_images, parse_draft, strip_images, type Draft } from './draft_schema'
import { make_default_values } from './receipt_form_values'

function make_draft(overrides: Partial<Draft> = {}): Draft {
  return { version: draft_version, step: 2, values: make_valid_values(), ...overrides }
}

function reason_of(text: string) {
  const parsed = parse_draft(text)
  return parsed.ok ? 'ok' : parsed.reason
}

/** A copy with one key absent, standing in for a draft stored before that key existed. */
function without_key<T extends object>(values: T, key: keyof T) {
  const copy = { ...values }
  delete copy[key]
  return copy
}

describe('parse_draft', () => {
  it('round-trips a draft', () => {
    const draft = make_draft({
      values: make_valid_values({ items: [make_item({ image: tiny_jpeg })], notes: 'a\nb' }),
    })
    const parsed = parse_draft(JSON.stringify(draft))
    expect(parsed).toEqual({ ok: true, draft })
  })

  it('accepts a half-filled draft: empty names and a price still being typed', () => {
    const draft = make_draft({
      step: 2,
      values: {
        ...make_default_values(fixture_now),
        items: [make_item({ name: '', price: '12.345', quantity: '1.2345' })],
        discount: 'abc',
      },
    })
    expect(parse_draft(JSON.stringify(draft)).ok).toBe(true)
  })

  it('reports text that is not JSON as corrupt', () => {
    expect(reason_of('{not json')).toBe('corrupt')
    expect(reason_of('')).toBe('corrupt')
  })

  it('reports another version as wrong_version, older or newer', () => {
    expect(reason_of(JSON.stringify({ ...make_draft(), version: 2 }))).toBe('wrong_version')
    expect(reason_of(JSON.stringify({ ...make_draft(), version: 99 }))).toBe('wrong_version')
    expect(reason_of(JSON.stringify({ ...make_draft(), version: 0 }))).toBe('wrong_version')
  })

  it('reports a missing or non-numeric version as invalid_shape', () => {
    const { version: _version, ...rest } = make_draft()
    void _version
    expect(reason_of(JSON.stringify(rest))).toBe('invalid_shape')
    expect(reason_of(JSON.stringify({ ...make_draft(), version: '1' }))).toBe('invalid_shape')
  })

  it('reports non-object JSON as invalid_shape', () => {
    for (const text of ['null', '42', '"text"', '[]', 'true']) {
      expect(reason_of(text)).toBe('invalid_shape')
    }
  })

  it('reports a bad step as invalid_shape', () => {
    for (const step of [0, 5, 1.5, '2', null]) {
      expect(reason_of(JSON.stringify({ ...make_draft(), step }))).toBe('invalid_shape')
    }
  })

  it('reports wrongly typed values as invalid_shape', () => {
    const base = make_valid_values()
    const bad: unknown[] = [
      { ...base, issuer_name: 5 },
      { ...base, issuer_type: 'company' },
      { ...base, receipt_no: 'REF-1' },
      { ...base, items: [] },
      { ...base, items: 'x' },
      { ...base, items: [{ ...make_item(), price: 12 }] },
      { ...base, items: [{ ...make_item(), image: 'https://example.com/a.jpg' }] },
      { ...base, items: [{ ...make_item(), image: 'data:image/svg+xml;base64,PHN2Zz4=' }] },
      { ...base, items: [make_item(), make_item()] },
      { ...base, notes: 'x'.repeat(10_001) },
      undefined,
      null,
    ]
    for (const values of bad) {
      expect(reason_of(JSON.stringify({ version: 1, step: 1, values }))).toBe('invalid_shape')
    }
  })

  it('refuses more than 50 items and more than 10 photos', () => {
    const many = Array.from({ length: 51 }, (_, index) => make_item({ id: `i${index}` }))
    expect(
      reason_of(JSON.stringify(make_draft({ values: make_valid_values({ items: many }) }))),
    ).toBe('invalid_shape')
    const photos = Array.from({ length: 11 }, (_, index) =>
      make_item({ id: `i${index}`, image: tiny_jpeg }),
    )
    expect(
      reason_of(JSON.stringify(make_draft({ values: make_valid_values({ items: photos }) }))),
    ).toBe('invalid_shape')
  })

  it('refuses text longer than the draft guard before parsing it', () => {
    expect(reason_of('x'.repeat(draft_max_chars + 1))).toBe('invalid_shape')
  })

  it('drops keys it does not know', () => {
    const text = JSON.stringify({ ...make_draft(), extra: 1, values: { ...make_valid_values(), tin: '123' } })
    const parsed = parse_draft(text)
    expect(parsed.ok && 'tin' in parsed.draft.values).toBe(false)
  })
})

describe('strip_images and has_images', () => {
  it('removes every photo and nothing else', () => {
    const draft = make_draft({
      values: make_valid_values({
        items: [make_item({ id: 'a', image: tiny_jpeg }), make_item({ id: 'b', image: tiny_jpeg })],
      }),
    })
    const stripped = strip_images(draft)
    expect(stripped.values.items.every((item) => item.image === null)).toBe(true)
    expect(stripped.values.items.map((item) => item.name)).toEqual(
      draft.values.items.map((item) => item.name),
    )
    expect(has_images(draft)).toBe(true)
    expect(has_images(stripped)).toBe(false)
    // The original is not mutated.
    expect(draft.values.items[0].image).toBe(tiny_jpeg)
  })

  /**
   * The field was added after version 1 shipped. A draft already in someone's browser has
   * no such key; bumping the version would reject it as wrong_version and lose their work
   * over a field they never filled.
   */
  it('loads a draft saved before the discount description existed', () => {
    const stored = JSON.stringify({ ...make_draft(), values: without_key(make_draft().values, 'discount_description') })
    const parsed = parse_draft(stored)

    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.draft.values.discount_description).toBe('')
  })

  it('keeps a description through a save and restore', () => {
    const draft = make_draft()
    draft.values.discount = '100'
    draft.values.discount_description = 'student'
    const parsed = parse_draft(JSON.stringify(draft))

    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.draft.values.discount_description).toBe('student')
  })
})
