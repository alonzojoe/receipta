import { build_receipt_view, type ItemInput, type ReceiptInput } from '@/entities/receipt'

/** A small photo as a data URL: a 1 x 1 PNG, enough for an <img> with a src. */
export const tiny_photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

export function make_item(overrides: Partial<ItemInput> = {}): ItemInput {
  return { name: 'Printing', quantity: '2', price: '150', image: null, ...overrides }
}

export function make_input(overrides: Partial<ReceiptInput> = {}): ReceiptInput {
  return {
    receipt_no: 'REF-20261016-154212',
    receipt_date: '2026-10-16',
    issuer_name: 'Mabini Print Shop',
    recipient_name: 'Juan Dela Cruz',
    items: [make_item(), make_item({ name: 'Lamination', quantity: '1.5', price: '19.99' })],
    discount: '',
    discount_description: '',
    payment_method: 'gcash',
    other_method: '',
    reference_no: '9876543210',
    notes: 'Thank you',
    ...overrides,
  }
}

export function make_view(overrides: Partial<ReceiptInput> = {}) {
  return build_receipt_view(make_input(overrides))
}
