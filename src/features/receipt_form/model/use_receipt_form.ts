import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

import { read_draft } from './draft_storage'
import { make_default_values, type ReceiptFormValues } from './receipt_form_values'
import { clamp_step, type StepNumber } from './step_rules'

export type InitialReceipt = {
  values: ReceiptFormValues
  step: StepNumber
  /** A draft was stored but could not be read, so a fresh one was started. */
  unreadable: boolean
}

/**
 * Where the form starts: the saved draft with its step clamped back to the first step
 * whose predecessors do not all validate, or a fresh receipt. Read once, as the form's
 * initial values, so there is no frame of defaults and no spurious change event.
 */
export function load_initial_receipt(now: Date): InitialReceipt {
  const saved = read_draft()
  if (saved.status === 'ok') {
    const { values, step } = saved.draft
    return { values, step: clamp_step(step, values, now), unreadable: false }
  }
  return {
    values: make_default_values(now),
    step: 1,
    unreadable: saved.status === 'unreadable',
  }
}

function useReceiptFormInstance(values: ReceiptFormValues) {
  return useForm({ defaultValues: values })
}

/** The one form instance for the whole receipt. Steps receive it; none owns state. */
export type ReceiptFormApi = ReturnType<typeof useReceiptFormInstance>

/** One TanStack Form for the whole receipt, seeded from the saved draft if there is one. */
export function useReceiptForm() {
  const [initial] = useState(() => load_initial_receipt(new Date()))
  const form = useReceiptFormInstance(initial.values)
  return { form, initial }
}
