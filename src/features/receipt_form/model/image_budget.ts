import { draft_version } from './draft_schema'
import type { ReceiptFormValues } from './receipt_form_values'

/**
 * What the attach guard needs to know about the receipt as it is *without* the photo
 * being attached or replaced: how many photos it already has, and how long the serialised
 * draft already is. `check_attach` adds the new data URL to the second figure.
 *
 * Serialised exactly as the draft will be, so the guard agrees with the storage guard.
 * The step is a single digit, so its value cannot change the length.
 */
export function attach_budget(values: ReceiptFormValues, index: number) {
  const items = values.items.map((item, position) =>
    position === index ? { ...item, image: null } : item,
  )
  const draft = { version: draft_version, step: 2, values: { ...values, items } }
  return {
    image_count: items.filter((item) => item.image !== null).length,
    draft_length: JSON.stringify(draft).length,
  }
}
