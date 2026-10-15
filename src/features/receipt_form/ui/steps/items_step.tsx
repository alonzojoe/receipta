import { useEffect, useId, useRef, useState } from 'react'
import { LuPlus } from 'react-icons/lu'

import { items_max } from '@/entities/receipt'
import { AppInput } from '@/shared/ui/app_input'
import { Button } from '@/shared/ui/button'

import { items_count_rule } from '../../model/field_rules'
import { step_validators } from '../../model/field_validators'
import { make_empty_item } from '../../model/receipt_form_values'
import { summarise_receipt } from '../../model/receipt_totals'
import type { ReceiptFormApi } from '../../model/use_receipt_form'
import { FormField } from '../form_field'
import { ItemRow } from '../item_row'
import { TotalsSummary } from '../totals_summary'

type ItemsStepProps = { form: ReceiptFormApi }

export function ItemsStep({ form }: ItemsStepProps) {
  const id = useId()
  const max_message_id = `${id}-max`
  const remove_reason_id = `${id}-remove-reason`
  const root_ref = useRef<HTMLDivElement>(null)
  // The row to focus after an add or a remove, once it is in the DOM.
  const [focus_request, set_focus_request] = useState<{ index: number; count: number } | null>(null)

  useEffect(() => {
    if (!focus_request) return
    root_ref.current
      ?.querySelector<HTMLElement>(`[name="items[${focus_request.index}].name"]`)
      ?.focus()
  }, [focus_request])

  return (
    <div ref={root_ref} className="flex flex-col gap-8">
      <form.Field name="items" mode="array" validators={step_validators('items', 'items')}>
        {(items) => {
          const count = items.state.value.length
          const at_max = count >= items_max
          const only_one = count <= 1
          return (
            <div className="flex flex-col gap-4">
              <ol className="flex flex-col gap-4">
                {items.state.value.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    form={form}
                    index={index}
                    item_id={item.id}
                    can_remove={!only_one}
                    remove_reason_id={remove_reason_id}
                    on_remove={() => {
                      items.removeValue(index)
                      set_focus_request({ index: Math.max(0, index - 1), count: count - 1 })
                    }}
                  />
                ))}
              </ol>

              {only_one && (
                <p id={remove_reason_id} className="sr-only">
                  A receipt needs at least one item, so the last one cannot be removed.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                aria-disabled={at_max ? true : undefined}
                aria-describedby={at_max ? max_message_id : undefined}
                className="h-auto min-h-11 w-full gap-2 border-dashed px-4 text-base sm:w-auto sm:self-start"
                onClick={() => {
                  if (at_max) return
                  items.pushValue(make_empty_item())
                  set_focus_request({ index: count, count: count + 1 })
                }}
              >
                <LuPlus aria-hidden="true" />
                Add item
              </Button>
              {at_max && (
                <p id={max_message_id} className="text-sm text-muted-foreground">
                  {items_count_rule(items_max + 1)}.
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <form.Field
          name="discount"
          validators={{ ...step_validators('items', 'discount'), onChangeListenTo: ['items'] }}
        >
          {(field) => (
            <FormField
              field={field}
              label="Discount"
              requirement="optional"
              hint="A peso amount taken off the subtotal. Leave blank for none."
            >
              {(control) => (
                <AppInput {...control} type="text" inputMode="decimal" autoComplete="off" adornment="₱" />
              )}
            </FormField>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => summarise_receipt(state.values)}>
          {(summary) => <TotalsSummary summary={summary} />}
        </form.Subscribe>
      </div>
    </div>
  )
}
