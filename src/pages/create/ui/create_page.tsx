import { ReceiptExportPanel } from '@/features/receipt_export'
import { ReceiptForm } from '@/features/receipt_form'
import { SiteHeader } from '@/widgets/site_header'

/**
 * Composition root for the receipt builder. The header is the same one the home page
 * has, so the theme switch and the way home are where people expect them.
 *
 * It is also where the two features meet: the form owns the wizard, the export feature owns
 * the preview and the downloads, and neither imports the other. The form gets the export
 * panel as its Review step's content.
 */
export function CreatePage() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">
        <ReceiptForm render_review={(values) => <ReceiptExportPanel values={values} />} />
      </main>
    </div>
  )
}
