import { ReceiptForm } from '@/features/receipt_form'
import { SiteHeader } from '@/widgets/site_header'

/**
 * Composition root for the receipt builder. The header is the same one the home page
 * has, so the theme switch and the way home are where people expect them.
 */
export function CreatePage() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">
        <ReceiptForm />
      </main>
    </div>
  )
}
