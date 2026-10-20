/** Payment method values that are not an institution id. */
export const cash_method = 'cash'
export const other_method = 'other'

/**
 * One line of a receipt, as the document reads it. Typed text, exactly as the form holds
 * it; the pure functions in this folder turn it into centavos and thousandths.
 *
 * Structural on purpose: the form's own item type has an `id` and the document has no use
 * for one, and `entities` may not import the form. The form's values satisfy this type
 * with no conversion (`receipt_input.test.ts` pins that at compile time).
 */
export type ItemInput = {
  name: string
  quantity: string
  price: string
  /** A data URL of the shrunken JPEG, or null. */
  image: string | null
}

/** Everything the receipt document needs, and nothing the wizard needs. */
export type ReceiptInput = {
  receipt_no: string
  /** `YYYY-MM-DD`. */
  receipt_date: string
  issuer_name: string
  recipient_name: string
  items: readonly ItemInput[]
  discount: string
  /** Why the discount was given. Optional. */
  discount_description: string
  /** '' (not chosen), 'cash', 'other', or an institution id. */
  payment_method: string
  other_method: string
  reference_no: string
  notes: string
}
