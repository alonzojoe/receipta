import {
  draft_max_chars,
  draft_text_max_chars,
  image_data_url_max_chars,
  images_max,
  items_max,
  items_min,
  receipt_number_pattern,
} from '@/entities/receipt'

import {
  party_types,
  type ItemValues,
  type PartyType,
  type ReceiptFormValues,
} from './receipt_form_values'

/** Bump when the stored shape changes. A different number is `wrong_version`. */
export const draft_version = 1

export type Draft = {
  version: typeof draft_version
  /** The step the user was on, 1 to 4. */
  step: number
  values: ReceiptFormValues
}

export type DraftError = 'corrupt' | 'wrong_version' | 'invalid_shape'

export type ParsedDraft = { ok: true; draft: Draft } | { ok: false; reason: DraftError }

type Unknown = Record<string, unknown>

const jpeg_data_url = /^data:image\/jpeg;base64,[A-Za-z0-9+/]*={0,2}$/

function is_record(value: unknown): value is Unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function is_text(value: unknown): value is string {
  return typeof value === 'string' && value.length <= draft_text_max_chars
}

function is_party_type(value: unknown): value is PartyType {
  return typeof value === 'string' && (party_types as readonly string[]).includes(value)
}

function read_item(value: unknown): ItemValues | undefined {
  if (!is_record(value)) return undefined
  const { id, name, quantity, price, image } = value
  if (!is_text(id) || id === '' || id.length > 100) return undefined
  if (!is_text(name) || !is_text(quantity) || !is_text(price)) return undefined
  if (image !== null) {
    if (typeof image !== 'string') return undefined
    if (image.length > image_data_url_max_chars || !jpeg_data_url.test(image)) {
      return undefined
    }
  }
  return { id, name, quantity, price, image }
}

function read_values(value: unknown): ReceiptFormValues | undefined {
  if (!is_record(value)) return undefined
  const {
    receipt_no,
    receipt_date,
    issuer_type,
    issuer_name,
    recipient_type,
    recipient_name,
    items,
    discount,
    discount_description,
    payment_method,
    other_method,
    reference_no,
    notes,
  } = value

  if (typeof receipt_no !== 'string' || !receipt_number_pattern.test(receipt_no)) {
    return undefined
  }
  if (!is_party_type(issuer_type) || !is_party_type(recipient_type)) return undefined
  const texts = [
    receipt_date,
    issuer_name,
    recipient_name,
    discount,
    payment_method,
    other_method,
    reference_no,
    notes,
  ]
  if (!texts.every(is_text)) return undefined
  // Deliberately NOT in `texts`: a draft stored before this field existed has no such key,
  // and requiring a string here would reject the whole draft and lose the user's work.
  if (discount_description !== undefined && !is_text(discount_description)) return undefined

  if (!Array.isArray(items) || items.length < items_min || items.length > items_max) {
    return undefined
  }
  const read_items = items.map(read_item)
  if (read_items.some((item) => item === undefined)) return undefined
  const checked = read_items as ItemValues[]
  if (new Set(checked.map((item) => item.id)).size !== checked.length) return undefined
  if (checked.filter((item) => item.image !== null).length > images_max) return undefined

  return {
    receipt_no,
    receipt_date: receipt_date as string,
    issuer_type,
    issuer_name: issuer_name as string,
    recipient_type,
    recipient_name: recipient_name as string,
    items: checked,
    // Added after version 1 shipped. A draft already in someone's browser has no such
    // field, and bumping the version would reject it as wrong_version and lose their work
    // over a field they never filled. Missing reads as empty.
    discount_description: typeof discount_description === 'string' ? discount_description : '',
    discount: discount as string,
    payment_method: payment_method as string,
    other_method: other_method as string,
    reference_no: reference_no as string,
    notes: notes as string,
  }
}

/**
 * Turns the stored text into a draft, or says why it cannot. A shape guard: it checks
 * types and bounded sizes, not business rules, so a half-typed `"12.345"` price or an
 * empty name is a valid draft. Applying the business rules here would make the first
 * typo "invalidate" the draft and discard the user's work. Unknown keys are dropped.
 */
export function parse_draft(text: string): ParsedDraft {
  if (text.length > draft_max_chars) return { ok: false, reason: 'invalid_shape' }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
  if (!is_record(parsed)) return { ok: false, reason: 'invalid_shape' }

  if (typeof parsed.version !== 'number') return { ok: false, reason: 'invalid_shape' }
  if (parsed.version !== draft_version) return { ok: false, reason: 'wrong_version' }

  const { step } = parsed
  if (typeof step !== 'number' || !Number.isInteger(step) || step < 1 || step > 4) {
    return { ok: false, reason: 'invalid_shape' }
  }
  const values = read_values(parsed.values)
  if (!values) return { ok: false, reason: 'invalid_shape' }

  return { ok: true, draft: { version: draft_version, step, values } }
}

/** The same draft with every photo removed. Everything else is untouched. */
export function strip_images(draft: Draft): Draft {
  return {
    ...draft,
    values: {
      ...draft.values,
      items: draft.values.items.map((item) => ({ ...item, image: null })),
    },
  }
}

export function has_images(draft: Draft) {
  return draft.values.items.some((item) => item.image !== null)
}
