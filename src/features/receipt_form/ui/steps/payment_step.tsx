import {
  cash_method,
  normalise_notes,
  notes_max_length,
  notes_max_lines,
  other_method,
  today_local,
} from '@/entities/receipt'
import { AppInput } from '@/shared/ui/app_input'
import { AppTextarea } from '@/shared/ui/app_textarea'

import { step_validators } from '../../model/field_validators'
import type { ReceiptFormApi } from '../../model/use_receipt_form'
import { FormField } from '../form_field'
import { PaymentMethodPicker } from '../payment_method_picker'

type PaymentStepProps = { form: ReceiptFormApi }

export function PaymentStep({ form }: PaymentStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <form.Field name="payment_method" validators={step_validators('payment', 'payment_method')}>
        {(field) => (
          <FormField field={field} label="Payment method" requirement="required">
            {(control) => (
              <PaymentMethodPicker
                control={control}
                // The search text becomes the Other value, so a failed search is not typed
                // twice - but only into an EMPTY field. Someone who typed "Remittance",
                // reopened the picker and searched again would otherwise lose it, and a
                // search is a weaker signal than a value they entered deliberately. It
                // goes in as typed: trimming and the length limit belong to
                // other_method_rule, the same as text entered by hand.
                on_other_searched={(searched) => {
                  if (form.state.values.other_method.trim() === '') {
                    form.setFieldValue('other_method', searched)
                  }
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      {/* Conditional rendering only: the typed values stay in form state, so switching
          to Cash and back loses nothing, and a hidden field never blocks Next. */}
      <form.Subscribe selector={(state) => state.values.payment_method}>
        {(method) => (
          <>
            {method === other_method && (
              <form.Field name="other_method" validators={step_validators('payment', 'other_method')}>
                {(field) => (
                  <FormField field={field} label="Other payment method" requirement="required">
                    {(control) => <AppInput {...control} type="text" autoComplete="off" />}
                  </FormField>
                )}
              </form.Field>
            )}
            {method !== cash_method && (
              <form.Field name="reference_no" validators={step_validators('payment', 'reference_no')}>
                {(field) => (
                  <FormField
                    field={field}
                    label="Payment reference no."
                    requirement="optional"
                    hint="The transaction or reference number, up to 40 characters."
                  >
                    {(control) => <AppInput {...control} type="text" autoComplete="off" />}
                  </FormField>
                )}
              </form.Field>
            )}
          </>
        )}
      </form.Subscribe>

      <form.Field name="receipt_date" validators={step_validators('payment', 'receipt_date')}>
        {(field) => (
          <FormField field={field} label="Receipt date" requirement="required">
            {(control) => <AppInput {...control} type="date" max={today_local(new Date())} />}
          </FormField>
        )}
      </form.Field>

      <form.Field name="notes" validators={step_validators('payment', 'notes')}>
        {(field) => (
          <FormField
            field={field}
            label="Notes"
            requirement="optional"
            hint={`Up to ${notes_max_length} characters and ${notes_max_lines} lines.`}
            count={{ current: Array.from(normalise_notes(field.state.value)).length, max: notes_max_length }}
          >
            {(control) => <AppTextarea {...control} rows={4} />}
          </FormField>
        )}
      </form.Field>
    </div>
  )
}
