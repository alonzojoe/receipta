import {
  make_default_values,
  type ItemValues,
  type ReceiptFormValues,
} from '@/features/receipt_form/model/receipt_form_values'

/** A tiny valid JPEG data URL, enough for the shape guard. */
export const tiny_jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='

/** A fixed clock for fixtures: mid-day on 15 October 2026, local time. */
export const fixture_now = new Date(2026, 9, 15, 12, 0, 0)

export function make_item(overrides: Partial<ItemValues> = {}): ItemValues {
  return {
    id: 'item-1',
    name: 'Logo design',
    quantity: '1',
    price: '1,500.00',
    image: null,
    ...overrides,
  }
}

/** A receipt that passes every step. Tests change one thing and see what breaks. */
export function make_valid_values(overrides: Partial<ReceiptFormValues> = {}): ReceiptFormValues {
  return {
    ...make_default_values(fixture_now),
    issuer_name: 'Juan Dela Cruz',
    recipient_name: 'Acme Trading',
    recipient_type: 'organization',
    items: [make_item()],
    payment_method: 'gcash',
    reference_no: '1234567890',
    ...overrides,
  }
}
