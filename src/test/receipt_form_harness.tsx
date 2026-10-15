import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { draft_storage_key } from '@/shared/config/draft_storage_key'
import { draft_version } from '@/features/receipt_form/model/draft_schema'
import type { ReceiptFormValues } from '@/features/receipt_form/model/receipt_form_values'
import { ReceiptForm } from '@/features/receipt_form'

import { make_valid_values } from './receipt_fixtures'

/** Stores a draft the way the app does, so the wizard opens at `step` with `values`. */
export function seed_draft(step: number, values: ReceiptFormValues = make_valid_values()) {
  localStorage.setItem(draft_storage_key, JSON.stringify({ version: draft_version, step, values }))
}

export function read_stored_draft() {
  const text = localStorage.getItem(draft_storage_key)
  return text === null ? null : (JSON.parse(text) as { step: number; values: ReceiptFormValues })
}

/** Renders the whole form. `delay` is for fake-timer tests: pass `vi.advanceTimersByTime`. */
export function render_form(advance_timers?: (ms: number) => void) {
  const user = userEvent.setup(advance_timers ? { advanceTimers: advance_timers } : undefined)
  return { user, ...render(<ReceiptForm />) }
}

/**
 * A per-test budget for the few tests that walk the whole wizard. Each takes 1.2 to 2.2 s on
 * an idle machine, so they sit under the 5 s default with 2x headroom, and a CPU-saturated
 * machine takes them over it. Every other test in the suite finishes in under half a second,
 * so the global default stays at 5 s and only these four name a larger budget.
 */
export const whole_flow_timeout = 20_000
