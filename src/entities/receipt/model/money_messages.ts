import type { MoneyReason } from './money'

export type MoneyField = 'price' | 'quantity' | 'discount'

type FieldCopy = {
  /** Name used in sentences: "Unit price", "Quantity", "Discount". */
  label: string
  /** Largest accepted value, as the user would type it. */
  max: string
  decimals: number
}

const copy: Record<MoneyField, FieldCopy> = {
  price: { label: 'Unit price', max: '999,999.99', decimals: 2 },
  quantity: { label: 'Quantity', max: '9,999.999', decimals: 3 },
  discount: { label: 'Discount', max: '999,999.99', decimals: 2 },
}

function places(count: number) {
  return count === 1 ? '1 decimal place' : `${count} decimal places`
}

/**
 * The wording for each reason, keyed by reason and field. Kept apart from the parser so
 * a copy edit changes this file only, and tests pin the reason codes.
 */
export function money_message(field: MoneyField, reason: MoneyReason): string {
  const { label, max, decimals } = copy[field]
  const messages: Record<MoneyReason, string> = {
    empty: `Enter ${label.toLowerCase()}`,
    not_a_number: `${label} must be a number, like 150 or 1,234.50`,
    exponent: `${label} cannot use exponent notation like 1e3. Type the full number`,
    negative: `${label} cannot be negative`,
    plus_sign: `${label} cannot start with a plus sign`,
    leading_decimal: `${label} needs a digit before the point, like 0.5`,
    trailing_decimal: `${label} cannot end with a point. Remove it or add the decimals`,
    multiple_points: `${label} can have only one decimal point`,
    bad_thousands: `Commas in ${label.toLowerCase()} must group thousands, like 1,234.50`,
    currency_symbol: `Type ${label.toLowerCase()} without a currency symbol. The peso sign is already shown`,
    inner_space: `${label} cannot contain spaces`,
    non_ascii_digit: `${label} must use the digits 0 to 9`,
    too_many_decimals: `${label} can have at most ${places(decimals)}`,
    zero: `${label} must be more than 0`,
    too_large: `${label} cannot be more than ${max}`,
  }
  return messages[reason]
}
