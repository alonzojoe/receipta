import { afterEach, describe, expect, it } from 'vitest'

import { set_timezone } from '@/test/timezone'

import { is_future, is_real_date, today_local } from './receipt_date'

let restore_timezone: (() => void) | undefined

afterEach(() => {
  restore_timezone?.()
  restore_timezone = undefined
})

describe('today_local', () => {
  it('formats the local calendar day with zero padding', () => {
    expect(today_local(new Date(2026, 0, 5, 0, 5, 9))).toBe('2026-01-05')
    expect(today_local(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31')
  })

  it('differs from the UTC date in the early morning in Manila (UTC+8)', () => {
    restore_timezone = set_timezone('Asia/Manila')
    // 06:00 local on 5 Jan is 22:00 UTC on 4 Jan.
    const now = new Date(Date.UTC(2026, 0, 4, 22, 0, 0))
    expect(now.toISOString().slice(0, 10)).toBe('2026-01-04')
    expect(today_local(now)).toBe('2026-01-05')
  })

  it('differs from the UTC date in the late evening in Los Angeles (UTC-8)', () => {
    restore_timezone = set_timezone('America/Los_Angeles')
    // 23:30 local on 4 Jan is 07:30 UTC on 5 Jan.
    const now = new Date(Date.UTC(2026, 0, 5, 7, 30, 0))
    expect(now.toISOString().slice(0, 10)).toBe('2026-01-05')
    expect(today_local(now)).toBe('2026-01-04')
  })

  it('late evening in Manila is the same date as UTC, which is why the pin matters', () => {
    restore_timezone = set_timezone('Asia/Manila')
    const now = new Date(Date.UTC(2026, 0, 5, 15, 30, 0))
    expect(today_local(now)).toBe('2026-01-05')
    expect(now.toISOString().slice(0, 10)).toBe('2026-01-05')
  })
})

describe('is_real_date', () => {
  it.each(['2026-01-05', '2026-12-31', '2024-02-29', '2000-02-29'])('accepts %s', (value) => {
    expect(is_real_date(value)).toBe(true)
  })

  it.each([
    '',
    '2026-02-30',
    '2026-02-29',
    '1900-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-01-00',
    '2026-1-5',
    '26-01-05',
    '2026/01/05',
    '2026-01-05T00:00',
    ' 2026-01-05',
    '0000-01-01',
    '\u0662\u0660\u0662\u0666-01-05',
  ])('rejects %j', (value) => {
    expect(is_real_date(value)).toBe(false)
  })
})

describe('is_future', () => {
  const now = new Date(2026, 5, 15, 12, 0, 0)

  it('accepts today and yesterday', () => {
    expect(is_future('2026-06-15', now)).toBe(false)
    expect(is_future('2026-06-14', now)).toBe(false)
  })

  it('rejects tomorrow', () => {
    expect(is_future('2026-06-16', now)).toBe(true)
  })

  it('compares on the local calendar, not UTC', () => {
    restore_timezone = set_timezone('America/Los_Angeles')
    // 23:30 local on 4 Jan. It is already 5 Jan in UTC, but not for this person.
    const evening = new Date(Date.UTC(2026, 0, 5, 7, 30, 0))
    expect(is_future('2026-01-04', evening)).toBe(false)
    expect(is_future('2026-01-05', evening)).toBe(true)
  })
})
