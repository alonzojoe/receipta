import type { AnyFieldApi } from '@tanstack/react-form'

import { validate_step, type StepName } from './step_rules'
import type { ReceiptFormValues } from './receipt_form_values'

type FormHandle = { store: object }
type ValidatorArgs = { fieldApi: AnyFieldApi }

// Which step each form has had its button pressed on, so the validators (which only see
// `fieldApi.form`) and the wizard (which owns the steps) agree without threading a prop
// through every field. Keyed by the form's `store`, NOT the form object: `useForm` returns
// a spread copy of the core FormApi, so `form` in the wizard and `fieldApi.form` in a
// validator are different objects, while the store is the one thing they share. Held outside React state on purpose: reading it
// must not re-render, and it is read inside a validator, not during render.
const attempted_steps = new WeakMap<object, Set<StepName>>()

/** Called by Next before it validates: from now on the step's fields are live. */
export function mark_step_attempted(form: FormHandle, step: StepName) {
  const set = attempted_steps.get(form.store) ?? new Set<StepName>()
  set.add(step)
  attempted_steps.set(form.store, set)
}

/** Called when the step changes or the form resets: a step starts quiet again. */
export function clear_attempted_steps(form: FormHandle) {
  attempted_steps.delete(form.store)
}

/**
 * When a field shows its message, and not what counts as valid.
 *
 * - **Quiet while filling in.** There is no blur validator and no change validator that
 *   speaks first: leaving a field empty or half-typed says nothing. A form being filled
 *   in is not a form with mistakes in it.
 * - **Checked when the user presses the step's button.** Next runs `validateAllFields`
 *   with the `submit` cause, which runs `onSubmit`. That is the one moment a message
 *   appears.
 * - **Live after that, for the whole step.** Once the button has been pressed on a step,
 *   every field in it re-validates as the user types: a message clears the moment it is
 *   fixed and returns if it is broken again. This is keyed on whether the step has been
 *   attempted, NOT on whether the field is in error right now: TanStack clears
 *   `errorMap.onSubmit` on the first non-submit validation that passes, so "is in error"
 *   goes false the moment a field is fixed and the field would fall silent for good.
 * - A step the user comes back to starts quiet: leaving a step clears the flag.
 *
 * Each validator asks `validate_step` for its own path, so the gate and the message are
 * one computation. What changes here is only the timing.
 */
export function step_validators(step: StepName, path: string) {
  const compute = ({ fieldApi }: ValidatorArgs): string | undefined => {
    const values = fieldApi.form.state.values as ReceiptFormValues
    return validate_step(step, values, new Date())[path]
  }
  const live = (args: ValidatorArgs): string | undefined =>
    attempted_steps.get(args.fieldApi.form.store)?.has(step) ? compute(args) : undefined
  return { onSubmit: compute, onChange: live }
}
