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

type PaymentMethodPickerProps = {
  control: FieldControl
  /**
   * Called with the search text when Other is chosen while a query is typed. Someone who
   * searched `paypal`, found nothing and reached for Other should not have to type
   * `paypal` again - that is the whole reason they are at the fallback.
   */
  on_other_searched?: (query: string) => void
}

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
export function PaymentMethodPicker({ control, on_other_searched }: PaymentMethodPickerProps) {
  const [open, set_open] = useState(false)
  const [query, set_query] = useState('')
  const chosen = control.value
  const name = chosen === other_method ? 'Other' : payment_method_name(chosen, '')

  function choose(method: string) {
    control.onChange({ target: { value: method } })
    // Only Other, and only when something was typed: choosing Other with an empty search
    // must not wipe a value already in that field.
    if (method === other_method && query.trim() !== '') on_other_searched?.(query)
    set_query('')
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
          <CommandInput placeholder="Search banks and wallets" value={query} onValueChange={set_query} />
          <CommandList>
            {/* Names what was searched and stops there. It used to say "Choose Other to
                type your own" while cmdk had filtered Other off the screen - advice the
                reader could not act on without first clearing what they typed. Other is
                now always rendered below, so the message does not need to describe it. */}
            <CommandEmpty>No bank or wallet matches “{query.trim()}”.</CommandEmpty>
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
            {/* forceMount: cmdk filters against the query, so a search for anything these
                do not match removed Cash and Other too - exactly when they are most
                needed. Keeping them rendered is honest; giving them hidden keywords that
                match every query would make the list claim they MATCH "paypal", which
                they do not. */}
            <CommandGroup forceMount heading="Something else">
              <CommandItem forceMount value="Cash" data-checked={chosen === cash_method} onSelect={() => choose(cash_method)}>
                <MethodIcon method={cash_method} />
                Cash
              </CommandItem>
              <CommandItem
                forceMount
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
