import type { AnyFieldApi } from '@tanstack/react-form'

import { cn } from '@/shared/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio_group'

import { party_type_labels, party_types } from '../model/receipt_form_values'
import { FormField } from './form_field'

type PartyTypeToggleProps = {
  field: AnyFieldApi
  /** "Issuer type" or "Recipient type". */
  label: string
}

/**
 * Individual or Organization. A radio group, because it is one of two: a row of toggle
 * buttons would announce as independent buttons. The group's accessible name is
 * `aria-label`, since a `<label for>` cannot name a `div`.
 */
export function PartyTypeToggle({ field, label }: PartyTypeToggleProps) {
  return (
    <FormField field={field} label={label} requirement="required">
      {(control) => (
        <RadioGroup
          id={control.id}
          name={control.name}
          aria-label={label}
          aria-invalid={control['aria-invalid']}
          aria-describedby={control['aria-describedby']}
          value={control.value}
          onValueChange={(value) => control.onChange({ target: { value } })}
          className="grid-cols-1 gap-3 min-[22.5rem]:grid-cols-2"
        >
          {party_types.map((type) => {
            const checked = control.value === type
            return (
              <label
                key={type}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-base transition-[background-color,border-color,box-shadow] duration-150 ease-out has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                  checked
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-control-border bg-background hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50',
                )}
              >
                <RadioGroupItem value={type} />
                {party_type_labels[type]}
              </label>
            )
          })}
        </RadioGroup>
      )}
    </FormField>
  )
}
