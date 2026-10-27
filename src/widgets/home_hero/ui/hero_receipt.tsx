import type { CSSProperties } from 'react'

import { page_width, ReceiptDocument } from '@/entities/receipt'

import { demo_receipt } from '../model/demo_receipt'
import './hero_receipt.css'

/**
 * The real receipt on the landing page, replacing the hand-built card that stood in for it.
 *
 * It is the same component, from the same view model, that the export rasterises - so the
 * page selling the product cannot show something the product does not make. The card it
 * replaces had already drifted: a `PAID` chip that does not exist, no receipt number, no
 * payment method, no statement.
 *
 * It stays WHITE in dark mode, and that is deliberate rather than an oversight. The
 * document carries fixed colours so that an export from dark mode is identical to one from
 * light mode, and a receipt is a piece of paper: shown with a shadow and a slight tilt it
 * reads as a sheet lying on the page, not as a panel that failed to re-theme. The honest
 * alternative - a themed copy - is the mock again, a second implementation drifting from
 * the first.
 *
 * Only the top of the receipt is shown. The hero is not the place to read a whole document,
 * and the fade at the bottom says there is more rather than pretending the page ends there.
 */
export function HeroReceipt() {
  const style = { '--doc-width': page_width } as CSSProperties

  return (
    // The frame stays interactive and the SHEET is inert, not the other way round. `inert`
    // also disables pointer events, so putting it on the frame killed the hover that
    // straightens the tilt - the one piece of the old mock worth keeping.
    //
    // inert rather than aria-hidden alone, because the document's footer carries two real
    // links - the credit and the printed address - and aria-hidden hides them from a
    // screen reader while leaving them tabbable. A keyboard user would land on links they
    // cannot see, inside a frame clipped at 420px, so focusing one scrolls the clipped
    // sheet and shifts it.
    <div className="hero-receipt" style={style}>
      <div className="hero-receipt-sheet" aria-hidden="true" inert>
        <ReceiptDocument view={demo_receipt} />
      </div>
    </div>
  )
}
