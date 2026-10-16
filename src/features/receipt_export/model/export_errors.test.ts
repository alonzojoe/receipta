import { describe, expect, it } from 'vitest'

import {
  blob_problem,
  classify_error,
  export_error_message,
  ExportFailure,
  type ExportError,
} from './export_errors'

describe('the messages (byte for byte from the spec)', () => {
  it('names the item for a photo that could not be read', () => {
    expect(export_error_message({ kind: 'photo_unreadable', item: 3 })).toBe(
      'The photo for item 3 could not be read. Remove it and attach it again, then try again.',
    )
  })

  it('says the receipt is too large', () => {
    expect(export_error_message({ kind: 'too_large' })).toBe(
      'This receipt is too large to make as an image on this device. Try fewer photos, or download the PDF.',
    )
  })

  it('says it took too long', () => {
    expect(export_error_message({ kind: 'timed_out' })).toBe('Making the file took too long. Try again.')
  })

  it.each(['blank', 'unmeasured', 'unknown'] as const)('gives the generic message for %s', (kind) => {
    expect(export_error_message({ kind })).toBe('The file could not be created. Your receipt is safe. Try again.')
  })

  it('never says Invoice or Official Receipt', () => {
    const errors: ExportError[] = [
      { kind: 'photo_unreadable', item: 1 },
      { kind: 'too_large' },
      { kind: 'timed_out' },
      { kind: 'blank' },
      { kind: 'unmeasured' },
      { kind: 'unknown' },
    ]
    for (const error of errors) expect(export_error_message(error)).not.toMatch(/invoice|official receipt/i)
  })
})

describe('classify_error', () => {
  it('keeps the kind of a failure the pipeline raised itself', () => {
    expect(classify_error(new ExportFailure({ kind: 'photo_unreadable', item: 3 }))).toEqual({
      kind: 'photo_unreadable',
      item: 3,
    })
    expect(classify_error(new ExportFailure({ kind: 'timed_out' })).kind).toBe('timed_out')
    expect(classify_error(new ExportFailure({ kind: 'blank' })).kind).toBe('blank')
  })

  it.each([
    new RangeError('Array buffer allocation failed'),
    new RangeError('Invalid array length'),
    new RangeError('Invalid typed array length: 99999999999'),
    new RangeError('Out of memory'),
    new DOMException('quota', 'QuotaExceededError'),
    // From another realm (an iframe), `instanceof RangeError` is false; the name still says it.
    { name: 'RangeError', message: 'Array buffer allocation failed' },
  ])('calls a memory failure too large: %s', (cause) => {
    expect(classify_error(cause).kind).toBe('too_large')
  })

  it('does not call every RangeError too large (a stack overflow is not a canvas problem)', () => {
    expect(classify_error(new RangeError('Maximum call stack size exceeded')).kind).toBe('unknown')
  })

  it.each([new Error('boom'), new TypeError('x is not a function'), 'a string', 42, null, undefined, { message: 'hm' }])(
    'calls anything else unknown, and does not throw: %s',
    (cause) => {
      expect(classify_error(cause).kind).toBe('unknown')
    },
  )

  it('keeps the raw cause for the console', () => {
    const cause = new Error('boom')
    expect(classify_error(cause)).toMatchObject({ kind: 'unknown', cause })
    const memory = new RangeError('Out of memory')
    expect(classify_error(memory)).toMatchObject({ kind: 'too_large', cause: memory })
  })
})

describe('blob_problem', () => {
  it('reads a null blob as too large (what a canvas over the limit gives)', () => {
    expect(blob_problem(null)).toEqual({ kind: 'too_large' })
  })

  it('refuses an empty file, and accepts a non-empty one', () => {
    expect(blob_problem({ size: 0 })?.kind).toBe('unknown')
    expect(blob_problem({ size: 1 })).toBeUndefined()
  })
})
