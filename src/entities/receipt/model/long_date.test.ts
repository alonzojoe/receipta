import { afterEach, describe, expect, it } from 'vitest'

import { set_timezone } from '@/test/timezone'

import { long_date } from './long_date'

let restore: (() => void) | undefined
afterEach(() => {
  restore?.()
  restore = undefined
})

describe('long_date', () => {
  it('writes the day, the month in full and the year', () => {
    expect(long_date('2026-10-16')).toBe('16 October 2026')
    expect(long_date('2026-12-31')).toBe('31 December 2026')
  })

  it('drops the leading zero of the day', () => {
    expect(long_date('2026-01-05')).toBe('5 January 2026')
  })

  it('knows the leap day, and refuses the one that does not exist', () => {
    expect(long_date('2028-02-29')).toBe('29 February 2028')
    expect(long_date('2026-02-29')).toBe('2026-02-29')
  })

  it('returns what it cannot read unchanged, and does not throw', () => {
    for (const bad of ['', 'garbage', '2026-13-01', '2026-1-5', '16/10/2026', '2026-10-16T00:00:00Z']) {
      expect(long_date(bad)).toBe(bad)
    }
  })

  it.each(['America/Los_Angeles', 'Asia/Manila', 'Pacific/Kiritimati'])(
    'gives the same calendar day in %s (it never builds a Date)',
    (zone) => {
      restore = set_timezone(zone)
      expect(long_date('2026-10-16')).toBe('16 October 2026')
      expect(long_date('2026-01-01')).toBe('1 January 2026')
    },
  )
})
