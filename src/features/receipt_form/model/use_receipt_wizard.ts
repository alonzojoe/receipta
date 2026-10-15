import { useCallback, useEffect, useRef, useState } from 'react'

import type { ReceiptFormApi } from './use_receipt_form'
import {
  step_labels,
  steps,
  validate_step,
  type StepName,
  type StepNumber,
} from './step_rules'

const last_step = steps.length

function announcement_for(number: StepNumber) {
  return `Step ${number} of ${last_step}: ${step_labels[steps[number - 1]]}`
}

/**
 * The wizard's position and its two focus rules.
 *
 * - After a step change focus moves to the step heading (never left on a button that has
 *   just unmounted) and one polite live region reads "Step N of 4: Name". Neither
 *   happens on first render, or opening the page would steal focus.
 * - When Next is refused, focus moves to the first `[aria-invalid="true"]` in the step.
 *   DOM order is visual order, so there is no second ordered list of fields to keep.
 *
 * Next is the only forward path. It validates with the pure `validate_step` over the
 * form values, then asks the library to display errors on the mounted fields. That
 * press is the only moment a message first appears (see `step_validators`). It never
 * asks the library whether the step is valid: `validateField` on an unmounted field
 * answers "valid".
 */
export function useReceiptWizard(form: ReceiptFormApi, initial_step: StepNumber) {
  const [step_number, set_step_number] = useState<StepNumber>(initial_step)
  const [announcement, set_announcement] = useState('')
  const [navigated, set_navigated] = useState(false)
  const [invalid_request, set_invalid_request] = useState(0)

  const heading_ref = useRef<HTMLHeadingElement>(null)
  const step_root_ref = useRef<HTMLDivElement>(null)
  // The step the focus effect last handled. Comparing rather than flagging "first run"
  // keeps it correct under StrictMode, which runs effects twice on mount.
  const handled_step = useRef(initial_step)

  const step_name: StepName = steps[step_number - 1]

  useEffect(() => {
    if (handled_step.current === step_number) return
    handled_step.current = step_number
    const heading = heading_ref.current
    if (!heading) return
    // preventScroll plus an explicit instant scroll: the default focus scroll follows the
    // page's `scroll-behavior: smooth`, which would glide across thousands of pixels
    // after a long step. The heading's scroll margin keeps it clear of the sticky header.
    heading.focus({ preventScroll: true })
    heading.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [step_number])

  useEffect(() => {
    if (invalid_request === 0) return
    step_root_ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [invalid_request])

  const go_to = useCallback((number: StepNumber) => {
    set_navigated(true)
    set_announcement(announcement_for(number))
    set_step_number(number)
  }, [])

  const next = useCallback(async () => {
    if (step_number === last_step) return
    const errors = validate_step(step_name, form.state.values, new Date())
    await form.validateAllFields('submit')
    if (Object.keys(errors).length === 0) {
      go_to((step_number + 1) as StepNumber)
    } else {
      set_invalid_request((count) => count + 1)
    }
  }, [form, go_to, step_name, step_number])

  const back = useCallback(() => {
    if (step_number > 1) go_to((step_number - 1) as StepNumber)
  }, [go_to, step_number])

  /** Resets to step 1 with no announcement: Clear draft announces itself with a toast. */
  const reset = useCallback(() => {
    set_navigated(false)
    set_announcement('')
    set_step_number(1)
  }, [])

  return {
    step_number,
    step_name,
    announcement,
    navigated,
    heading_ref,
    step_root_ref,
    go_to,
    next,
    back,
    reset,
  }
}
