import { page_label } from '../model/page_label'
import type { PageSlice } from '../model/paginate_receipt'
import type { ReceiptView } from '../model/receipt_view'
import { ContinuationHead, FirstTop, FootBand, ItemRow, TableHead, Tail } from './receipt_blocks'

type ReceiptPageProps = {
  view: ReceiptView
  page: PageSlice
  /** 1-based. */
  number: number
  count: number
}

/**
 * One paginated page of the same blocks the document uses: 600 x 849 with a 40 px margin.
 * Every page but the last ends in a foot band carrying the statement, and the last page of a
 * multi-page receipt shows `Page N of M` bottom right in its footer. A one-page receipt
 * (`only`) has neither. Every page that has item rows opens its table with the heading row.
 */
export function ReceiptPage({ view, page, number, count }: ReceiptPageProps) {
  const label = page_label(number, count)
  const starts_the_receipt = page.kind === 'only' || page.kind === 'first'
  const closes_the_receipt = page.kind === 'only' || page.kind === 'last'
  const tail_part = page.split === 'totals' || page.split === 'rest' ? page.split : 'whole'
  const shows_tail = page.split === undefined ? closes_the_receipt : page.split !== 'none'
  const shows_page_label = page.kind === 'last'

  return (
    <article className="receipt receipt-page" data-page={number}>
      <div className="receipt-page-body" data-page-body>
        {starts_the_receipt ? <FirstTop view={view} /> : <ContinuationHead view={view} label={label} />}
        {page.rows.length > 0 && (
          <div role="table" aria-label="Items">
            <TableHead />
            {page.rows.map((index) => (
              <ItemRow key={index} item={view.items[index]} number={index + 1} reserve_column={view.has_images} />
            ))}
          </div>
        )}
        {shows_tail && <Tail view={view} part={tail_part} label={shows_page_label ? label : undefined} />}
        <div className="receipt-grow" />
        {!closes_the_receipt && <FootBand view={view} label={label} />}
      </div>
    </article>
  )
}
