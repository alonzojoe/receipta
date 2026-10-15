import { party_name_label } from '../model/receipt_form_values'
import { step_validators } from '../model/field_validators'
import type { ReceiptFormApi } from '../model/use_receipt_form'
import { AppInput } from '@/shared/ui/app_input'

import { FormField } from './form_field'
import { PartyTypeToggle } from './party_type_toggle'

type PartySectionProps = {
  form: ReceiptFormApi
  party: 'issuer' | 'recipient'
}

const copy = {
  issuer: { heading: 'Issuer', description: 'Who received the payment and is issuing this receipt.', type_label: 'Issuer type' },
  recipient: { heading: 'Recipient', description: 'Who paid, and who the receipt is for.', type_label: 'Recipient type' },
} as const

/**
 * One party: the Individual / Organization choice and the name. The choice changes the
 * name field's label ("Full name" or "Business name") and nothing else, so both parties
 * are the same shape and the later receipt stays simple.
 */
export function PartySection({ form, party }: PartySectionProps) {
  const { heading, description, type_label } = copy[party]
  const type_name = `${party}_type` as const
  const name_name = `${party}_name` as const

  return (
    <section aria-labelledby={`${party}-heading`} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 id={`${party}-heading`} className="text-lg font-medium tracking-tight">
          {heading}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form.Field name={type_name} validators={step_validators('parties', type_name)}>
        {(field) => <PartyTypeToggle field={field} label={type_label} />}
      </form.Field>

      <form.Subscribe selector={(state) => state.values[type_name]}>
        {(type) => (
          <form.Field name={name_name} validators={step_validators('parties', name_name)}>
            {(field) => (
              <FormField field={field} label={party_name_label(type)} requirement="required">
                {(control) => (
                  <AppInput {...control} type="text" autoComplete="off" />
                )}
              </FormField>
            )}
          </form.Field>
        )}
      </form.Subscribe>
    </section>
  )
}
