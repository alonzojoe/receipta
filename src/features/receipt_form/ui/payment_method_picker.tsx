import { useState } from 'react'
import { LuBanknote, LuChevronsUpDown, LuEllipsis } from 'react-icons/lu'

import { cash_method, other_method, payment_method_icon, payment_method_name } from '@/entities/receipt'
import { institutions_by_category } from '@/shared/config/institutions'
import { cn } from '@/shared/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command'
import { control_classes } from '@/shared/ui/control_style'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

import type { FieldControl } from './form_field'

type PaymentMethodPickerProps = { control: FieldControl }

/**
 * Logos are fixed-size icons and are served from this app. If one fails to load it is
 * hidden and the name beside it still reads, so the picker never shows a broken image.
 */
function MethodIcon({ method }: { method: string }) {
  const src = payment_method_icon(method)
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className="size-6 shrink-0 rounded-sm object-contain"
        onError={(event) => {
          event.currentTarget.hidden = true
        }}
      />
    )
  }
  const Icon = method === cash_method ? LuBanknote : LuEllipsis
  return <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
}

/**
 * Search, arrow keys, type-to-filter, Enter to choose, Escape to close: the cmdk command
 * list owns all of that and the combobox / listbox semantics. The trigger always shows
 * the chosen name as text and carries the field's control props, so `aria-invalid` and the
 * failed-Next focus land on a real focusable element.
 */
export function PaymentMethodPicker({ control }: PaymentMethodPickerProps) {
  const [open, set_open] = useState(false)
  const chosen = control.value
  const name = chosen === other_method ? 'Other' : payment_method_name(chosen, '')

  function choose(method: string) {
    control.onChange({ target: { value: method } })
    set_open(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={set_open}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={control.id}
          name={control.name}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={control['aria-invalid']}
          aria-describedby={control['aria-describedby']}
          aria-required={control['aria-required']}
          className={cn(control_classes, 'flex cursor-pointer items-center justify-between gap-3 text-left')}
        >
          <span className="flex min-w-0 items-center gap-3">
            {chosen !== '' && <MethodIcon method={chosen} />}
            <span className={cn('min-w-0 truncate', chosen === '' && 'text-muted-foreground')}>
              {chosen === '' ? 'Choose a payment method' : name}
            </span>
          </span>
          <LuChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" aria-label="Payment method options" className="overflow-hidden">
        <Command label="Payment method" defaultValue={name || undefined}>
          <CommandInput placeholder="Search banks and wallets" />
          <CommandList>
            <CommandEmpty>No match. Choose Other to type your own.</CommandEmpty>
            {institutions_by_category().map((group) => (
              <CommandGroup key={group.value} heading={group.label}>
                {group.items.map((institution) => (
                  <CommandItem
                    key={institution.id}
                    value={institution.name}
                    data-checked={chosen === institution.id}
                    onSelect={() => choose(institution.id)}
                  >
                    <MethodIcon method={institution.id} />
                    <span className="min-w-0 truncate">{institution.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandGroup heading="Something else">
              <CommandItem value="Cash" data-checked={chosen === cash_method} onSelect={() => choose(cash_method)}>
                <MethodIcon method={cash_method} />
                Cash
              </CommandItem>
              <CommandItem
                value="Other (specify)"
                data-checked={chosen === other_method}
                onSelect={() => choose(other_method)}
              >
                <MethodIcon method={other_method} />
                Other (specify)
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
