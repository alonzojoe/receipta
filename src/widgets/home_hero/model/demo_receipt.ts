import { build_receipt_view, type ReceiptInput } from '@/entities/receipt'

/**
 * The receipt the hero shows. It is a real `ReceiptInput` put through the real
 * `build_receipt_view`, not a hand-written view: a hand-written one could describe a
 * receipt the product cannot actually produce, which is exactly how the mock it replaces
 * drifted - it showed a `PAID` chip that does not exist, and no receipt number, payment
 * method or statement.
 *
 * No item photos. They are stored as data URLs, so one here would put a base64 image in the
 * landing page's bundle purely for decoration.
 *
 * The date is fixed rather than `new Date()`, so the hero renders the same thing on every
 * visit and in every test run. A landing page has no reason to change by the hour.
 */
const demo_input: ReceiptInput = {
  receipt_no: 'REF-20261027-104530',
  receipt_date: '2026-10-27',
  issuer_name: 'Mabini Print Shop',
  recipient_name: 'Maria Santos',
  items: [
    { name: 'Tarpaulin, 3x5 ft', quantity: '2', price: '450.00', image: null },
    { name: 'Business cards, 100 pcs', quantity: '1', price: '650.00', image: null },
  ],
  discount: '100.00',
  discount_description: 'regular client',
  payment_method: 'gcash',
  other_method: '',
  reference_no: '0917 555 0134',
  notes: '',
}

export const demo_receipt = build_receipt_view(demo_input)
