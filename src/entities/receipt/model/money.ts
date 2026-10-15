import {
  price_decimals,
  price_max_centavos,
  quantity_decimals,
  quantity_max_thousandths,
  thousandths_per_unit,
} from './limits'
import { digits_to_int } from './digits'

/**
 * One reason per kind of mistake. Tests pin these codes; the wording lives in
 * `money_messages.ts`, so a copy edit cannot break a test.
 */
export type MoneyReason =
  | 'empty'
  | 'not_a_number'
  | 'exponent'
  | 'negative'
  | 'plus_sign'
  | 'leading_decimal'
  | 'trailing_decimal'
  | 'multiple_points'
  | 'bad_thousands'
  | 'currency_symbol'
  | 'inner_space'
  | 'non_ascii_digit'
  | 'too_many_decimals'
  | 'zero'
  | 'too_large'

export type ParsedAmount =
  | { ok: true; value: number }
  | { ok: false; reason: MoneyReason }

type DecimalRules = {
  /** Digits allowed after the point. The result is scaled by 10^decimals. */
  decimals: number
  /** Smallest accepted scaled value. 1 rejects zero; 0 accepts it. */
  min: number
  /** Largest accepted scaled value. */
  max: number
}

const currency_symbols = /[₱$€£¥]/u
const whitespace = /\s/u
const any_decimal_digit = /\p{Nd}/u
const ascii_digit = /[0-9]/
const only_number_chars = /^[0-9.,]+$/
const exponent_shape = /^[0-9.,]+[eE][+-]?[0-9]+$/
const grouped_integer = /^[0-9]{1,3}(,[0-9]{3})+$/
const minus_signs = /^[-\u2212]/u

function fail(reason: MoneyReason): ParsedAmount {
  return { ok: false, reason }
}

function has_non_ascii_digit(text: string) {
  for (const char of text) {
    if (any_decimal_digit.test(char) && !ascii_digit.test(char)) return true
  }
  return false
}

/**
 * Parses what a person typed into a scaled integer, or says why it is not a number.
 * Works on the string. Never rounds: a third decimal place in a price is an error,
 * not 12.35.
 */
export function parse_decimal(text: string, rules: DecimalRules): ParsedAmount {
  const trimmed = text.trim()
  if (trimmed === '') return fail('empty')
  if (currency_symbols.test(trimmed)) return fail('currency_symbol')
  if (whitespace.test(trimmed)) return fail('inner_space')
  if (has_non_ascii_digit(trimmed)) return fail('non_ascii_digit')
  if (minus_signs.test(trimmed)) return fail('negative')
  if (trimmed.startsWith('+')) return fail('plus_sign')
  if (exponent_shape.test(trimmed)) return fail('exponent')
  if (!only_number_chars.test(trimmed)) return fail('not_a_number')

  const point_count = trimmed.split('.').length - 1
  if (point_count > 1) return fail('multiple_points')
  if (trimmed.startsWith('.')) return fail('leading_decimal')
  if (trimmed.endsWith('.')) return fail('trailing_decimal')

  const [whole, fraction = ''] = trimmed.split('.')
  if (fraction.includes(',')) return fail('bad_thousands')
  if (whole.includes(',') && !grouped_integer.test(whole)) return fail('bad_thousands')
  if (whole.startsWith(',')) return fail('bad_thousands')
  if (fraction.length > rules.decimals) return fail('too_many_decimals')

  const scaled_digits = whole.replaceAll(',', '') + fraction.padEnd(rules.decimals, '0')
  const value = digits_to_int(scaled_digits, rules.max)
  if (value === undefined) return fail('too_large')
  if (value < rules.min) return fail('zero')
  return { ok: true, value }
}

/** Unit price in centavos: 0.01 to 999,999.99. */
export function parse_price(text: string): ParsedAmount {
  return parse_decimal(text, {
    decimals: price_decimals,
    min: 1,
    max: price_max_centavos,
  })
}

/** Quantity in thousandths: 0.001 to 9,999.999. */
export function parse_quantity(text: string): ParsedAmount {
  return parse_decimal(text, {
    decimals: quantity_decimals,
    min: 1,
    max: quantity_max_thousandths,
  })
}

/** Discount in centavos: blank means 0, and 0 is allowed. */
export function parse_discount(text: string): ParsedAmount {
  if (text.trim() === '') return { ok: true, value: 0 }
  return parse_decimal(text, {
    decimals: price_decimals,
    min: 0,
    max: price_max_centavos,
  })
}

/**
 * One line, in centavos: quantity x price, rounded half-up once.
 * `floor((q * p + 500) / 1000)`, all on integers. The remainder is taken with `%` so no
 * floating-point division is involved.
 */
export function line_total(quantity_thousandths: number, price_centavos: number) {
  const half = thousandths_per_unit / 2
  const raw = quantity_thousandths * price_centavos + half
  return (raw - (raw % thousandths_per_unit)) / thousandths_per_unit
}

export type Line = { quantity: number; price: number }

export type Totals =
  | { ok: true; subtotal: number; discount: number; total: number }
  | { ok: false; reason: 'discount_exceeds_subtotal'; subtotal: number }

/**
 * Sum of the already-rounded lines, minus the discount. Nothing is rounded again, so
 * the printed lines always add up to the printed subtotal. A discount above the
 * subtotal is refused; the total is never negative.
 */
export function compute_totals(lines: readonly Line[], discount: number): Totals {
  const subtotal = lines.reduce(
    (sum, line) => sum + line_total(line.quantity, line.price),
    0,
  )
  if (discount > subtotal) {
    return { ok: false, reason: 'discount_exceeds_subtotal', subtotal }
  }
  return { ok: true, subtotal, discount, total: subtotal - discount }
}
