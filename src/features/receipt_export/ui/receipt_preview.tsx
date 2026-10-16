import type { CSSProperties } from 'react'

import { page_width, ReceiptDocument, type ReceiptView } from '@/entities/receipt'

import { preview_scale } from '../model/preview_scale'
import { useElementSize } from '../model/use_element_size'
import './receipt_preview.css'

/**
 * The real document, shrunk to fit. It is the same component and the same view-model the
 * export captures, so the preview cannot show something the file will not. The export never
 * captures this node: it mounts its own unscaled copy.
 */
export function ReceiptPreview({ view }: { view: ReceiptView }) {
  const [container_ref, container] = useElementSize()
  const [sheet_ref, sheet] = useElementSize()
  const scale = preview_scale(container.width, page_width)

  const style = {
    '--doc-width': page_width,
    '--scale': scale,
    ...(sheet.height > 0 ? { '--doc-height': sheet.height } : {}),
  } as CSSProperties

  return (
    <section
      aria-label="Receipt preview"
      className="rounded-lg border border-border bg-muted/60 p-3 sm:p-6"
    >
      <div ref={container_ref}>
        <div className="receipt-preview-frame shadow-md" style={style}>
          <div ref={sheet_ref} className="receipt-preview-sheet">
            <ReceiptDocument view={view} />
          </div>
        </div>
      </div>
    </section>
  )
}
