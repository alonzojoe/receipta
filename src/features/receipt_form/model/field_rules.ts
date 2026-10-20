import {
  cash_method,
  is_future,
  is_real_date,
  items_max,
  items_min,
  money_message,
  discount_description_max_length,
  name_max_length,
  normalise_notes,
  notes_max_length,
  notes_max_lines,
  other_method,
  other_method_max_length,
  parse_discount,
  parse_price,
  parse_quantity,
  reference_max_length,
} from '@/entities/receipt'
import { find_institution } from '@/shared/config/institutions'
import { format_centavos } from '@/shared/lib/format_currency'

import { party_types } from './receipt_form_values'

/** A rule answers with the message to show, or nothing when the value is fine. */
export type RuleResult = string | undefined

/** Any control character, including newline and tab, plus the Unicode line separators. */
const control_characters = /[\p{Cc}\u2028\u2029]/u

function count_characters(text: string) {
  return Array.from(text).length
}

function text_rule(
  value: string,
  label: string,
  { min, max }: { min: number; max: number },
): RuleResult {
  const text = value.trim()
  const length = count_characters(text)
  if (length < min) return `${label} is required`
  if (control_characters.test(text)) return `${label} must be a single line of text`
  if (length > max) return `${label} must be ${max} characters or fewer`
  return undefined
}

/** A party's name: 1 to 100 characters. `label` is "Full name" or "Business name". */
export function party_name_rule(value: string, label: string): RuleResult {
  return text_rule(value, label, { min: 1, max: name_max_length })
}

export function item_name_rule(value: string): RuleResult {
  return text_rule(value, 'Item name', { min: 1, max: name_max_length })
}

/**
 * Why the discount was given. Optional, at most 40 characters, one line. Empty passes:
 * a discount with no reason is the common case and always has been.
 */
export function discount_description_rule(value: string): RuleResult {
  if (value.trim() === '') return undefined
  return text_rule(value, 'Discount description', { min: 1, max: discount_description_max_length })
}

/** The free-text method, only when the method is Other. 1 to 50 characters. */
export function other_method_rule(value: string): RuleResult {
  return text_rule(value, 'Payment method', { min: 1, max: other_method_max_length })
}

/** Optional, up to 40 characters. Empty passes. */
export function reference_rule(value: string): RuleResult {
  if (value.trim() === '') return undefined
  return text_rule(value, 'Reference No.', { min: 0, max: reference_max_length })
}

export function party_type_rule(value: string): RuleResult {
  return (party_types as readonly string[]).includes(value)
    ? undefined
    : 'Choose Individual or Organization'
}

export function quantity_rule(text: string): RuleResult {
  const result = parse_quantity(text)
  return result.ok ? undefined : money_message('quantity', result.reason)
}

export function price_rule(text: string): RuleResult {
  const result = parse_price(text)
  return result.ok ? undefined : money_message('price', result.reason)
}

/**
 * Shape and size of the discount only. Whether it exceeds the subtotal needs the other
 * lines, so that is `discount_cap_rule`.
 */
export function discount_rule(text: string): RuleResult {
  const result = parse_discount(text)
  return result.ok ? undefined : money_message('discount', result.reason)
}

/** The discount may not exceed the subtotal. `discount` is already a valid amount. */
export function discount_cap_rule(discount: number, subtotal: number): RuleResult {
  if (discount <= subtotal) return undefined
  return `Discount cannot be more than the subtotal, ${format_centavos(subtotal)}`
}

export function items_count_rule(count: number): RuleResult {
  if (count < items_min) return 'Add at least one item'
  if (count > items_max) return `A receipt can have at most ${items_max} items`
  return undefined
}

export function payment_method_rule(value: string): RuleResult {
  if (value === '') return 'Choose a payment method'
  if (value === cash_method || value === other_method) return undefined
  return find_institution(value) ? undefined : 'Choose a payment method from the list'
}

/** The date input yields `YYYY-MM-DD` or ''. `max` on it is advisory; this is the rule. */
export function receipt_date_rule(value: string, now: Date): RuleResult {
  if (value.trim() === '') return 'Enter the receipt date'
  if (!is_real_date(value)) return 'Enter a real date'
  if (is_future(value, now)) return 'The receipt date cannot be in the future'
  return undefined
}

/**
 * Optional. At most 300 characters (counted by code point, so it agrees with the visible
 * "n / 300") and at most 5 lines. The newline is allowed; any other control character is
 * not. Whitespace-only normalises to empty and passes.
 */
export function notes_rule(value: string): RuleResult {
  const text = normalise_notes(value)
  if (text === '') return undefined
  if (control_characters.test(text.replaceAll('\n', ''))) {
    return 'Notes can only contain text and line breaks'
  }
  if (count_characters(text) > notes_max_length) {
    return `Notes must be ${notes_max_length} characters or fewer`
  }
  if (text.split('\n').length > notes_max_lines) {
    return `Notes can have at most ${notes_max_lines} lines`
  }
  return undefined
}
