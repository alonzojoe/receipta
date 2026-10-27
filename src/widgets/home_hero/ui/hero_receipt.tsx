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
    <div className="hero-receipt" style={style} aria-hidden="true">
      <div className="hero-receipt-sheet">
        <ReceiptDocument view={demo_receipt} />
      </div>
    </div>
  )
}
