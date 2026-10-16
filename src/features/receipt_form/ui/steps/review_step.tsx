import type { ReactNode } from 'react'
import { LuInfo, LuPencil } from 'react-icons/lu'

import type { ReceiptInput } from '@/entities/receipt'
import { Button } from '@/shared/ui/button'

import type { StepNumber } from '../../model/step_rules'
import type { ReceiptFormApi } from '../../model/use_receipt_form'

type ReviewStepProps = {
  form: ReceiptFormApi
  go_to: (step: StepNumber) => void
  /**
   * Fills the rest of the step: the preview and the downloads. A required slot, so Review
   * can never render without the document. It is a prop because this feature may not import
   * the export feature (one feature never imports another); the page that composes the two
   * passes it in.
   */
  render_review: (values: ReceiptInput) => ReactNode
}

const edit_links = [
  { label: 'Parties', step: 1 },
  { label: 'Items', step: 2 },
  { label: 'Payment', step: 3 },
] as const

/**
 * The Review step: the notice, a row to go back and edit, and whatever `render_review` gives
 * (the real document and the downloads). There is no second summary of the same data to keep
 * in sync with it. Back stays in the step navigation below.
 */
export function ReviewStep({ form, go_to, render_review }: ReviewStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <LuInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        This is a receipt, not a BIR Official Receipt.
      </p>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <span className="text-sm text-muted-foreground">Edit:</span>
        {edit_links.map(({ label, step }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            aria-label={`Edit ${label.toLowerCase()}`}
            className="h-auto min-h-11 gap-1.5 px-2 text-base"
            onClick={() => go_to(step)}
          >
            <LuPencil aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>

      <form.Subscribe selector={(state) => state.values}>{(values) => render_review(values)}</form.Subscribe>
    </div>
  )
}
