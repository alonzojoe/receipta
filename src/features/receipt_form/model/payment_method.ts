import { find_institution } from '@/shared/config/institutions'

import { cash_method, other_method } from './receipt_form_values'

/** The name to show for a stored method: the institution, "Cash", or the Other text. */
export function payment_method_name(method: string, other_text: string) {
  if (method === cash_method) return 'Cash'
  if (method === other_method) return other_text.trim() || 'Other'
  return find_institution(method)?.name ?? ''
}

/** A local logo path for an institution, or undefined (Cash, Other, nothing chosen). */
export function payment_method_icon(method: string) {
  return find_institution(method)?.icon
}
