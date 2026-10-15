import type { AnyFieldApi } from '@tanstack/react-form'

import { validate_step, type StepName } from './step_rules'
import type { ReceiptFormValues } from './receipt_form_values'

type ValidatorArgs = { fieldApi: AnyFieldApi }

/**
 * When a field shows its message, and not what counts as valid.
 *
 * - **Quiet while filling in.** There is no blur validator and no change validator that
 *   speaks first: leaving a field empty or half-typed says nothing. A form being filled
 *   in is not a form with mistakes in it.
 * - **Checked when the user presses the step's button.** Next runs `validateAllFields`
 *   with the `submit` cause, which runs `onSubmit`. That is the one moment a message
 *   appears.
 * - **Live after that, for the fields that failed.** A field showing an error
 *   re-validates as the user types, so the message clears the moment it is fixed
 *   instead of making them press Next to find out. A field that was never in error
 *   stays quiet.
 * - A step the user comes back to starts quiet: unmounting a field resets its errors.
 *
 * Each validator asks `validate_step` for its own path, so the gate and the message are
 * one computation. What changes here is only the timing.
 */
export function step_validators(step: StepName, path: string) {
  const compute = ({ fieldApi }: ValidatorArgs): string | undefined => {
    const values = fieldApi.form.state.values as ReceiptFormValues
    return validate_step(step, values, new Date())[path]
  }
  const live = (args: ValidatorArgs): string | undefined => {
    const { errorMap } = args.fieldApi.state.meta
    const showing_error = Boolean(errorMap.onSubmit || errorMap.onChange)
    return showing_error ? compute(args) : undefined
  }
  return { onSubmit: compute, onChange: live }
}
