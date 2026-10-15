import { format_centavos } from '@/shared/lib/format_currency'

import { payment_method_name } from './payment_method'
import type { ReceiptFormValues } from './receipt_form_values'
import { summarise_receipt } from './receipt_totals'
import type { StepName } from './step_rules'

type DetailValues = Pick<
  ReceiptFormValues,
  | 'issuer_name'
  | 'recipient_name'
  | 'items'
  | 'discount'
  | 'payment_method'
  | 'other_method'
>

/**
 * A second line for a step in the timeline, only where it says something the label does
 * not: both parties on Parties, how many on Items, the method on Payment, the total on
 * Review once it can be computed. A line that only restated the label ("Add your items"
 * under "Items") would be noise, so Review has none until there is a total. Strings, so a
 * subscription to them re-renders only when one changes.
 */
export function timeline_details(values: DetailValues): Partial<Record<StepName, string>> {
  const count = values.items.length
  const issuer = values.issuer_name.trim()
  const recipient = values.recipient_name.trim()
  const method = payment_method_name(values.payment_method, values.other_method)
  const { total } = summarise_receipt(values)
  return {
    parties:
      issuer !== '' && recipient !== ''
        ? `${issuer} → ${recipient}`
        : issuer !== ''
          ? issuer
          : recipient !== ''
            ? recipient
            : undefined,
    items: `${count} ${count === 1 ? 'item' : 'items'}`,
    payment: method === '' ? undefined : method,
    review: total !== undefined && total > 0 ? format_centavos(total) : undefined,
  }
}
