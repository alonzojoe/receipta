import { useCallback, useEffect, useRef, useState } from 'react'

import { draft_version, type Draft } from './draft_schema'
import { clear_draft, write_draft, type WriteResult } from './draft_storage'
import type { ReceiptFormApi } from './use_receipt_form'
import type { StepNumber } from './step_rules'

/** Quiet time after the last change before the draft is written. */
export const autosave_delay_ms = 500

/**
 * Saves the draft: 500 ms after the last change, immediately when the page is hidden or
 * unloaded, and when the form unmounts (following the header link away fires neither
 * event, which would drop the last half second of typing).
 *
 * Nothing is written on mount, so an unreadable draft is not overwritten before the user
 * edits. Only a change to the values or the step counts as an edit: a blur or a shown
 * error rewrites the form's meta but not its values.
 *
 * The debounce is a plain timer rather than `useDebounceCallback`, because that hook
 * cancels its pending call when it unmounts, which is exactly when this must flush.
 */
export function useDraftAutosave(form: ReceiptFormApi, step: StepNumber) {
  /** The latest write's outcome. `null` until something has been written. */
  const [result, set_result] = useState<WriteResult | null>(null)

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dirty = useRef(false)
  const step_ref = useRef(step)
  const seen_values = useRef(form.state.values)
  const seen_step = useRef(step)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    if (!dirty.current) return
    dirty.current = false
    const draft: Draft = { version: draft_version, step: step_ref.current, values: form.state.values }
    set_result(write_draft(draft))
  }, [form])

  const schedule = useCallback(() => {
    dirty.current = true
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, autosave_delay_ms)
  }, [flush])

  useEffect(() => {
    step_ref.current = step
    if (seen_step.current !== step) {
      seen_step.current = step
      schedule()
    }
  }, [step, schedule])

  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      if (form.state.values === seen_values.current) return
      seen_values.current = form.state.values
      schedule()
    })
    return () => subscription.unsubscribe()
  }, [form, schedule])

  useEffect(() => {
    const on_visibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', on_visibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', on_visibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  /**
   * Forget the pending write and the saved draft, and start counting from the form as it
   * is now. Called by Clear draft after it has reset the form, so the reset itself is not
   * mistaken for an edit.
   */
  const discard = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    dirty.current = false
    seen_values.current = form.state.values
    seen_step.current = 1
    step_ref.current = 1
    clear_draft()
    set_result(null)
  }, [form])

  return { result, discard }
}
