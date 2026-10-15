import { pad } from './pad'

/**
 * `REF-YYYYMMDD-HHMMSS` from the device's local clock, because the person reads this
 * number against their own watch. Local getters, never `toISOString`, which is UTC.
 */
export function make_receipt_number(now: Date) {
  const date = `${pad(now.getFullYear(), 4)}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`
  const time = `${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(now.getSeconds(), 2)}`
  return `REF-${date}-${time}`
}

export const receipt_number_pattern = /^REF-\d{8}-\d{6}$/
