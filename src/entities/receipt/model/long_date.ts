import { is_real_date } from './receipt_date'

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/**
 * `2026-10-16` -> `16 October 2026`, built from the three parts of the string.
 *
 * It never constructs a `Date` from the ISO string: that parses as UTC midnight, which is
 * the wrong calendar day in every zone behind UTC. A malformed or impossible date comes
 * back unchanged instead of throwing, because the document must not crash on a stale draft
 * (the form is what validates it).
 */
export function long_date(value: string) {
  if (!is_real_date(value)) return value
  const [year, month, day] = value.split('-')
  return `${Number(day)} ${months[Number(month) - 1]} ${Number(year)}`
}
