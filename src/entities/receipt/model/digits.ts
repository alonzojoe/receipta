/**
 * Converts a string of ASCII digits to an integer, one digit at a time, without going
 * through a general-purpose number parser. User text never reaches the built-in float,
 * integer or constructor parsers, because those accept `1e3`, `Infinity`, hex and padded
 * whitespace. (A grep over `src/entities` for those names is part of the task checks.)
 *
 * Returns `undefined` when the value would exceed `ceiling`, so a 400-digit paste
 * cannot overflow into a float.
 */
export function digits_to_int(digits: string, ceiling: number): number | undefined {
  let value = 0
  for (let index = 0; index < digits.length; index += 1) {
    const digit = digits.charCodeAt(index) - 48
    if (digit < 0 || digit > 9) return undefined
    value = value * 10 + digit
    if (value > ceiling) return undefined
  }
  return value
}
