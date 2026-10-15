import type { AnyFieldApi } from '@tanstack/react-form'
import { useId, type ReactNode } from 'react'
import { LuCircleAlert } from 'react-icons/lu'

import { cn } from '@/shared/lib/utils'

/** What a control needs to be wired to the field, label and message. */
export type FieldControl = {
  id: string
  name: string
  value: string
  /**
   * Structural, so it fits an input's and a textarea's handler. A control that is not a
   * native input (the picker, the toggle) calls it as `onChange({ target: { value } })`.
   * Everything here is a valid DOM prop, so a native control can spread the lot.
   */
  onChange: (event: { target: { value: string } }) => void
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
  'aria-required': true | undefined
}

type FormFieldProps = {
  field: AnyFieldApi
  /** Required: a placeholder is never a label. */
  label: ReactNode
  hint?: ReactNode
  /** Shown as text beside the label, never as colour alone. */
  requirement: 'required' | 'optional'
  /** A visible "n / max" count. Plain text, deliberately not a live region. */
  count?: { current: number; max: number }
  className?: string
  children: (control: FieldControl) => ReactNode
}

/**
 * The one layout every field in the wizard goes through: label, control, optional hint,
 * and the validation message. Works with TanStack Form, not beside it: value, handlers
 * and errors all come from the field api.
 *
 * It shows whatever errors the field holds and decides nothing about when they appear:
 * `step_validators` makes a field speak only after the step's button is pressed, then
 * keeps a failed field live until it is fixed.
 */
export function FormField({
  field,
  label,
  hint,
  requirement,
  count,
  className,
  children,
}: FormFieldProps) {
  const base_id = useId()
  const id = `${base_id}-control`
  const hint_id = `${base_id}-hint`
  const error_id = `${base_id}-error`

  const { errors } = field.state.meta
  const message = errors.find((error): error is string => typeof error === 'string')
  const showing_error = message !== undefined

  const value = field.state.value
  const describedby =
    [hint !== undefined ? hint_id : undefined, showing_error ? error_id : undefined]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span className="shrink-0 text-sm text-muted-foreground">
          {requirement === 'required' ? 'Required' : 'Optional'}
        </span>
      </div>

      {children({
        id,
        name: field.name,
        value: typeof value === 'string' ? value : '',
        onChange: (event) => field.handleChange(event.target.value),
        'aria-invalid': showing_error ? true : undefined,
        'aria-describedby': describedby,
        'aria-required': requirement === 'required' ? true : undefined,
      })}

      {(hint !== undefined || count) && (
        <div className="flex items-start justify-between gap-3 text-sm text-muted-foreground">
          {hint !== undefined ? <p id={hint_id}>{hint}</p> : <span />}
          {count && (
            <span className="shrink-0 tabular-nums">
              {count.current} / {count.max}
            </span>
          )}
        </div>
      )}

      {showing_error && (
        <p id={error_id} className="flex items-start gap-1.5 text-sm text-destructive">
          <LuCircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{message}</span>
        </p>
      )}
    </div>
  )
}
