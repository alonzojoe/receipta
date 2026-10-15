import type { AnyFieldApi } from '@tanstack/react-form'
import { useRef, useState } from 'react'
import { LuImagePlus, LuLoaderCircle, LuTrash2 } from 'react-icons/lu'

import { AppInput } from '@/shared/ui/app_input'
import { Button } from '@/shared/ui/button'

import { canvas_codec } from '../lib/canvas_image'
import { process_image } from '../lib/image_pipeline'
import { check_attach, image_refusal_messages } from '../lib/image_policy'
import { attach_budget } from '../model/image_budget'
import type { ReceiptFormApi } from '../model/use_receipt_form'
import { FormField } from './form_field'

type ItemImageFieldProps = {
  form: ReceiptFormApi
  index: number
  /** The item's id. A photo is written by id, because its row can move or go while it processes. */
  item_id: string
}

const accepted_types = 'image/jpeg,image/png,image/webp'

/**
 * The optional photo on one item. A visible, labelled button opens a hidden file input;
 * `accept` is only a hint, because the pipeline decides by the file's bytes. A refusal
 * (type, size, count, budget) is an inline field error that names the reason, not a toast
 * alone. Attaching checks the draft as it would be with the new photo, so the user hears
 * "no" while looking at the thing they are attaching.
 */
export function ItemImageField({ form, index, item_id }: ItemImageFieldProps) {
  const number = index + 1
  const trigger_ref = useRef<HTMLButtonElement>(null)
  const file_ref = useRef<HTMLInputElement>(null)
  const [processing, set_processing] = useState(false)

  return (
    <form.Field name={`items[${index}].image`}>
      {(field) => {
        const image = field.state.value

        function refuse(message: string | undefined) {
          // This field has no validators of its own; a refusal is set as its error.
          const api: AnyFieldApi = field
          api.setErrorMap({ onChange: message })
        }

        /** Where this item is now, or -1 if its row was removed. Read at write time, never captured. */
        const current_index = () => form.state.values.items.findIndex((item) => item.id === item_id)

        async function attach(file: File) {
          refuse(undefined)
          const budget = attach_budget(form.state.values, index)
          const count = check_attach(budget.image_count, budget.draft_length, 0)
          if (!count.ok) return refuse(image_refusal_messages[count.reason])

          set_processing(true)
          try {
            const result = await process_image(file, canvas_codec)
            // The row may have been removed or moved while this ran. Resolve it by id now;
            // if it is gone the result is dropped, not written to whatever took its place.
            const at = current_index()
            if (at === -1) return
            if (!result.ok) return refuse(image_refusal_messages[result.reason])
            // Measured again after processing: the form may have changed while it ran.
            const fresh = attach_budget(form.state.values, at)
            const room = check_attach(fresh.image_count, fresh.draft_length, result.data_url.length)
            if (!room.ok) return refuse(image_refusal_messages[room.reason])
            form.setFieldValue(`items[${at}].image`, result.data_url)
          } finally {
            set_processing(false)
          }
        }

        return (
          <FormField
            field={field}
            label="Photo"
            requirement="optional"
            hint="JPEG, PNG or WebP. It is shrunk to fit on this device."
          >
            {(control) => (
              <div className="flex flex-wrap items-center gap-3">
                {typeof image === 'string' && (
                  <img
                    src={image}
                    alt=""
                    className="aspect-square w-1/4 max-w-16 rounded-md border border-border object-cover"
                  />
                )}

                <Button
                  ref={trigger_ref}
                  type="button"
                  variant="outline"
                  aria-label={`${typeof image === 'string' ? 'Replace photo' : 'Add photo'} for item ${number}`}
                  aria-disabled={processing ? true : undefined}
                  aria-invalid={control['aria-invalid']}
                  aria-describedby={control['aria-describedby']}
                  className="h-auto min-h-11 gap-2 px-4 text-base"
                  onClick={() => {
                    if (!processing) file_ref.current?.click()
                  }}
                >
                  {processing ? (
                    <LuLoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                  ) : (
                    <LuImagePlus aria-hidden="true" />
                  )}
                  {processing ? 'Processing...' : typeof image === 'string' ? 'Replace photo' : 'Add photo'}
                </Button>

                {typeof image === 'string' && (
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Remove photo from item ${number}`}
                    className="h-auto min-h-11 gap-2 px-3 text-base text-muted-foreground"
                    onClick={() => {
                      field.handleChange(null)
                      refuse(undefined)
                      // The remove button is about to unmount: put focus somewhere real.
                      trigger_ref.current?.focus()
                    }}
                  >
                    <LuTrash2 aria-hidden="true" />
                    Remove photo
                  </Button>
                )}

                {/* Not part of the tab order or the accessibility tree: the buttons above
                    are the control. Routed through AppInput so no raw <input> exists. */}
                <AppInput
                  ref={file_ref}
                  id={control.id}
                  type="file"
                  accept={accepted_types}
                  tabIndex={-1}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    // Cleared so choosing the same file again fires a change.
                    event.target.value = ''
                    if (file) void attach(file)
                  }}
                />
              </div>
            )}
          </FormField>
        )
      }}
    </form.Field>
  )
}
