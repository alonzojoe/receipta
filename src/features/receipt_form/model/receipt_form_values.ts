import { make_receipt_number, today_local } from '@/entities/receipt'

export type PartyType = 'individual' | 'organization'

export const party_types: readonly PartyType[] = ['individual', 'organization']

export const party_type_labels: Record<PartyType, string> = {
  individual: 'Individual',
  organization: 'Organization',
}

/**
 * One line of the receipt. Every field the user types holds the text as typed
 * (`"19.99"`, `"1.5"`), so the input never rewrites itself under the cursor. Pure
 * functions turn the text into integer centavos and thousandths when it is checked.
 */
export type ItemValues = {
  /** Stable React key and focus anchor. Not shown. */
  id: string
  name: string
  quantity: string
  price: string
  /** A data URL of the shrunken JPEG, or null. */
  image: string | null
}

export type ReceiptFormValues = {
  receipt_no: string
  receipt_date: string
  issuer_type: PartyType
  issuer_name: string
  recipient_type: PartyType
  recipient_name: string
  items: ItemValues[]
  discount: string
  /** '' (not chosen), 'cash', 'other', or an institution id. */
  payment_method: string
  other_method: string
  reference_no: string
  notes: string
}

let item_counter = 0

/**
 * A unique id for an item. `crypto.randomUUID` is skipped on purpose: it only exists in a
 * secure context, and the form is tested from a phone over a plain-http LAN address.
 */
export function make_item_id() {
  item_counter += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `item-${Date.now().toString(36)}-${item_counter}-${random}`
}

/**
 * Quantity starts at '1' rather than blank: one of a thing is the common case, so the
 * field is usually already right. Name and price stay empty, so a half-filled row is
 * still obviously unfinished.
 */
export function make_empty_item(): ItemValues {
  return { id: make_item_id(), name: '', quantity: '1', price: '', image: null }
}

/** Both parties Individual, one empty item, today's date and a fresh Receipt No. */
export function make_default_values(now: Date): ReceiptFormValues {
  return {
    receipt_no: make_receipt_number(now),
    receipt_date: today_local(now),
    issuer_type: 'individual',
    issuer_name: '',
    recipient_type: 'individual',
    recipient_name: '',
    items: [make_empty_item()],
    discount: '',
    payment_method: '',
    other_method: '',
    reference_no: '',
    notes: '',
  }
}

/** The label of a party's name field: the toggle changes this and nothing else. */
export function party_name_label(type: PartyType) {
  return type === 'organization' ? 'Business name' : 'Full name'
}
