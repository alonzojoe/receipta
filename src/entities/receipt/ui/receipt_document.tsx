import type { ReceiptView } from '../model/receipt_view'
import { page_label } from '../model/page_label'
import { ContinuationHead, FirstTop, FootBand, ItemRow, TableHead, Tail } from './receipt_blocks'

/**
 * The whole receipt as one column: what the Review step previews and what the image export
 * captures. Pure props to markup, so the same view gives the same markup every time.
 */
export function ReceiptDocument({ view }: { view: ReceiptView }) {
  return (
    <article className="receipt receipt-document">
      <FirstTop view={view} />
      <div role="table" aria-label="Items">
        <TableHead />
        {view.items.map((item, index) => (
          <ItemRow key={index} item={item} number={index + 1} reserve_column={view.has_images} />
        ))}
      </div>
      <Tail view={view} />
    </article>
  )
}

/**
 * Stand-ins for the units that exist only on a multi-page receipt, laid out at the document's
 * width so they measure exactly as they will on a page. The widest page label is used so the
 * measured height holds for any page count (it is one line either way).
 */
export function ReceiptSpecimens({ view }: { view: ReceiptView }) {
  const label = page_label(88, 88)
  return (
    <div className="receipt receipt-specimens">
      <ContinuationHead view={view} label={label} />
      <FootBand view={view} label={label} />
    </div>
  )
}

/** What the export measures: the document, then the specimens, in the same flow. */
export function ReceiptMeasure({ view }: { view: ReceiptView }) {
  return (
    <div data-measure-root>
      <ReceiptDocument view={view} />
      <ReceiptSpecimens view={view} />
    </div>
  )
}
