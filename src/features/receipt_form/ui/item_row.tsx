import { LuTrash2 } from 'react-icons/lu'

import { format_centavos } from '@/shared/lib/format_currency'
import { AppInput } from '@/shared/ui/app_input'
import { Button } from '@/shared/ui/button'

import { step_validators } from '../model/field_validators'
import { item_line_total } from '../model/receipt_totals'
import type { ReceiptFormApi } from '../model/use_receipt_form'
import { FormField } from './form_field'
import { ItemImageField } from './item_image_field'

type ItemRowProps = {
  form: ReceiptFormApi
  index: number
  /** False for the last remaining item: it cannot be removed. */
  can_remove: boolean
  /** The id of the hint that says why Remove is unavailable. */
  remove_reason_id: string
  on_remove: () => void
}

/**
 * One line. Name full width, quantity and price side by side, then the line total, the
 * photo and Remove. `min-w-0` and `break-words` let a 100-character name wrap instead of
 * pushing the row wider than the screen.
 */
export function ItemRow({ form, index, can_remove, remove_reason_id, on_remove }: ItemRowProps) {
  const path = `items[${index}]` as const
  const number = index + 1

  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">Item {number}</h3>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Remove item ${number}`}
          aria-disabled={can_remove ? undefined : true}
          aria-describedby={can_remove ? undefined : remove_reason_id}
          className="-mr-3 h-auto min-h-11 gap-2 px-3 text-base text-muted-foreground aria-disabled:opacity-50"
          onClick={() => {
            if (can_remove) on_remove()
          }}
        >
          <LuTrash2 aria-hidden="true" />
          Remove
        </Button>
      </div>

      <form.Field name={`${path}.name`} validators={step_validators('items', `${path}.name`)}>
        {(field) => (
          <FormField field={field} label="Item name" requirement="required">
            {(control) => (
              <AppInput {...control} type="text" autoComplete="off" className="break-words" />
            )}
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <form.Field name={`${path}.quantity`} validators={step_validators('items', `${path}.quantity`)}>
          {(field) => (
            <FormField field={field} label="Quantity" requirement="required">
              {(control) => (
                <AppInput {...control} type="text" inputMode="decimal" autoComplete="off" />
              )}
            </FormField>
          )}
        </form.Field>
        <form.Field name={`${path}.price`} validators={step_validators('items', `${path}.price`)}>
          {(field) => (
            <FormField field={field} label="Unit price" requirement="required">
              {(control) => (
                <AppInput
                  {...control}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  adornment="₱"
                />
              )}
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => state.values.items[index]}>
        {(item) => {
          const total = item ? item_line_total(item) : undefined
          return (
            <p className="flex items-baseline justify-between gap-4 text-base">
              <span className="text-muted-foreground">Line total</span>
              <span className="tabular-nums font-medium" data-testid={`line-total-${number}`}>
                {total === undefined ? '-' : format_centavos(total)}
              </span>
            </p>
          )
        }}
      </form.Subscribe>

      <ItemImageField form={form} index={index} />
    </li>
  )
}
