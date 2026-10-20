import { cash_method, compute_totals, other_method, parse_discount, parse_price, parse_quantity } from '@/entities/receipt'

import {
  discount_cap_rule,
  discount_description_rule,
  discount_rule,
  item_name_rule,
  items_count_rule,
  notes_rule,
  other_method_rule,
  party_name_rule,
  party_type_rule,
  payment_method_rule,
  price_rule,
  quantity_rule,
  receipt_date_rule,
  reference_rule,
} from './field_rules'
import {
  party_name_label,
  type ReceiptFormValues,
} from './receipt_form_values'

export type StepName = 'parties' | 'items' | 'payment' | 'review'

export const steps: readonly StepName[] = ['parties', 'items', 'payment', 'review']

export const step_labels: Record<StepName, string> = {
  parties: 'Parties',
  items: 'Items',
  payment: 'Payment',
  review: 'Review',
}

/** The step number, 1 to 4, as stored in a draft and shown as "Step N of 4". */
export type StepNumber = 1 | 2 | 3 | 4

/** Every top-level value except the Receipt No., which nobody types. */
export type StepFieldName = Exclude<keyof ReceiptFormValues, 'receipt_no'>

/**
 * Which step owns which field. A field missing here would be silently ungated, so
 * `step_rules.test.ts` checks that every key of the form values appears exactly once.
 * `items` covers every `items[i].*` path as well.
 */
export const step_fields: Record<StepName, readonly StepFieldName[]> = {
  parties: ['issuer_type', 'issuer_name', 'recipient_type', 'recipient_name'],
  items: ['items', 'discount', 'discount_description'],
  payment: ['payment_method', 'other_method', 'reference_no', 'receipt_date', 'notes'],
  review: [],
}

/** Field path to message. Empty means the step may advance. */
export type StepErrors = Record<string, string>

function add(errors: StepErrors, path: string, message: string | undefined) {
  if (message !== undefined) errors[path] = message
}

function validate_parties(values: ReceiptFormValues): StepErrors {
  const errors: StepErrors = {}
  add(errors, 'issuer_type', party_type_rule(values.issuer_type))
  add(
    errors,
    'issuer_name',
    party_name_rule(values.issuer_name, party_name_label(values.issuer_type)),
  )
  add(errors, 'recipient_type', party_type_rule(values.recipient_type))
  add(
    errors,
    'recipient_name',
    party_name_rule(values.recipient_name, party_name_label(values.recipient_type)),
  )
  return errors
}

function validate_items(values: ReceiptFormValues): StepErrors {
  const errors: StepErrors = {}
  add(errors, 'items', items_count_rule(values.items.length))

  const valid_lines: { quantity: number; price: number }[] = []
  values.items.forEach((item, index) => {
    const path = `items[${index}]`
    add(errors, `${path}.name`, item_name_rule(item.name))
    add(errors, `${path}.quantity`, quantity_rule(item.quantity))
    add(errors, `${path}.price`, price_rule(item.price))
    const quantity = parse_quantity(item.quantity)
    const price = parse_price(item.price)
    if (quantity.ok && price.ok) {
      valid_lines.push({ quantity: quantity.value, price: price.value })
    }
  })

  const discount_message = discount_rule(values.discount)
  add(errors, 'discount', discount_message)

  // The cap needs a complete subtotal. With any line invalid the subtotal is a partial
  // figure and a message quoting it would be wrong; the line errors block the step anyway.
  const every_line_valid = values.items.length > 0 && valid_lines.length === values.items.length
  add(errors, 'discount_description', discount_description_rule(values.discount_description))
  // A reason with no amount would be silently dropped: the row only renders with a discount
  // above 0. Say so rather than discarding what someone typed.
  if (values.discount_description.trim() !== '' && values.discount.trim() === '') {
    add(errors, 'discount', 'Add the discount amount, or clear the description')
  }

  const discount = parse_discount(values.discount)
  if (every_line_valid && discount.ok) {
    const totals = compute_totals(valid_lines, discount.value)
    if (!totals.ok) add(errors, 'discount', discount_cap_rule(discount.value, totals.subtotal))
  }
  return errors
}

function validate_payment(values: ReceiptFormValues, now: Date): StepErrors {
  const errors: StepErrors = {}
  add(errors, 'payment_method', payment_method_rule(values.payment_method))
  // Hidden fields never block: Other text only exists for Other, and Reference No. is
  // not shown for Cash. Their values stay in form state either way.
  if (values.payment_method === other_method) {
    add(errors, 'other_method', other_method_rule(values.other_method))
  }
  if (values.payment_method !== cash_method) {
    add(errors, 'reference_no', reference_rule(values.reference_no))
  }
  add(errors, 'receipt_date', receipt_date_rule(values.receipt_date, now))
  add(errors, 'notes', notes_rule(values.notes))
  return errors
}

/**
 * The gate. A pure function over the form values, so it neither asks the form library
 * (whose `validateField` answers "valid" for an unmounted field) nor depends on what is
 * mounted. The mounted fields display its answer; they are not its source.
 */
export function validate_step(step: StepName, values: ReceiptFormValues, now: Date): StepErrors {
  switch (step) {
    case 'parties':
      return validate_parties(values)
    case 'items':
      return validate_items(values)
    case 'payment':
      return validate_payment(values, now)
    case 'review':
      return {}
  }
}

/**
 * Where a restored draft may land: the saved step, pulled back to the first step whose
 * predecessors do not all validate. Anything that is not a step number becomes step 1.
 */
export function clamp_step(saved_step: number, values: ReceiptFormValues, now: Date): StepNumber {
  const saved = Number.isInteger(saved_step) ? Math.min(Math.max(saved_step, 1), 4) : 1
  for (let number = 1; number < saved; number += 1) {
    const step = steps[number - 1]
    if (Object.keys(validate_step(step, values, now)).length > 0) return number as StepNumber
  }
  return saved as StepNumber
}
