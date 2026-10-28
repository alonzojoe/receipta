import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import toast from 'react-hot-toast'

import type { ReceiptInput } from '@/entities/receipt'
import { cn } from '@/shared/lib/utils'
import { Section } from '@/shared/ui/section'

import { make_default_values } from '../model/receipt_form_values'
import { step_labels } from '../model/step_rules'
import { timeline_details } from '../model/timeline_details'
import { useDraftAutosave } from '../model/use_draft_autosave'
import { useReceiptForm } from '../model/use_receipt_form'
import { useReceiptWizard } from '../model/use_receipt_wizard'
import { ClearDraftButton } from './clear_draft_button'
import { StartNewDialog } from './start_new_dialog'
import { DraftStatus } from './draft_status'
import { ItemsStep } from './steps/items_step'
import { PartiesStep } from './steps/parties_step'
import { PaymentStep } from './steps/payment_step'
import { ReviewStep } from './steps/review_step'
import { StepNav } from './step_nav'
import { StepTimeline } from './step_timeline'

const step_descriptions = {
  parties: 'Who is issuing the receipt, and who it is for.',
  items: 'What was sold. Add a photo to any item.',
  payment: 'How you were paid, and when.',
  review: 'This is the receipt you will send. Check it, then download it.',
} as const

type ReceiptWizardProps = {
  /** Renders the preview and the downloads on the Review step. Required: see `ReviewStep`. */
  /** The second argument is called once a file has been saved, never on a failure. */
  render_review: (values: ReceiptInput, on_exported: () => void) => ReactNode
}

/**
 * The whole receipt form: one TanStack Form instance, a four-step wizard around it, and
 * the autosaved draft. Only the current step is in the DOM; unmounting a field keeps its
 * value in the form, so Back never loses anything.
 */
export function ReceiptWizard({ render_review }: ReceiptWizardProps) {
  const { form, initial } = useReceiptForm()
  const {
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
  } = useReceiptWizard(form, initial.step)
  const { result, discard } = useDraftAutosave(form, step_number)

  function handle_submit(event: FormEvent) {
    event.preventDefault()
    void next()
  }

  /**
   * Offered after every saved file, on the author's instruction - including the second of a
   * PDF and a PNG downloaded back to back. Keeping it simple and predictable was preferred
   * over suppressing the repeat, and the keep action is always one click and always the
   * default, so the cost of an unwanted offer is low.
   */
  const [start_new_open, set_start_new_open] = useState(false)

  function clear_draft() {
    // keepDefaultValues: without it `reset` swaps the form's defaultValues for the fresh
    // ones, and the next render's `useForm` options (still the restored draft) differ from
    // them. On an untouched form that makes TanStack re-apply the old draft over the reset.
    form.reset(make_default_values(new Date()), { keepDefaultValues: true })
    reset()
    discard()
    toast.success('Draft cleared')
  }

  return (
    <Section className="py-8 sm:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Create a receipt</h1>
        <p className="text-muted-foreground">
          Your work is saved on this device as you type.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-4 lg:gap-10">
        <div className="lg:col-span-1">
          <form.Subscribe selector={(state) => timeline_details(state.values)}>
            {(details) => <StepTimeline current={step_number} on_select={go_to} details={details} />}
          </form.Subscribe>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          <DraftStatus result={result} unreadable={initial.unreadable} />

          <form
            noValidate
            onSubmit={handle_submit}
            // overflow-anchor: Back and Next persist from step to step. Left on, the browser
            // treats them as the scroll anchor and drags the page to the bottom of a long step.
            className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm [overflow-anchor:none] sm:p-8"
          >
            <div
              key={step_name}
              ref={step_root_ref}
              className={cn(
                'flex flex-col gap-6',
                // Only after the first step change, so opening the page does not animate.
                // A short fade with a small rise; reduced motion keeps the fade only.
                navigated &&
                  'animate-in fade-in-0 slide-in-from-bottom-2 duration-200 ease-out motion-reduce:slide-in-from-bottom-0',
              )}
            >
              <div className="flex flex-col gap-1">
                <h2
                  ref={heading_ref}
                  tabIndex={-1}
                  className="scroll-mt-24 text-2xl font-semibold tracking-tight outline-none"
                >
                  {step_labels[step_name]}
                </h2>
                <p className="text-muted-foreground">{step_descriptions[step_name]}</p>
              </div>

              {step_name === 'parties' && <PartiesStep form={form} />}
              {step_name === 'items' && <ItemsStep form={form} />}
              {step_name === 'payment' && <PaymentStep form={form} />}
              {step_name === 'review' && (
                <ReviewStep form={form} go_to={go_to} render_review={(values) => render_review(values, () => set_start_new_open(true))} />
              )}
            </div>

            <StepNav
              show_back={step_number > 1}
              show_next={step_name !== 'review'}
              on_back={back}
            />
          </form>

          <div className="flex justify-end">
            <ClearDraftButton on_confirm={clear_draft} />

            <StartNewDialog
              open={start_new_open}
              on_open_change={set_start_new_open}
              on_confirm={() => {
                clear_draft()
                go_to(1)
              }}
            />
          </div>
        </div>
      </div>

      {/* One polite live region, present from the start so the first change is announced. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </Section>
  )
}
