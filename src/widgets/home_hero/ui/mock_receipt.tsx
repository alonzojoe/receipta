import { format_currency } from '@/shared/lib/format_currency'

type MockLine = {
  name: string
  quantity: number
  unit_price: number
}

const lines: readonly MockLine[] = [
  { name: 'Ceramic mug', quantity: 3, unit_price: 250 },
  { name: 'Sticker pack', quantity: 10, unit_price: 50 },
]

const discount = 125

const subtotal = lines.reduce(
  (total, line) => total + line.quantity * line.unit_price,
  0,
)

/**
 * A rehearsal of the real receipt, not the real thing. It exists to show visitors
 * what they get, and to prove the peso formatting before the builder needs it.
 *
 * It follows the app theme, by decision: a page where one card stubbornly stays white
 * makes the theme switch look broken.
 *
 * This does NOT apply to the real receipt. The component Phase 1 builds - the one
 * html2canvas-pro rasterises - must carry fixed colours, because a theme token
 * reaching the exported node means oklch() has to resolve at export time. See
 * docs/product/tech-stack.md. This is marketing; that is the product.
 *
 * Phase 1 replaces this against the real data model. Nothing outside this widget may
 * import it.
 */
export function MockReceipt() {
  return (
    <div className="w-full max-w-sm rotate-1 rounded-xl bg-card p-6 shadow-2xl shadow-primary/10 ring-1 ring-border transition-transform duration-300 ease-out hover:rotate-0">
      <div className="flex items-start justify-between gap-4 border-b border-dashed border-border pb-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Juan Dela Cruz</span>
          <span className="text-xs text-muted-foreground">Receipt for Maria Santos</span>
        </div>
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[0.625rem] font-medium tracking-wide text-muted-foreground">
          PAID
        </span>
      </div>

      <dl className="flex flex-col gap-3 py-4">
        {lines.map((line) => (
          <div key={line.name} className="flex items-baseline justify-between gap-4">
            <dt className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-foreground">{line.name}</span>
              <span className="text-xs text-muted-foreground">
                {line.quantity} &times; {format_currency(line.unit_price)}
              </span>
            </dt>
            <dd className="shrink-0 text-sm tabular-nums text-foreground">
              {format_currency(line.quantity * line.unit_price)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 border-t border-dashed border-border pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{format_currency(subtotal)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
          <span>Discount</span>
          <span className="tabular-nums">-{format_currency(discount)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-1 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{format_currency(subtotal - discount)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>GCash</span>
        <span className="tabular-nums">REF-20261011-224818</span>
      </div>
    </div>
  )
}
