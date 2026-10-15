import { describe, expect, it } from 'vitest'

import { set_timezone } from '@/test/timezone'

import { make_receipt_number, receipt_number_pattern } from './receipt_number'

describe('make_receipt_number', () => {
  it('zero-pads a single-digit month and day just after midnight', () => {
    expect(make_receipt_number(new Date(2026, 0, 5, 0, 5, 9))).toBe('REF-20260105-000509')
  })

  it('handles the last second of the year', () => {
    expect(make_receipt_number(new Date(2026, 11, 31, 23, 59, 59))).toBe(
      'REF-20261231-235959',
    )
  })

  it('always matches the documented pattern', () => {
    const samples = [
      new Date(2026, 0, 5, 0, 5, 9),
      new Date(2026, 11, 31, 23, 59, 59),
      new Date(2026, 8, 9, 9, 9, 9),
      new Date(2026, 1, 28, 12, 0, 0),
    ]
    for (const sample of samples) {
      expect(make_receipt_number(sample)).toMatch(receipt_number_pattern)
    }
  })

  it('reads the local clock, not UTC', () => {
    let restore = () => {}
    try {
      // The same instant, 22:00 UTC on 4 January, is a different local day per zone.
      const instant = new Date(Date.UTC(2026, 0, 4, 22, 0, 0))
      restore = set_timezone('Asia/Manila')
      expect(make_receipt_number(instant)).toBe('REF-20260105-060000')
      restore()
      restore = set_timezone('America/Los_Angeles')
      expect(make_receipt_number(instant)).toBe('REF-20260104-140000')
    } finally {
      restore()
    }
  })
})
