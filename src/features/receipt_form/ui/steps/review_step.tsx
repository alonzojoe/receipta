import type { ReactNode } from 'react'
import { LuInfo, LuPencil } from 'react-icons/lu'

import { format_centavos } from '@/shared/lib/format_currency'
import { Button } from '@/shared/ui/button'

import { payment_method_icon, payment_method_name } from '../../model/payment_method'
import { cash_method, party_type_labels, type ReceiptFormValues } from '../../model/receipt_form_values'
import { normalise_notes } from '../../model/field_rules'
import { item_figures, summarise_receipt } from '../../model/receipt_totals'
import type { StepNumber } from '../../model/step_rules'
import type { ReceiptFormApi } from '../../model/use_receipt_form'
import { TotalsSummary } from '../totals_summary'

type ReviewStepProps = {
  form: ReceiptFormApi
  go_to: (step: StepNumber) => void
}

function ReviewSection({
  heading,
  edit_step,
  go_to,
  children,
}: {
  heading: string
  edit_step: StepNumber
  go_to: (step: StepNumber) => void
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium tracking-tight">{heading}</h3>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Edit ${heading.toLowerCase()}`}
          className="-mr-3 h-auto min-h-11 gap-2 px-3 text-base"
          onClick={() => go_to(edit_step)}
        >
          <LuPencil aria-hidden="true" />
          Edit
        </Button>
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words sm:text-right">{children}</dd>
    </div>
  )
}

function PartyRows({ name, type }: { name: string; type: ReceiptFormValues['issuer_type'] }) {
  return (
    <dl className="flex flex-col gap-2 text-base">
      <Row label="Name">{name.trim()}</Row>
      <Row label="Type">{party_type_labels[type]}</Row>
    </dl>
  )
}

/**
 * A plain, themed summary for checking the data. It is not the receipt: it has no export,
 * download or print control, because a disabled one would suggest the feature is nearly
 * here. Everything is rendered as text by React, never as HTML, and money goes through
 * `format_centavos`.
 */
export function ReviewStep({ form, go_to }: ReviewStepProps) {
  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const summary = summarise_receipt(values)
        const notes = normalise_notes(values.notes)
        const method_icon = payment_method_icon(values.payment_method)
        return (
          <div className="flex flex-col gap-6">
            <ReviewSection heading="Receipt" edit_step={3} go_to={go_to}>
              <dl className="flex flex-col gap-2 text-base">
                <Row label="Receipt No.">
                  <span className="tabular-nums">{values.receipt_no}</span>
                </Row>
                <Row label="Receipt date">{values.receipt_date}</Row>
              </dl>
            </ReviewSection>

            <ReviewSection heading="Issuer" edit_step={1} go_to={go_to}>
              <PartyRows name={values.issuer_name} type={values.issuer_type} />
            </ReviewSection>

            <ReviewSection heading="Recipient" edit_step={1} go_to={go_to}>
              <PartyRows name={values.recipient_name} type={values.recipient_type} />
            </ReviewSection>

            <ReviewSection heading="Items" edit_step={2} go_to={go_to}>
              <ul className="flex flex-col gap-3">
                {values.items.map((item) => {
                  const figures = item_figures(item)
                  return (
                    <li key={item.id} className="flex min-w-0 items-start gap-3 text-base">
                      {item.image !== null && (
                        <img
                          src={item.image}
                          alt=""
                          className="aspect-square w-1/6 max-w-14 shrink-0 rounded-md border border-border object-cover"
                        />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-6">
                        <div className="min-w-0">
                          <p className="break-words font-medium">{item.name.trim()}</p>
                          {figures && (
                            <p className="text-sm text-muted-foreground">
                              {figures.quantity} x {format_centavos(figures.unit_price)}
                            </p>
                          )}
                        </div>
                        {figures && (
                          <p className="shrink-0 tabular-nums sm:text-right">
                            {format_centavos(figures.line_total)}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              <TotalsSummary summary={summary} />

              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <LuInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                This is a receipt, not a BIR Official Receipt.
              </p>
            </ReviewSection>

            <ReviewSection heading="Payment" edit_step={3} go_to={go_to}>
              <dl className="flex flex-col gap-2 text-base">
                <Row label="Method">
                  <span className="inline-flex items-center gap-2">
                    {method_icon && (
                      <img
                        src={method_icon}
                        alt=""
                        className="size-6 shrink-0 rounded-sm object-contain"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                      />
                    )}
                    {payment_method_name(values.payment_method, values.other_method)}
                  </span>
                </Row>
                {values.payment_method !== cash_method && values.reference_no.trim() !== '' && (
                  <Row label="Reference no.">{values.reference_no.trim()}</Row>
                )}
              </dl>
            </ReviewSection>

            {notes !== '' && (
              <ReviewSection heading="Notes" edit_step={3} go_to={go_to}>
                {/* white-space: pre-wrap keeps the line breaks; React renders it as text. */}
                <p className="whitespace-pre-wrap break-words text-base">{notes}</p>
              </ReviewSection>
            )}
          </div>
        )
      }}
    </form.Subscribe>
  )
}
