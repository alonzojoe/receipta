import { digits_to_int } from './digits'
import { pad } from './pad'

/** Today as `YYYY-MM-DD` on the device's local calendar, not UTC. */
export function today_local(now: Date) {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`
}

const date_shape = /^(\d{4})-(\d{2})-(\d{2})$/

function is_leap_year(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function days_in_month(year: number, month: number) {
  if (month === 2) return is_leap_year(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/**
 * True for a real calendar date written exactly as `YYYY-MM-DD`. Checked by the
 * calendar's own arithmetic, so `2026-02-30` and `2026-13-01` are refused rather
 * than rolled over into March or next year.
 */
export function is_real_date(value: string) {
  const match = date_shape.exec(value)
  if (!match) return false
  const year = digits_to_int(match[1], 9999)
  const month = digits_to_int(match[2], 99)
  const day = digits_to_int(match[3], 99)
  if (year === undefined || month === undefined || day === undefined) return false
  if (year < 1 || month < 1 || month > 12) return false
  return day >= 1 && day <= days_in_month(year, month)
}

/**
 * True when `date` is after today on the local calendar. Both are fixed-width ISO
 * strings, so string order is date order. Call it only with a real date.
 */
export function is_future(date: string, now: Date) {
  return date > today_local(now)
}
