import { format_centavos } from '@/shared/lib/format_currency'

import type { ReceiptSummary } from '../model/receipt_totals'

type TotalsSummaryProps = { summary: ReceiptSummary }

/**
 * Subtotal, discount and total, all through `format_centavos`. No VAT line: Receipta is
 * not a BIR Official Receipt and has no tax field. The discount row appears only when
 * there is a discount; the total reads as a dash while the discount is unusable, rather
 * than ever showing a negative amount.
 */
export function TotalsSummary({ summary }: TotalsSummaryProps) {
  const { subtotal, discount, total } = summary
  return (
    <dl className="flex flex-col gap-2 rounded-lg bg-surface-tint p-4 text-base">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{format_centavos(subtotal)}</dd>
      </div>
      {discount !== undefined && discount > 0 && (
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Discount</dt>
          <dd className="tabular-nums">-{format_centavos(discount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2 text-lg font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{total === undefined ? '-' : format_centavos(total)}</dd>
      </div>
    </dl>
  )
}
