import {
  compute_totals,
  line_total,
  parse_discount,
  parse_price,
  parse_quantity,
} from '@/entities/receipt'

import type { ItemValues, ReceiptFormValues } from './receipt_form_values'

/** One line in centavos, or undefined while its quantity or price is not a valid number. */
export function item_line_total(item: Pick<ItemValues, 'quantity' | 'price'>) {
  const quantity = parse_quantity(item.quantity)
  const price = parse_price(item.price)
  if (!quantity.ok || !price.ok) return undefined
  return line_total(quantity.value, price.value)
}

export type ReceiptSummary = {
  /** Sum of the valid lines, in centavos. */
  subtotal: number
  /** The discount in centavos, or undefined while it is not a valid amount. */
  discount: number | undefined
  /** Subtotal minus discount. Undefined while the discount is invalid or too large. */
  total: number | undefined
}

/**
 * The live figures under the items. Uses only the lines that are valid so far, so the
 * subtotal grows as the user completes rows. All integer arithmetic, in `entities`.
 */
export function summarise_receipt(values: Pick<ReceiptFormValues, 'items' | 'discount'>): ReceiptSummary {
  const lines = values.items.flatMap((item) => {
    const quantity = parse_quantity(item.quantity)
    const price = parse_price(item.price)
    return quantity.ok && price.ok ? [{ quantity: quantity.value, price: price.value }] : []
  })
  const discount = parse_discount(values.discount)
  const subtotal = compute_totals(lines, 0)
  const base = subtotal.ok ? subtotal.subtotal : 0
  if (!discount.ok) return { subtotal: base, discount: undefined, total: undefined }
  const totals = compute_totals(lines, discount.value)
  return {
    subtotal: base,
    discount: discount.value,
    total: totals.ok ? totals.total : undefined,
  }
}

/** 1500 thousandths -> "1.5", 2000 -> "2", 1 -> "0.001". Integer arithmetic on the digits. */
export function format_thousandths(thousandths: number) {
  const whole = (thousandths - (thousandths % 1000)) / 1000
  const fraction = String(thousandths % 1000)
    .padStart(3, '0')
    .replace(/0+$/, '')
  return fraction === '' ? String(whole) : `${whole}.${fraction}`
}

export type ItemFigures = {
  /** Quantity as it will read on the receipt: "1.5", never "1.500" or "007". */
  quantity: string
  /** Centavos. */
  unit_price: number
  /** Centavos, rounded once. */
  line_total: number
}

/** The numbers of one valid line, ready to format. Undefined while the line is invalid. */
export function item_figures(item: Pick<ItemValues, 'quantity' | 'price'>): ItemFigures | undefined {
  const quantity = parse_quantity(item.quantity)
  const price = parse_price(item.price)
  if (!quantity.ok || !price.ok) return undefined
  return {
    quantity: format_thousandths(quantity.value),
    unit_price: price.value,
    line_total: line_total(quantity.value, price.value),
  }
}
